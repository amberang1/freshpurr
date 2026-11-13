import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Pill, 
  Cloud, 
  BarChart3,
  Settings as SettingsIcon,
  PlusCircle,
  AlertTriangle,
  Wind,
  Droplets,
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle2,
  X,
  FileText,
  Phone,
  Mail,
  User,
  Heart,
  Stethoscope,
  Info,
  Thermometer,
  Sparkles,
  Leaf,
  Search,
  MapPin,
  Trash2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, isSameDay } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { nextTreatment, historyInsights } from './lib/care';
import { useCareStorage } from './lib/storage';
import { ProfileEditor } from './ProfileEditor';
import { validateCare } from './lib/validation';
import { cn } from './lib/utils';
import { 
  CatProfile, 
  EnvironmentalData, 
  Medication, 
  SymptomLog, 
  Severity,
  TreatmentHistory
} from './types';
import { 
  INITIAL_CAT_PROFILE, 
  INITIAL_MEDICATIONS, 
  MOCK_ENVIRONMENTAL_DATA, 
  MOCK_SYMPTOM_HISTORY 
} from './constants';

// --- Components ---

const Header = ({ profile, onNotify }: { profile: CatProfile, onNotify: () => void }) => (
  <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-white/70 backdrop-blur-2xl border-b border-emerald-100/50">
    <div className="flex items-center gap-3">
      <div>
        <h1 className="text-3xl font-serif text-emerald-900 leading-none italic">Breeze</h1>
      </div>
    </div>
    <button aria-label="Notifications"
      onClick={onNotify}
      className="w-10 h-10 flex items-center justify-center rounded-full text-emerald-800 hover:bg-emerald-50 transition-colors"
    >
      <Bell className="w-5 h-5" />
    </button>
  </header>
);

const Navigation = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'symptoms', label: 'Log', icon: Activity },
    { id: 'meds', label: 'Meds', icon: Pill },
    { id: 'environment', label: 'Env', icon: Cloud },
    { id: 'settings', label: 'Profile', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-2 pb-6 bg-white/90 backdrop-blur-3xl border-t border-emerald-100/50 shadow-[0_-8px_32px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300 px-2 py-1.5 rounded-xl flex-1",
              isActive ? "bg-emerald-100 text-emerald-900" : "text-slate-400 hover:text-emerald-600"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "fill-emerald-900/10")} />
            <span className="text-[9px] font-bold uppercase tracking-tighter mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const RiskCard = ({ data, isLoading, error, onRetry, onChangeLocation, locationName }: { data: EnvironmentalData, isLoading: boolean, error: string | null, onRetry: () => void, onChangeLocation: () => void, locationName: string }) => {
  const riskColors = {
    Unavailable: "bg-slate-50 text-slate-600 border-slate-100",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Medium: "bg-amber-50 text-amber-700 border-amber-100",
    High: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const riskDot = {
    Unavailable: "bg-slate-400",
    Low: "bg-emerald-500",
    Medium: "bg-amber-500",
    High: "bg-rose-500",
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl border border-slate-100 bg-white animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <div className="w-20 h-2 bg-slate-100 rounded"></div>
            <div className="w-32 h-8 bg-slate-100 rounded"></div>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded mb-6"></div>
        <div className="flex gap-3">
          <div className="w-20 h-8 bg-slate-100 rounded-full"></div>
          <div className="w-20 h-8 bg-slate-100 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl border border-rose-100 bg-rose-50 text-rose-700">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold">Environmental Data Error</h3>
        </div>
        <p className="text-sm mb-6 opacity-80">{error}</p>
        <div className="flex gap-3">
          <button 
            onClick={onRetry}
            className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            Try Again
          </button>
          <button 
            onClick={onChangeLocation}
            className="bg-white text-rose-600 border border-rose-200 px-6 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            Change Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 rounded-3xl border transition-all duration-500", riskColors[data.riskLevel])}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Environmental Risk</h3>
            <button 
              onClick={onChangeLocation}
              className="flex items-center gap-1 text-[9px] font-bold bg-white/30 px-2 py-0.5 rounded-full hover:bg-white/50 transition-colors"
            >
              <MapPin className="w-2 h-2" />
              {locationName}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full animate-pulse", riskDot[data.riskLevel])}></span>
            <p className="text-3xl font-bold tracking-tight">{data.riskLevel === 'Unavailable' ? 'Data unavailable' : `${data.riskLevel} Risk`}</p>
          </div>
        </div>
        <div className="p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
          <Wind className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm font-medium leading-relaxed mb-6 opacity-90">{data.prediction}</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm">
          <Activity className="w-3 h-3" />
          {data.indexLabel || 'AQI'} {data.aqi ?? 'Unavailable'}
        </div>
        <div className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm">
          <Droplets className="w-3 h-3" />
          Humidity {data.humidity === null ? 'unavailable' : `${data.humidity}%`}
        </div>
      </div>
    </div>
  );
};

const QuickLogButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full bg-rose-500 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-rose-200 active:scale-95 transition-all group"
  >
    <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
      <Plus className="w-8 h-8" />
    </div>
    <div className="text-center">
      <h3 className="text-xl font-bold">Log Symptom</h3>
    </div>
  </button>
);

const NextMedCard = ({ med, due }: { med: Medication | undefined, due?: Date }) => (
  <div className="bg-emerald-900 text-white p-6 rounded-3xl relative overflow-hidden group">
    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-4 opacity-70">
        <Pill className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Next Treatment</span>
      </div>
      {med ? (
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-bold mb-1">{due ? format(due, 'MMM d, HH:mm') : 'Not scheduled'}</p>
            <p className="text-emerald-200 font-medium">{med.name}</p>
          </div>
          <div className="bg-emerald-800 p-3 rounded-2xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xl font-bold mb-1">No treatments scheduled</p>
            <p className="text-emerald-200/60 font-medium text-xs italic">Add reminder times in the Meds tab</p>
          </div>
          <div className="bg-emerald-800 p-3 rounded-2xl">
            <Pill className="w-6 h-6 text-emerald-400/50" />
          </div>
        </div>
      )}
    </div>
  </div>
);

const AddMedicationModal = ({ isOpen, onClose, onSave, initial }: { isOpen: boolean, onClose: () => void, onSave: (med: Partial<Medication>) => void, initial?: Medication }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [frequency, setFrequency] = useState(initial?.frequency ?? '');
  const [type, setType] = useState<'Oral' | 'Inhaler'>(initial?.type ?? 'Oral');
  const [stock, setStock] = useState(initial?.stock ?? 30);
  const [reminder, setReminder] = useState(initial?.reminders.join(', ') ?? '08:00');
  const times = reminder.split(',').map(t => t.trim()).filter(Boolean);
  const valid = name.trim() && dosage.trim() && Number.isInteger(stock) && stock >= 0 && times.every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{initial ? 'Edit Medication' : 'Add Medication'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Medication Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flovent, Prednisolone" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Dosage</label>
              <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 1 puff, 5mg" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Frequency</label>
              <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Twice daily" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['Oral', 'Inhaler'].map((t) => (
                <button key={t} onClick={() => setType(t as any)} className={cn("p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2", type === t ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-transparent text-slate-500")}>
                  {t === 'Inhaler' ? <Wind className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                  <span className="text-xs font-bold">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Current Stock</label>
              <input aria-label="Current Stock" min="0" step="1" type="number" value={Number.isFinite(stock) ? stock : ''} onChange={(e) => setStock(e.target.value === '' ? NaN : Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Reminder Time</label>
              <input aria-label="Reminder times" type="text" placeholder="08:00, 20:00 (blank for as needed)" value={reminder} onChange={(e) => setReminder(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>

          <p className="text-xs text-slate-500">Use 24-hour times separated by commas. Blank means as needed. Stock counts doses remaining.</p>
          <button disabled={!valid} onClick={() => { if (!valid) return; onSave({ name: name.trim(), dosage: dosage.trim(), frequency, type, stock, totalStock: Math.max(stock, initial?.totalStock ?? stock), reminders: [...new Set(times)] }); onClose(); }} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all">Save Medication</button>
        </div>
      </motion.div>
    </div>
  );
};

const LogAttackModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (log: Partial<SymptomLog>) => void }) => {
  const [severity, setSeverity] = useState<Severity>('Moderate');
  const [duration, setDuration] = useState('1-5 mins');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const triggerOptions = ['Pollen', 'Dust', 'Cold Air', 'Exercise', 'Stress', 'Other'];
  const durationOptions = ['Under 1 min', '1-5 mins', '5-10 mins', '10+ mins'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Log Attack</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Severity */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Severity Level</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Mild', 'Moderate', 'Severe'] as Severity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                    severity === s 
                      ? "bg-rose-50 border-rose-500 text-rose-700" 
                      : "bg-slate-50 border-transparent text-slate-500"
                  )}
                >
                  <Activity className={cn("w-6 h-6", severity === s ? "text-rose-500" : "text-slate-300")} />
                  <span className="text-xs font-bold">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Duration</label>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-xs font-bold transition-all",
                    duration === d 
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Triggers</label>
            <div className="flex flex-wrap gap-2">
              {triggerOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTriggers(prev => 
                    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                  )}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-xs font-bold transition-all border-2",
                    triggers.includes(t) 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                      : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe behavior, sounds, or actions taken..."
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 min-h-[100px] resize-none"
            />
          </div>

          <button
            onClick={() => {
              onSave({ severity, duration, triggers, notes, timestamp: new Date() });
              onClose();
            }}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all"
          >
            Save Log
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LocationSearchModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (name: string, lat: number, lng: number) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const searchId = useRef(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const id = ++searchId.current;
    setResults([]); setIsSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (id !== searchId.current) return;
      if (response.ok && data.status === 'OK') {
        setResults(data.results);
      } else {
        setError(data.error || data.error_message || "No results found. Please try a different location.");
      }
    } catch (err) {
      setError("Failed to search location. Please check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Change Location</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search city, zip code, or address..."
              className="w-full bg-slate-50 border-none rounded-2xl p-5 pr-14 text-sm focus:ring-2 focus:ring-emerald-500/20"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-3 top-3 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            {results.map((res) => (
              <button
                key={res.place_id}
                onClick={() => onSelect(res.formatted_address, res.geometry.location.lat, res.geometry.location.lng)}
                className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 flex items-start gap-3"
              >
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{res.formatted_address}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Select this location</p>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                onSelect("Current Location", pos.coords.latitude, pos.coords.longitude);
              });
            }}
            className="w-full flex items-center justify-center gap-2 p-4 text-emerald-600 font-bold text-sm hover:bg-emerald-50 rounded-2xl transition-colors"
          >
            <Activity className="w-4 h-4" />
            Use Current Location
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [care, setCare, storageError, restoreCare] = useCareStorage('breeze_care_v1', { profile: INITIAL_CAT_PROFILE, meds: INITIAL_MEDICATIONS, history: MOCK_SYMPTOM_HISTORY, treatments: [] as TreatmentHistory[] }, validateCare);
  const { profile, meds, history, treatments } = care;
  const setProfile = (profile: CatProfile) => setCare(c => ({ ...c, profile }));
  const [editingMed, setEditingMed] = useState<Medication | undefined>();
  const [clock, setClock] = useState(new Date());
  const requestId = useRef(0);
  const next = nextTreatment(meds, treatments, clock);
  const insights = historyInsights(history, clock);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notified = useRef(new Set<string>());
  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 15000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    meds.forEach(med => med.reminders.forEach(time => {
      const due = new Date(clock); const [h, m] = time.split(':').map(Number); due.setHours(h, m, 0, 0);
      const key = `${med.id}:${due.toISOString()}`;
      if (+clock >= +due && +clock - +due < 60000 && !notified.current.has(key) && !treatments.some(t => t.medicationId === med.id && t.scheduledFor === due.toISOString())) {
        notified.current.add(key); new Notification(`Treatment reminder: ${med.name}`, { body: `${med.dosage} for ${profile.name || 'your cat'}` });
      }
    }));
  }, [clock, notificationsEnabled, meds, treatments, profile.name]);
  const recordDose = (med: Medication, status: 'Taken' | 'Missed') => {
    if (status === 'Taken' && med.stock < 1) return;
    if (med.reminders.length && nextTreatment([med], treatments, new Date())?.date > new Date(new Date().setHours(23, 59, 59, 999))) return;
    const slot = nextTreatment([med], treatments, new Date());
    const scheduledFor = slot && isSameDay(slot.date, new Date()) ? slot.date.toISOString() : undefined;
    setCare(c => {
      if (scheduledFor && c.treatments.some(t => t.medicationId === med.id && t.scheduledFor === scheduledFor)) return c;
      const current = c.meds.find(m => m.id === med.id);
      if (!current || (status === 'Taken' && current.stock < 1)) return c;
      return { ...c, meds: c.meds.map(m => m.id === med.id && status === 'Taken' ? { ...m, stock: m.stock - 1 } : m), treatments: [{ id: crypto.randomUUID(), medicationId: med.id, medicationName: med.name, timestamp: new Date(), status, scheduledFor }, ...c.treatments] };
    });
  };
  const [envData, setEnvData] = useState<EnvironmentalData>(MOCK_ENVIRONMENTAL_DATA);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SymptomLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [savedLocation, setSavedLocation] = useState<{ name: string, lat: number, lng: number } | null>(() => {
    try { const saved = JSON.parse(localStorage.getItem('breeze_location') || 'null'); return saved && typeof saved.name === 'string' && Number.isFinite(saved.lat) && Number.isFinite(saved.lng) ? saved : null; } catch { return null; }
  });

  const fetchEnvData = async (lat?: number, lng?: number) => {
    const id = ++requestId.current;
    setIsLoading(true); setLocationError(null); setEnvData(MOCK_ENVIRONMENTAL_DATA);
    try {
      let latitude = lat ?? savedLocation?.lat, longitude = lng ?? savedLocation?.lng;
      if (latitude === undefined || longitude === undefined) {
        if (!navigator.geolocation) throw new Error('Location is unavailable. Please choose a location.');
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 300000 }));
        latitude = position.coords.latitude; longitude = position.coords.longitude;
      }
      const response = await fetch(`/api/environment?latitude=${latitude}&longitude=${longitude}`, { signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Environmental data is unavailable.');
      if (id === requestId.current) setEnvData(data);
    } catch (error: any) {
      if (id === requestId.current) setLocationError(error.code === 1 ? 'Location access denied. Choose a location manually.' : error.message || 'Environmental data is unavailable.');
    } finally { if (id === requestId.current) setIsLoading(false); }
  };

  const handleSelectLocation = (name: string, lat: number, lng: number) => {
    const loc = { name, lat, lng };
    setSavedLocation(loc);
    try { localStorage.setItem('breeze_location', JSON.stringify(loc)); } catch { alert('Location could not be saved on this device.'); }
    setIsLocationModalOpen(false);

  };

  useEffect(() => {
    fetchEnvData();
    const interval = setInterval(() => fetchEnvData(), 15 * 60 * 1000);
    return () => { clearInterval(interval); requestId.current++; };
  }, [savedLocation]);

  const handleSaveLog = (newLog: Partial<SymptomLog>) => {
    const log: SymptomLog = {
      id: crypto.randomUUID(),
      timestamp: newLog.timestamp || new Date(),
      severity: newLog.severity || 'Moderate',
      duration: newLog.duration || '1-5 mins',
      triggers: newLog.triggers || [],
      notes: newLog.notes || '',
      aqi: locationError || isLoading ? undefined : envData.aqi ?? undefined,
      humidity: locationError || isLoading ? undefined : envData.humidity ?? undefined,
      pollen: locationError || isLoading || envData.pollen.tree === 'Unavailable' ? undefined : envData.pollen.tree,
    };
    setCare(c => ({ ...c, history: [log, ...c.history] }));
  };

  const handleDeleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this symptom log?')) setCare(c => ({ ...c, history: c.history.filter(log => log.id !== id) }));
  };

  const handleAddMed = (newMed: Partial<Medication>) => {
    const med: Medication = {
      id: crypto.randomUUID(),
      name: newMed.name || 'Unnamed Med',
      dosage: newMed.dosage || '1 unit',
      frequency: newMed.frequency || 'Daily',
      stock: newMed.stock ?? 30,
      totalStock: newMed.totalStock ?? 30,
      type: newMed.type || 'Oral',
      reminders: newMed.reminders || ['08:00'],
    };
    setCare(c => ({ ...c, meds: editingMed ? c.meds.map(m => m.id === editingMed.id ? { ...med, id: m.id } : m) : [...c.meds, med] }));
    setEditingMed(undefined);
  };

  const generatePDF = async () => {
    try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Asthma Care Report: ${profile.name || 'My cat'}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Severity', 'Duration', 'Triggers', 'Notes']],
      body: history.map(log => [
        format(log.timestamp, 'yyyy-MM-dd, HH:mm'),
        log.severity,
        log.duration,
        log.triggers.join(', '),
        log.notes
      ]),
    });
    
    doc.save(`${profile.name || 'My_cat'}_Asthma_Report.pdf`);
    } catch { alert('The PDF could not be generated. Please try again or download a data backup.'); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <section className="grid grid-cols-1 gap-4">
              <RiskCard 
                data={envData} 
                isLoading={isLoading} 
                error={locationError} 
                onRetry={() => fetchEnvData()} 
                onChangeLocation={() => setIsLocationModalOpen(true)}
                locationName={savedLocation?.name || "Current Location"}
              />
              <QuickLogButton onClick={() => setIsLogModalOpen(true)} />
            </section>

            <section>
              <NextMedCard med={next?.med} due={next?.date} />
            </section>
          </motion.div>
        );

      case 'symptoms':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Symptom Log</h2>
                <p className="text-slate-500 mt-1">Identify patterns and triggers.</p>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl"
              >
                <PlusCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {history.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-900">No logs yet</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-[200px]">{profile.name || 'Your cat'}'s symptom history will appear here once you log an attack.</p>
                </div>
              ) : (
                history.map((log) => (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          log.severity === 'Severe' ? "bg-rose-100 text-rose-600" :
                          log.severity === 'Moderate' ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        )}>
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{log.severity} Attack</h3>
                          <p className="text-xs text-slate-400 font-medium">{format(log.timestamp, 'MMM d • h:mm a')} • {log.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleDeleteLog(log.id, e)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {log.triggers.map(t => (
                        <span key={t} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">{t}</span>
                      ))}
                    </div>
                    {log.notes && (
                      <p className="mt-4 text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">"{log.notes}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );

      case 'meds':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Medications</h2>
                <p className="text-slate-500 mt-1">Keep treatments consistent.</p>
              </div>
              <button 
                aria-label="Add medication" onClick={() => { setEditingMed(undefined); setIsAddMedModalOpen(true); }}
                className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl"
              >
                <PlusCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-emerald-50 p-6 rounded-[2.5rem]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-emerald-900">Doses recorded · last 7 days</h3>
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex justify-between">
                {Array.from({ length: 7 }, (_, i) => subDays(clock, 6 - i)).map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600/50">{format(day, 'EEE')}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white text-emerald-300"
                    )}>
                      {treatments.filter(t => t.status === 'Taken' && isSameDay(t.timestamp, day)).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {treatments.slice(0, 10).map(t => <div key={t.id} className="text-sm flex justify-between gap-2 bg-white p-3 rounded-xl"><span>{t.medicationName || 'Medication'} · {t.status} · {format(t.timestamp, 'MMM d HH:mm')}</span><button onClick={() => { if (confirm('Undo this dose record?')) setCare(c => ({ ...c, treatments: c.treatments.filter(x => x.id !== t.id), meds: c.meds.map(m => m.id === t.medicationId && t.status === 'Taken' ? { ...m, stock: m.stock + 1, totalStock: Math.max(m.totalStock, m.stock + 1) } : m) })); }}>Undo</button></div>)}
              {meds.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Pill className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-900">No medications</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Add your pet's medications to track stock and set reminders.</p>
                </div>
              ) : (
                meds.map((med) => (
                  <div key={med.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        med.type === 'Inhaler' ? "bg-sky-100 text-sky-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {med.type === 'Inhaler' ? <Wind className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900">{med.name}</h4>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">{nextTreatment([med], treatments, clock) ? `Next: ${format(nextTreatment([med], treatments, clock)!.date, 'MMM d HH:mm')}` : 'As needed'}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{med.dosage} • {med.frequency}</p>
                        
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-slate-300" />
                            <span className="text-xs font-bold text-slate-500">{med.stock} / {med.totalStock} left</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${(med.totalStock ? Math.min(100, med.stock / med.totalStock * 100) : 0)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <button className="rounded-xl bg-emerald-100 p-3 disabled:opacity-40" disabled={med.stock < 1 || (!!med.reminders.length && !isSameDay(nextTreatment([med], treatments, clock)!.date, clock))} onClick={() => recordDose(med, 'Taken')}>Record dose</button>
                          <button className="rounded-xl bg-slate-100 p-3 disabled:opacity-40" disabled={!!med.reminders.length && !isSameDay(nextTreatment([med], treatments, clock)!.date, clock)} onClick={() => recordDose(med, 'Missed')}>Record missed</button>
                          <button onClick={() => { setEditingMed(med); setIsAddMedModalOpen(true); }}>Edit / refill</button>
                          <button className="text-rose-600" onClick={() => { if (confirm(`Delete ${med.name}? Dose history will be kept.`)) setCare(c => ({ ...c, meds: c.meds.filter(m => m.id !== med.id) })); }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );

      case 'environment':
        if (isLoading) {
          return (
            <div className="space-y-8 animate-pulse">
              <div className="w-48 h-8 bg-slate-100 rounded"></div>
              <div className="w-full h-48 bg-slate-100 rounded-[2.5rem]"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-slate-100 rounded-3xl"></div>
                <div className="h-32 bg-slate-100 rounded-3xl"></div>
              </div>
            </div>
          );
        }

        const chartData = insights.days;

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
          >
            <RiskCard data={envData} isLoading={isLoading} error={locationError} onRetry={() => fetchEnvData()} onChangeLocation={() => setIsLocationModalOpen(true)} locationName={savedLocation?.name || 'Current Location'} />
            {!locationError && <div className="bg-white p-6 rounded-3xl text-sm space-y-2">
              <p>Pollen · Tree: {envData.pollen.tree} · Grass: {envData.pollen.grass} · Weed: {envData.pollen.weed}</p>
              <p>Observed: {envData.observedAt ? format(new Date(envData.observedAt), 'MMM d, HH:mm') : 'Unavailable'}</p>
              <button onClick={() => fetchEnvData()} className="text-emerald-700 font-bold">Refresh readings</button>
            </div>}

            {/* Historical Insights */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-2xl font-bold text-slate-900">Historical Insights</h3>
              </div>

              {history.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-900">No history yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Historical patterns will be generated as you log {profile.name || 'your cat'}'s symptoms.</p>
                </div>
              ) : (
                <>
                  {/* 7 Day Pattern */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h4 className="font-bold text-slate-900">Last 7 Days Pattern</h4>
                        <p className="text-xs text-slate-400">Symptoms vs. humidity captured with logs</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Attacks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Humidity</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorSymp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <YAxis yAxisId="symptoms" allowDecimals={false} /><YAxis yAxisId="humidity" orientation="right" domain={[0, 100]} unit="%" />
                          <Area yAxisId="symptoms" type="monotone" dataKey="symptoms" stroke="#ef4444" fillOpacity={1} fill="url(#colorSymp)" strokeWidth={3} />
                          <Line yAxisId="humidity" connectNulls={false} type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 30 Day Pattern */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h4 className="font-bold text-slate-900">Last 30 Days Pattern</h4>
                        <p className="text-xs text-slate-400">Trigger Frequency</p>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={insights.counts}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            {[
                              { name: 'Pollen', color: '#10b981' },
                              { name: 'Dust', color: '#f59e0b' },
                              { name: 'Cold', color: '#0ea5e9' },
                              { name: 'Exercise', color: '#8b5cf6' },
                              { name: 'Stress', color: '#ec4899' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-8 p-6 bg-emerald-50 rounded-3xl">
                      <div className="flex items-start gap-4">
                        <Info className="w-6 h-6 text-emerald-500 shrink-0" />
                        <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                          <span className="font-bold">30-Day Insight:</span> {insights.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden ring-4 ring-emerald-100">
                <img 
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200" 
                  alt="Cat" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-slate-500 font-medium">{profile.breed} • {profile.age} years old</p>
              </div>
            </div>

            <ProfileEditor key={JSON.stringify(profile)} profile={profile} onSave={setProfile} />
            <label className="block bg-white p-4 rounded-xl text-sm">Restore a backup
              <input type="file" accept="application/json,.json" className="block mt-2" onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return;
                try { const restored = validateCare(JSON.parse(await file.text())); if (confirm('Replace the current care records with this backup?')) restoreCare(restored); }
                catch { alert('This backup is not a valid Breeze care record. Nothing was changed.'); }
                e.target.value = '';
              }} />
            </label>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Stethoscope className="w-5 h-5" />
                  <h3 className="font-bold">Vet Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <User className="w-4 h-4 opacity-50" />
                    {profile.vetContact.name}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 opacity-50" />
                    {profile.vetContact.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 opacity-50" />
                    {profile.vetContact.email}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-bold">Reports & Data</h3>
                </div>
                <button 
                  onClick={generatePDF}
                  className="w-full bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">Export PDF Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(care, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'breeze-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-95 transition-all"
              >
                <SettingsIcon className="w-5 h-5" />
                Download data backup
              </button>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-32">
      <Header profile={profile} onNotify={() => setIsNotificationOpen(true)} />
      
      <main className="max-w-xl mx-auto px-6 pt-8">
        {storageError && <p role="alert" className="p-4 mb-4 bg-rose-50 text-rose-700 rounded-xl">{storageError}</p>}
        <p className="text-xs text-slate-500 mb-4">Care records are saved on this browser. Download a backup in Profile.</p>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence>
        {isLogModalOpen && (
          <LogAttackModal 
            isOpen={isLogModalOpen} 
            onClose={() => setIsLogModalOpen(false)} 
            onSave={handleSaveLog}
          />
        )}

        {isAddMedModalOpen && (
          <AddMedicationModal 
            key={editingMed?.id || 'new'} initial={editingMed}
            isOpen={isAddMedModalOpen}
            onClose={() => { setIsAddMedModalOpen(false); setEditingMed(undefined); }} 
            onSave={handleAddMed}
          />
        )}

        {isLocationModalOpen && (
          <LocationSearchModal 
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            onSelect={handleSelectLocation}
          />
        )}
        
        {isNotificationOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNotificationOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Notifications</h3>
              <p className="text-slate-500 text-sm mb-4">{next ? `Next treatment: ${next.med.name}, ${format(next.date, 'MMM d HH:mm')}` : 'No treatments scheduled.'}</p>
              <p className="text-xs text-slate-500 mb-4">Reminders work while this page is open. Your device may pause background tabs. Use a phone alarm for dependable reminders.</p>
              <button className="text-emerald-700 font-bold mb-4" onClick={async () => {
                if (!('Notification' in window)) { alert('Browser notifications are unavailable.'); return; }
                const permission = await Notification.requestPermission(); setNotificationsEnabled(permission === 'granted');
                if (permission !== 'granted') alert('Notifications were not enabled. Check your browser settings.');
              }}>{notificationsEnabled ? 'Reminders enabled for this session' : 'Enable reminders'}</button>
              <button onClick={() => setIsNotificationOpen(false)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold">Close</button>
            </motion.div>
          </div>
        )}

        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Log Details</h2>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    selectedLog.severity === 'Severe' ? "bg-rose-100 text-rose-600" :
                    selectedLog.severity === 'Moderate' ? "bg-amber-100 text-amber-600" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Severity</p>
                    <p className="font-bold text-slate-900">{selectedLog.severity} Attack</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="font-bold text-slate-900">{format(selectedLog.timestamp, 'h:mm a')}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-bold text-slate-900">{selectedLog.duration}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Triggers</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.triggers.map(t => (
                      <span key={t} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">{t}</span>
                    ))}
                  </div>
                </div>
                {selectedLog.notes && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Notes</p>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">"{selectedLog.notes}"</p>
                  </div>
                )}
                <button onClick={() => setSelectedLog(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

