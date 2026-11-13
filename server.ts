import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { googleEnvironment, singaporeEnvironment } from './src/lib/environment';

const app = express();
app.disable('x-powered-by');
const cache = new Map<string, { expires: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const limits = new Map<string, { start: number; count: number }>();
let globalWindow = { start: Date.now(), count: 0 };
const budget = Math.max(1, Number(process.env.API_UPSTREAM_LIMIT_PER_HOUR) || 200);

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Cross-site API calls are not allowed.' });
  const ip = req.ip || 'unknown', now = Date.now();
  for (const [key, limit] of limits) if (now - limit.start >= 60000) limits.delete(key);
  if (!limits.has(ip) && limits.size >= 10000) return res.status(429).json({ error: 'Server busy. Try again shortly.' });
  const limit = limits.get(ip) || { start: now, count: 0 };
  limits.set(ip, limit);
  if (++limit.count > 30) { res.setHeader('Retry-After', '60'); return res.status(429).json({ error: 'Too many requests. Try again in a minute.' }); }
  next();
});
async function cached(key: string, load: () => Promise<unknown>) {
  const now = Date.now();
  for (const [k, entry] of cache) if (entry.expires < now) cache.delete(k);
  if (cache.has(key)) return cache.get(key)!.data;
  if (pending.has(key)) return pending.get(key);
  const promise = load().then(data => {
    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { data, expires: Date.now() + 300000 }); return data;
  }).finally(() => pending.delete(key));
  pending.set(key, promise); return promise;
}
async function upstream(url: string, init?: RequestInit) {
  if (Date.now() - globalWindow.start > 3600000) globalWindow = { start: Date.now(), count: 0 };
  if (++globalWindow.count > budget) throw Object.assign(new Error('Environmental service request limit reached. Try again later.'), { status: 429 });
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('The environmental provider is temporarily unavailable.');
  return response.json();
}
app.get('/api/environment', async (req, res) => {
  const rawLat = req.query.latitude, rawLng = req.query.longitude;
  if (typeof rawLat !== 'string' || typeof rawLng !== 'string' || !rawLat.trim() || !rawLng.trim()) return res.status(400).json({ error: 'Latitude and longitude are required.' });
  const latitude = Number(rawLat), longitude = Number(rawLng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return res.status(400).json({ error: 'Invalid coordinates.' });
  try {
    const singapore = latitude >= 1.13 && latitude <= 1.48 && longitude >= 103.59 && longitude <= 104.04;
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!singapore && !key) return res.status(503).json({ error: 'Global environmental data is not configured. Singapore readings remain available.' });
    const data = await cached(`env:${latitude.toFixed(2)}:${longitude.toFixed(2)}`, async () => {
      if (singapore) {
        const sources: any = await cached('nea', async () => {
          const [psi, pm25] = await Promise.all([upstream('https://api.data.gov.sg/v1/environment/psi'), upstream('https://api.data.gov.sg/v1/environment/pm25')]);
          if (!psi.items?.length || !pm25.items?.length) throw new Error('Singapore readings are unavailable.');
          return { psi, pm25 };
        });
        return singaporeEnvironment(sources.psi, sources.pm25, latitude, longitude);
      }
      const air = await upstream(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(key!)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: { latitude, longitude }, universalAqi: true }) });
      const pollen = await upstream(`https://pollen.googleapis.com/v1/forecast:lookup?key=${encodeURIComponent(key!)}&location.latitude=${latitude}&location.longitude=${longitude}&days=1`).catch(() => null);
      return googleEnvironment(air, pollen);
    });
    res.json(data);
  } catch (error: any) { res.status(error.status || 502).json({ error: error.message || 'Environmental readings are unavailable.' }); }
});
app.get('/api/geocode', async (req, res) => {
  const address = req.query.address;
  if (typeof address !== 'string' || !address.trim() || address.length > 200) return res.status(400).json({ error: 'Enter a location of 1–200 characters.' });
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(503).json({ error: 'Location search is not configured. Use your current location instead.' });
  try {
    const data: any = await cached(`geo:${address.trim().toLowerCase()}`, async () => {
      const result = await upstream(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${encodeURIComponent(key)}`);
      if (!['OK', 'ZERO_RESULTS'].includes(result.status)) throw new Error('Location search is temporarily unavailable.');
      return result;
    });
    res.json(data);
  } catch (error: any) { res.status(error.status || 502).json({ error: error.message }); }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares);
  } else {
    const dist = path.resolve('dist'); app.use(express.static(dist)); app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`));
}
startServer();
