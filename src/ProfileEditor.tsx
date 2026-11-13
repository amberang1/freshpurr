import { useState } from 'react';
import type { CatProfile } from './types';
export function ProfileEditor({ profile, onSave }: { profile: CatProfile; onSave: (profile: CatProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const input = 'block w-full p-3 mt-1 rounded-xl bg-slate-50 border border-slate-200';
  return <form className="p-6 bg-white rounded-3xl space-y-4" onSubmit={e => { e.preventDefault(); onSave({ ...draft, name: draft.name.trim() }); setSaved(true); }} onChange={() => setSaved(false)}>
    <h3 className="font-bold">Edit cat & vet profile</h3>
    <label className="block text-sm">Cat name<input className={input} required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
    <label className="block text-sm">Breed<input className={input} value={draft.breed} onChange={e => setDraft({ ...draft, breed: e.target.value })} /></label>
    <label className="block text-sm">Age (years)<input className={input} type="number" min="0" max="40" step="0.1" required value={draft.age} onChange={e => setDraft({ ...draft, age: Number(e.target.value) })} /></label>
    <label className="block text-sm">Diagnosis date<input className={input} type="date" value={draft.diagnosisDate} onChange={e => setDraft({ ...draft, diagnosisDate: e.target.value })} /></label>
    <label className="block text-sm">Known triggers (comma separated)<input className={input} value={draft.knownTriggers.join(',')} onChange={e => setDraft({ ...draft, knownTriggers: e.target.value.split(',') })} /></label>
    {(['name', 'phone', 'email'] as const).map(field => <label key={field} className="block text-sm">Vet {field}<input className={input} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={draft.vetContact[field]} onChange={e => setDraft({ ...draft, vetContact: { ...draft.vetContact, [field]: e.target.value } })} /></label>)}
    <button className="bg-emerald-600 text-white rounded-xl p-3" disabled={!draft.name.trim()}>Save profile</button>{saved && <span role="status" className="ml-3 text-emerald-700">Profile updated</span>}
  </form>;
}
