import { CatProfile, EnvironmentalData, Medication, SymptomLog } from './types';

export const INITIAL_CAT_PROFILE: CatProfile = {
  name: '',
  breed: '',
  age: 0,
  diagnosisDate: '',
  knownTriggers: [],
  vetContact: {
    name: '',
    phone: '',
    email: '',
  },
};

export const INITIAL_MEDICATIONS: Medication[] = [];

export const MOCK_ENVIRONMENTAL_DATA: EnvironmentalData = {
  aqi: 0,
  humidity: 0,
  pollen: {
    tree: 'Low',
    grass: 'Low',
    weed: 'Low',
  },
  riskLevel: 'Low',
  prediction: 'Fetching real-time environmental data...',
};

export const MOCK_SYMPTOM_HISTORY: SymptomLog[] = [];
