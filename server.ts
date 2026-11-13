import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Air Quality
  app.post("/api/air-quality", async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not set on the server.");
      return res.status(500).json({ error: "API key not configured on server" });
    }

    try {
      const response = await fetch(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Air Quality API Error Response:", data);
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Air Quality Proxy Fetch Error:", error);
      res.status(500).json({ error: "Failed to connect to Air Quality API" });
    }
  });

  // API Proxy for Pollen
  app.get("/api/pollen", async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not set on the server.");
      return res.status(500).json({ error: "API key not configured on server" });
    }

    const { latitude, longitude, days } = req.query;

    try {
      const response = await fetch(`https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${latitude}&location.longitude=${longitude}&days=${days}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Pollen API Error Response:", data);
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Pollen Proxy Fetch Error:", error);
      res.status(500).json({ error: "Failed to connect to Pollen API" });
    }
  });

  // API Proxy for Geocoding
  app.get("/api/geocode", async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not set on the server.");
      return res.status(500).json({ error: "API key not configured on server" });
    }

    const { address } = req.query;

    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address as string)}&key=${apiKey}`);
      const data = await response.json();
      
      if (!response.ok || data.status !== 'OK') {
        console.error("Geocoding API Error Response:", data);
        // Geocoding API returns 200 even for errors sometimes, but with a status field
        return res.status(response.ok ? 200 : response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Geocoding Proxy Fetch Error:", error);
      res.status(500).json({ error: "Failed to connect to Geocoding API" });
    }
  });

  // API Proxy for Singapore NEA data (PSI and PM2.5)
  app.get("/api/singapore-env", async (req, res) => {
    try {
      const [psiResponse, pm25Response] = await Promise.all([
        fetch("https://api.data.gov.sg/v1/environment/psi"),
        fetch("https://api.data.gov.sg/v1/environment/pm25")
      ]);

      const [psiData, pm25Data] = await Promise.all([
        psiResponse.json(),
        pm25Response.json()
      ]);

      res.json({ psi: psiData, pm25: pm25Data });
    } catch (error) {
      console.error("Singapore NEA Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch Singapore environmental data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
