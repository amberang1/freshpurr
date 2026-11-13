import type { CatProfile, Medication, SymptomLog, TreatmentHistory } from '../types';
export function validateCare(value: unknown): { profile: CatProfile; meds: Medication[]; history: SymptomLog[]; treatments: TreatmentHistory[] } {
  const v = value as any;
  const fail = () => { throw new Error('Invalid saved care data'); };
  if (!v || !v.profile || !Array.isArray(v.meds) || !Array.isArray(v.history) || !Array.isArray(v.treatments)) return fail();
  for (const key of ['name', 'breed', 'diagnosisDate']) if (typeof v.profile[key] !== 'string') return fail();
  if (!Number.isFinite(v.profile.age) || v.profile.age < 0 || !Array.isArray(v.profile.knownTriggers) || !v.profile.knownTriggers.every((t: unknown) => typeof t === 'string') || !v.profile.vetContact) return fail();
  for (const key of ['name', 'phone', 'email']) if (typeof v.profile.vetContact[key] !== 'string') return fail();
  const ids = new Set();
  for (const m of v.meds) {
    if (typeof m.id !== 'string' || ids.has(m.id) || !['name', 'dosage', 'frequency'].every(k => typeof m[k] === 'string') || !['Oral', 'Inhaler'].includes(m.type) || !Number.isInteger(m.stock) || m.stock < 0 || !Number.isInteger(m.totalStock) || m.totalStock < m.stock || !Array.isArray(m.reminders) || !m.reminders.every((t: unknown) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return fail();
    ids.add(m.id);
  }
  const date = (t: unknown) => { if (!(t instanceof Date) && typeof t !== 'string') return fail(); const d = new Date(t as string); if (!Number.isFinite(+d)) return fail(); return d; };
  return { ...v, history: v.history.map((l: any) => {
    if (typeof l.id !== 'string' || !['Mild', 'Moderate', 'Severe'].includes(l.severity) || typeof l.duration !== 'string' || typeof l.notes !== 'string' || !Array.isArray(l.triggers) || !l.triggers.every((t: unknown) => typeof t === 'string')) return fail();
    return { ...l, timestamp: date(l.timestamp) };
  }), treatments: v.treatments.map((t: any) => {
    if (typeof t.id !== 'string' || typeof t.medicationId !== 'string' || !['Taken', 'Missed'].includes(t.status)) return fail();
    if (t.scheduledFor) date(t.scheduledFor);
    return { ...t, timestamp: date(t.timestamp) };
  }) };
}
