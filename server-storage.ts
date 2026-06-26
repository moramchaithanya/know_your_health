import fs from 'fs';
import path from 'path';
import { User, PatientProfile, SymptomLog, PredictionResult, MedicalReport, DoctorNote, Doctor, Booking, AppRating } from './src/types.js';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DBData {
  users: User[];
  patients: PatientProfile[];
  symptoms: SymptomLog[];
  predictions: PredictionResult[];
  reports: MedicalReport[];
  doctor_notes: DoctorNote[];
  doctors: Doctor[];
  bookings: Booking[];
  ratings?: AppRating[];
}

const DEFAULT_DATA: DBData = {
  users: [
    { id: 'u-doctor', username: 'doctor', role: 'DOCTOR', name: 'Dr. Sarah Carter' },
    { id: 'u-admin', username: 'Chaithanya@430', role: 'ADMIN', name: 'Chief Admin Office' }
  ],
  patients: [],
  symptoms: [],
  predictions: [],
  reports: [],
  doctor_notes: [],
  doctors: [
    {
      id: 'doc-1',
      name: 'Dr. Elizabeth Vance',
      specialty: 'Cardiology',
      experience: '15 years',
      hospital: 'Metro Heart & Vascular Center',
      rating: 4.9,
      consultation_fee: 150,
      availability: 'Mon, Wed, Fri 09:00 - 13:00',
      bio: 'Senior Coronary Specialist focusing on preventative cardiology, ischemic heart disease, and vascular strain management.'
    },
    {
      id: 'doc-2',
      name: 'Dr. Marcus Sterling',
      specialty: 'Dermatology',
      experience: '10 years',
      hospital: 'Radiant Skin & Laser Institute',
      rating: 4.8,
      consultation_fee: 120,
      availability: 'Tue, Thu 14:00 - 18:00',
      bio: 'Board-certified clinical dermatologist specializing in cutaneous allergies, acute dermatitis, eczema, and skin lesions.'
    },
    {
      id: 'doc-3',
      name: 'Dr. Clara Thorne',
      specialty: 'Neurology',
      experience: '12 years',
      hospital: 'Neurological Sciences Clinic',
      rating: 4.9,
      consultation_fee: 160,
      availability: 'Mon, Tue, Thu 10:00 - 15:00',
      bio: 'Specialist in cognitive disorders, neurological pain pathways, migraine therapy, and peripheral nervous system health.'
    },
    {
      id: 'doc-4',
      name: 'Dr. Alan Patel',
      specialty: 'Pediatrics',
      experience: '8 years',
      hospital: 'Sunnyvale Children\'s Clinic',
      rating: 4.7,
      consultation_fee: 90,
      availability: 'Mon-Fri 08:30 - 12:00',
      bio: 'Dedicated to pediatric care, child development milestones, vaccinations, asthma, and chronic adolescent healthcare.'
    },
    {
      id: 'doc-5',
      name: 'Dr. Olivia Mendoza',
      specialty: 'Endocrinology',
      experience: '14 years',
      hospital: 'Endocrine & Wellness Hospital',
      rating: 4.9,
      consultation_fee: 140,
      availability: 'Wed, Fri 13:00 - 17:00',
      bio: 'Expert in diabetes management, hormone regulation therapies, metabolic syndrome, and thyroid care.'
    },
    {
      id: 'doc-6',
      name: 'Dr. Jonathan Hayes',
      specialty: 'Orthopedics',
      experience: '11 years',
      hospital: 'Apex Orthopedic & Sports Center',
      rating: 4.8,
      consultation_fee: 130,
      availability: 'Mon, Thu 09:00 - 14:00',
      bio: 'Orthopedic surgeon focusing on sports injuries, bone fractures, degenerative arthritis, and joint pain management.'
    },
    {
      id: 'doc-7',
      name: 'Dr. Beatrice Cho',
      specialty: 'Gastroenterology',
      experience: '9 years',
      hospital: 'Gastrointestinal Center of Excellence',
      rating: 4.6,
      consultation_fee: 125,
      availability: 'Tue, Fri 10:00 - 14:00',
      bio: 'Specialist in digestive tract disorders, inflammatory bowel disease (IBD), liver health, and preventative colonoscopies.'
    },
    {
      id: 'doc-8',
      name: 'Dr. Rajeev Nair',
      specialty: 'Pulmonology',
      experience: '16 years',
      hospital: 'Apex Lung & Respiratory Care',
      rating: 4.9,
      consultation_fee: 150,
      availability: 'Mon, Wed 14:00 - 18:00',
      bio: 'Expert clinical pulmonologist specializing in adult asthma, COPD, sleep apnea, and occupational lung disorders.'
    },
    {
      id: 'doc-9',
      name: 'Dr. Fiona Gallagher',
      specialty: 'Psychiatry',
      experience: '13 years',
      hospital: 'Mind Balance Psychiatry',
      rating: 4.8,
      consultation_fee: 140,
      availability: 'Tue, Wed, Thu 11:00 - 16:00',
      bio: 'Clinical psychiatrist dedicated to adult ADHD, depressive disorders, cognitive behavioral therapy, and anxiety management.'
    },
    {
      id: 'doc-10',
      name: 'Dr. Samuel Green',
      specialty: 'Ophthalmology',
      experience: '18 years',
      hospital: 'Optima Eye Care Center',
      rating: 4.9,
      consultation_fee: 110,
      availability: 'Tue, Fri 09:00 - 13:00',
      bio: 'Senior eye surgeon focusing on premium cataract extraction, laser vision correction, and glaucoma monitoring.'
    }
  ],
  bookings: [],
  ratings: []
};

