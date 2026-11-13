import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTreatment, historyInsights } from '../src/lib/care';
import { googleEnvironment, singaporeEnvironment, pollenLevel } from '../src/lib/environment';
import { validateCare } from '../src/lib/validation';
import { INITIAL_CAT_PROFILE } from '../src/constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
const med = { id: '1', name: 'Inhaler', dosage: '1 puff', frequency: 'twice daily', stock: 10, totalStock: 10, type: 'Inhaler' as const, reminders: ['08:00', '20:00'] };
const now = new Date(2026, 10, 13, 10);
test('keeps overdue doses visible, skips recorded slots and rolls over after all doses', () => {
  const first = nextTreatment([med], [], now)!;
  assert.equal(first.time, '08:00');
  const taken = { id: 't', medicationId: '1', timestamp: now, status: 'Taken' as const, scheduledFor: first.date.toISOString() };
  const second = nextTreatment([med], [taken], now)!;
  assert.equal(second.time, '20:00');
  const missed = { ...taken, id: 'm', scheduledFor: second.date.toISOString(), status: 'Missed' as const };
  assert.equal(nextTreatment([med], [taken, missed], now)!.date.getDate(), 14);
  assert.equal(nextTreatment([{ ...med, reminders: [] }], [], now), undefined);
});
test('insights exclude old and future logs; humidity is missing rather than invented', () => {
  const log = { id: '1', timestamp: now, severity: 'Mild' as const, duration: '1 minute', triggers: ['Dust'], notes: '' };
  const insights = historyInsights([log, { ...log, id: '2', timestamp: new Date(2025, 1, 1), triggers: ['Pollen'] }], now);
  assert.equal(insights.counts.find(t => t.name === 'Dust')!.value, 1);
  assert.equal(insights.counts.find(t => t.name === 'Pollen')!.value, 0);
  assert.equal(insights.days[6].humidity, null);
  assert.match(insights.summary, /Dust/);
});
test('storage restores Dates and zero stock, rejects invalid records', () => {
  const care = { profile: INITIAL_CAT_PROFILE, meds: [{ ...med, stock: 0 }], history: [], treatments: [{ id: 't', medicationId: '1', timestamp: now, status: 'Taken' }] };
  const restored = validateCare(JSON.parse(JSON.stringify(care)));
  assert.equal(restored.meds[0].stock, 0);
  assert.ok(restored.treatments[0].timestamp instanceof Date);
  assert.throws(() => validateCare({}));
  assert.throws(() => validateCare({ ...care, meds: [{ ...med, stock: -1 }] }));
});
test('universal AQI uses higher-is-better scale and all pollen types', () => {
  const air = { indexes: [{ code: 'uaqi', aqi: 90 }], dateTime: now.toISOString() };
  assert.equal(googleEnvironment(air, null).riskLevel, 'Low');
  assert.equal(googleEnvironment({ ...air, indexes: [{ code: 'uaqi', aqi: 0 }] }, null).riskLevel, 'High');
  const data = googleEnvironment(air, { dailyInfo: [{ pollenTypeInfo: [{ code: 'GRASS', indexInfo: { value: 5 } }] }] });
  assert.equal(data.riskLevel, 'High'); assert.equal(data.humidity, null); assert.equal(data.pollen.tree, 'Unavailable');
  assert.equal(pollenLevel(undefined), 'Unavailable'); assert.equal(pollenLevel(0), 'Low');
  assert.throws(() => googleEnvironment({}, null));
});
test('Singapore keeps PSI distinct from AQI and does not fabricate humidity or pollen', () => {
  const psi = { region_metadata: [{ name: 'west', label_location: { latitude: 1.3, longitude: 103.7 } }], items: [{ timestamp: now.toISOString(), readings: { psi_twenty_four_hourly: { west: 55 } } }] };
  const data = singaporeEnvironment(psi, {}, 1.3, 103.7);
  assert.equal(data.indexLabel, '24-hour PSI'); assert.equal(data.riskLevel, 'Medium'); assert.equal(data.pollen.tree, 'Unavailable'); assert.equal(data.humidity, null);
});
test('PDF export generates an actual document using the explicit plugin function', () => {
  const doc = new jsPDF(); autoTable(doc, { head: [['Date', 'Severity']], body: [['2026-11-13', 'Mild']] });
  assert.ok(doc.output('arraybuffer').byteLength > 1000);
});
