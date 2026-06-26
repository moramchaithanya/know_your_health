export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface PatientProfile {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  height: number; // cm
  weight: number; // kg
  blood_group: string;
  bp: string; // e.g. "120/80"
  heart_rate: number; // bpm
  oxygen_level: number; // %
  temperature: number; // °C
  lifestyle_habits: string;
  smoking_status: string; // "Never", "Former", "Active"
  alcohol_usage: string; // "None", "Occasional", "Regular"
  medical_history: string;
  family_history: string;
  date_registered?: string;
}

export interface SymptomLog {
  symptom_id: string;
  patient_id: string;
  symptoms: string[]; // ['Fever', 'Headache', etc.]
  severity: 'Mild' | 'Moderate' | 'Severe';
  date: string; // ISO format
  input_method: 'Checkbox' | 'Dropdown' | 'Voice' | 'Wearable';
  wearable_data?: {
    heartRateTrend: string;
    activityLevel: string;
    sleepHours: number;
  };
}

export interface ModelPrediction {
  model_name: string; // "Random Forest", "Decision Tree", etc.
  disease_name: string;
  probability: number; // 0-100
}

export interface PredictionResult {
  prediction_id: string;
  patient_id: string;
  disease_name: string;
  probability: number; // 0-100
  confidence_score: number; // 0-100
  risk_level: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  model_predictions: ModelPrediction[];
  explainable_ai: {
    feature: string;
    impact: 'High' | 'Medium' | 'Low';
    reason: string;
  }[];
  risk_assessment: {
    severity_score: number; // 0-100
    health_risk_percentage: number; // 0-100
    recovery_probability: number; // 0-100
    early_warning_indicators: string[];
  };
  recommendations: {
    tests: string[];
    lifestyle: string[];
    dos: string[];
    donts: string[];
    tablets: string[];
  };
  date: string;
}

export interface MedicalReport {
  report_id: string;
  patient_id: string;
  prediction_id: string;
  generated_date: string;
  patient_info: PatientProfile;
  symptoms: SymptomLog;
  prediction: PredictionResult;
  doctor_notes?: string;
  prescription?: string[];
}

export interface DoctorNote {
  note_id: string;
  patient_id: string;
  prediction_id: string;
  notes: string;
  prescription: string[];
  recovery_progress: number; // 0-100
  date: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  hospital: string;
  rating: number;
  consultation_fee: number;
  availability: string;
  photo_url?: string;
  bio?: string;
}

export interface Booking {
  booking_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface AppRating {
  rating_id: string;
  patient_id: string;
  patient_name: string;
  score: number;
  comment: string;
  date: string;
}


