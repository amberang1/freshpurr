export type PollenLevel = 'Low' | 'Moderate' | 'High' | 'Unavailable';

export type Severity = 'Mild' | 'Moderate' | 'Severe';

export interface SymptomLog {
  id: string;
  timestamp: Date;
  severity: Severity;
  duration: string; // e.g., "Under 1 min", "1-5 mins"
  triggers: string[];
  notes: string;
  aqi?: number;
  humidity?: number;
  pollen?: string; // 'Low', 'Moderate', 'High'
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  stock: number;
  totalStock: number;
  type: 'Oral' | 'Inhaler';
  reminders: string[]; // e.g., ["08:00", "20:00"]
}

export interface TreatmentHistory {
  id: string;
  medicationId: string;
  timestamp: Date;
  status: 'Taken' | 'Missed';
  scheduledFor?: string;
  medicationName?: string;
}

export interface CatProfile {
  name: string;
  breed: string;
  age: number;
  diagnosisDate: string;
  knownTriggers: string[];
  vetContact: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface EnvironmentalData {
  aqi: number | null;
  humidity: number | null;
  pollen: { tree: PollenLevel; grass: PollenLevel; weed: PollenLevel };
  riskLevel: 'Low' | 'Medium' | 'High' | 'Unavailable';
  prediction: string;
  indexLabel?: string;
  observedAt?: string;
}
