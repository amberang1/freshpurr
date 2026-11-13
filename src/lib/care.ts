import { format, isSameDay, startOfDay, subDays } from 'date-fns';
import type { Medication, SymptomLog, TreatmentHistory } from '../types';

export function nextTreatment(meds: Medication[], treatments: TreatmentHistory[], now = new Date()) {
  return meds.flatMap(med => med.reminders.flatMap(time => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return [];
    const [hours, minutes] = time.split(':').map(Number);
    const date = startOfDay(now);
    date.setHours(hours, minutes);
    const recorded = treatments.some(t => t.medicationId === med.id && t.scheduledFor && +new Date(t.scheduledFor) === +date);
    if (recorded) date.setDate(date.getDate() + 1);
    return [{ med, date, time }];
  })).sort((a, b) => +a.date - +b.date)[0];
}

export function historyInsights(history: SymptomLog[], now = new Date()) {
  const recent = history.filter(l => l.timestamp >= subDays(startOfDay(now), 29) && l.timestamp <= now);
  const counts = ['Pollen', 'Dust', 'Cold Air', 'Exercise', 'Stress', 'Other'].map(name => ({ name, value: recent.filter(l => l.triggers.includes(name)).length }));
  const top = [...counts].sort((a, b) => b.value - a.value)[0];
  return {
    counts,
    summary: top.value ? `${top.name} was the most frequently recorded suspected trigger: ${top.value} of ${recent.length} logs (${Math.round(top.value / recent.length * 100)}%). This does not establish a cause.` : 'No suspected triggers recorded in the last 30 days.',
    days: Array.from({ length: 7 }, (_, i) => {
      const date = subDays(startOfDay(now), 6 - i);
      const logs = history.filter(l => isSameDay(l.timestamp, date));
      const humidity = logs.flatMap(l => Number.isFinite(l.humidity) ? [l.humidity!] : []);
      return { name: format(date, 'EEE'), symptoms: logs.length, humidity: humidity.length ? Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length) : null };
    }),
  };
}