function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content) as DBData;
    
    // Ensure Chaithanya@430 exists as admin
    const hasAdmin = data.users.some(u => u.username.toLowerCase() === 'chaithanya@430');
    let hasChanges = false;
    if (!hasAdmin) {
      // Filter out any old general 'admin' or 'know_your_helath' users to keep it clean and unified
      data.users = data.users.filter(u => u.username.toLowerCase() !== 'admin' && u.username.toLowerCase() !== 'know_your_helath');
      data.users.push({
        id: 'u-admin',
        username: 'Chaithanya@430',
        role: 'ADMIN',
        name: 'Chief Admin Office'
      });
      hasChanges = true;
    }

    if (!data.doctors) {
      data.doctors = [...DEFAULT_DATA.doctors];
      hasChanges = true;
    }

    if (!data.bookings) {
      data.bookings = [];
      hasChanges = true;
    }

    if (!data.ratings) {
      data.ratings = [];
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    return data;
  } catch (error) {
    console.error('Error reading db.json, returning default data:', error);
    return DEFAULT_DATA;
  }
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
  }
}

export const Storage = {
  getUsers: (): User[] => {
    return readDB().users;
  },

  addUser: (user: User): User => {
    const db = readDB();
    db.users.push(user);
    writeDB(db);
    return user;
  },

  getUser: (id: string): User | undefined => {
    return readDB().users.find(u => u.id === id);
  },

  getUserByUsername: (username: string): User | undefined => {
    const cleanUsername = username.includes('@') ? username.split('@')[0] : username;
    return readDB().users.find(u => 
      u.username.toLowerCase() === cleanUsername.toLowerCase() || 
      u.username.toLowerCase() === username.toLowerCase()
    );
  },

  getPatients: (): PatientProfile[] => {
    return readDB().patients;
  },

  getPatient: (id: string): PatientProfile | undefined => {
    return readDB().patients.find(p => p.patient_id === id);
  },

  savePatient: (patient: PatientProfile): PatientProfile => {
    const db = readDB();
    const index = db.patients.findIndex(p => p.patient_id === patient.patient_id);
    if (!patient.date_registered) {
      if (index >= 0 && db.patients[index].date_registered) {
        patient.date_registered = db.patients[index].date_registered;
      } else {
        patient.date_registered = new Date().toISOString();
      }
    }
    if (index >= 0) {
      db.patients[index] = patient;
    } else {
      db.patients.push(patient);
    }
    writeDB(db);
    return patient;
  },

  getSymptoms: (patientId?: string): SymptomLog[] => {
    const list = readDB().symptoms;
    if (patientId) {
      return list.filter(s => s.patient_id === patientId);
    }
    return list;
  },

  addSymptom: (symptom: SymptomLog): SymptomLog => {
    const db = readDB();
    db.symptoms.push(symptom);
    writeDB(db);
    return symptom;
  },

  getPredictions: (patientId?: string): PredictionResult[] => {
    const list = readDB().predictions;
    if (patientId) {
      return list.filter(p => p.patient_id === patientId);
    }
    return list;
  },

  getPrediction: (id: string): PredictionResult | undefined => {
    return readDB().predictions.find(p => p.prediction_id === id);
  },

  addPrediction: (prediction: PredictionResult): PredictionResult => {
    const db = readDB();
    db.predictions.push(prediction);
    writeDB(db);
    return prediction;
  },

  getReports: (patientId?: string): MedicalReport[] => {
    const list = readDB().reports;
    if (patientId) {
      return list.filter(r => r.patient_id === patientId);
    }
    return list;
  },

  getReport: (id: string): MedicalReport | undefined => {
    return readDB().reports.find(r => r.report_id === id);
  },

  saveReport: (report: MedicalReport): MedicalReport => {
    const db = readDB();
    const index = db.reports.findIndex(r => r.report_id === report.report_id);
    if (index >= 0) {
      db.reports[index] = report;
    } else {
      db.reports.push(report);
    }
    writeDB(db);
    return report;
  },

  getDoctorNotes: (patientId?: string): DoctorNote[] => {
    const list = readDB().doctor_notes;
    if (patientId) {
      return list.filter(n => n.patient_id === patientId);
    }
    return list;
  },

  getDoctorNoteForPrediction: (predId: string): DoctorNote | undefined => {
    return readDB().doctor_notes.find(n => n.prediction_id === predId);
  },

  saveDoctorNote: (note: DoctorNote): DoctorNote => {
    const db = readDB();
    const index = db.doctor_notes.findIndex(n => n.note_id === note.note_id || n.prediction_id === note.prediction_id);
    if (index >= 0) {
      db.doctor_notes[index] = { ...db.doctor_notes[index], ...note };
    } else {
      db.doctor_notes.push(note);
    }
    writeDB(db);
    return note;
  },

  resetDatabase: (): DBData => {
    writeDB(DEFAULT_DATA);
    return DEFAULT_DATA;
  },

  getDoctors: (): Doctor[] => {
    return readDB().doctors || [];
  },

  addDoctor: (doctor: Doctor): Doctor => {
    const db = readDB();
    if (!db.doctors) db.doctors = [];
    db.doctors.push(doctor);
    writeDB(db);
    return doctor;
  },

  removeDoctor: (id: string): boolean => {
    const db = readDB();
    if (!db.doctors) db.doctors = [];
    const index = db.doctors.findIndex(d => d.id === id);
    if (index >= 0) {
      db.doctors.splice(index, 1);
      writeDB(db);
      return true;
    }
    return false;
  },

  getBookings: (patientId?: string): Booking[] => {
    const list = readDB().bookings || [];
    if (patientId) {
      return list.filter(b => b.patient_id === patientId);
    }
    return list;
  },

  addBooking: (booking: Booking): Booking => {
    const db = readDB();
    if (!db.bookings) db.bookings = [];
    db.bookings.push(booking);
    writeDB(db);
    return booking;
  },

  updateBookingStatus: (id: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'): boolean => {
    const db = readDB();
    if (!db.bookings) db.bookings = [];
    const index = db.bookings.findIndex(b => b.booking_id === id);
    if (index >= 0) {
      db.bookings[index].status = status;
      writeDB(db);
      return true;
    }
    return false;
  },

  removeVisitedPatient: (patientId: string): boolean => {
    const db = readDB();
    db.symptoms = db.symptoms.filter(s => s.patient_id !== patientId);
    db.predictions = db.predictions.filter(p => p.patient_id !== patientId);
    db.reports = db.reports.filter(r => r.patient_id !== patientId);
    db.doctor_notes = db.doctor_notes.filter(n => n.patient_id !== patientId);
    db.bookings = db.bookings.filter(b => b.patient_id !== patientId);
    writeDB(db);
    return true;
  },

  resetPatientsOnly: (): DBData => {
    const db = readDB();
    db.patients = JSON.parse(JSON.stringify(DEFAULT_DATA.patients));
    db.symptoms = JSON.parse(JSON.stringify(DEFAULT_DATA.symptoms));
    db.predictions = JSON.parse(JSON.stringify(DEFAULT_DATA.predictions));
    db.reports = [];
    db.doctor_notes = [];
    db.ratings = [];
    writeDB(db);
    return db;
  },

  getRatings: (patientId?: string): AppRating[] => {
    const list = readDB().ratings || [];
    if (patientId) {
      return list.filter(r => r.patient_id === patientId);
    }
    return list;
  },

  addRating: (rating: AppRating): AppRating => {
    const db = readDB();
    if (!db.ratings) db.ratings = [];
    db.ratings.push(rating);
    writeDB(db);
    return rating;
  }
};
