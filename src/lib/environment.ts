import type { EnvironmentalData, PollenLevel } from '../types';
export const pollenLevel = (value: unknown): PollenLevel => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 5 ? 'Unavailable' : value >= 4 ? 'High' : value >= 3 ? 'Moderate' : 'Low';
export function googleEnvironment(air: any, pollen: any): EnvironmentalData {
  const index = air.indexes?.find((i: any) => i.code === 'uaqi');
  if (!Number.isFinite(index?.aqi)) throw new Error('No universal air quality reading is available for this location.');
  const levels = (type: string) => pollenLevel(pollen?.dailyInfo?.[0]?.pollenTypeInfo?.find((p: any) => p.code === type)?.indexInfo?.value);
  const tree = levels('TREE'), grass = levels('GRASS'), weed = levels('WEED');
  return { aqi: index.aqi, indexLabel: 'Universal AQI (higher is better)', humidity: null, pollen: { tree, grass, weed }, riskLevel: index.aqi < 40 || [tree, grass, weed].includes('High') ? 'High' : index.aqi < 60 || [tree, grass, weed].includes('Moderate') ? 'Medium' : 'Low', observedAt: air.dateTime, prediction: 'Outdoor air quality and available pollen readings. Humidity is unavailable. This is an environmental indicator, not a prediction of an asthma attack.' };
}
export function singaporeEnvironment(psi: any, pm25: any, latitude: number, longitude: number): EnvironmentalData {
  const regions = psi.region_metadata?.filter((r: any) => r.name !== 'national' && r.label_location);
  if (!regions?.length) throw new Error('Singapore monitoring regions are unavailable.');
  const nearest = [...regions].sort((a, b) => Math.hypot(a.label_location.latitude - latitude, a.label_location.longitude - longitude) - Math.hypot(b.label_location.latitude - latitude, b.label_location.longitude - longitude))[0].name;
  const aqi = psi.items?.[0]?.readings?.psi_twenty_four_hourly?.[nearest];
  if (!Number.isFinite(aqi)) throw new Error('Singapore PSI readings are unavailable.');
  const pm = pm25.items?.[0]?.readings?.pm25_one_hourly?.[nearest];
  return { aqi, indexLabel: '24-hour PSI', humidity: null, pollen: { tree: 'Unavailable', grass: 'Unavailable', weed: 'Unavailable' }, riskLevel: aqi > 100 ? 'High' : aqi > 50 ? 'Medium' : 'Low', observedAt: psi.items[0].timestamp, prediction: `NEA ${nearest} region.${Number.isFinite(pm) ? ` 1-hour PM2.5: ${pm} µg/m³.` : ''} Humidity and pollen readings are unavailable. PSI describes outdoor air, not an individual cat’s asthma risk.` };
}
