import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Storage } from "./server-storage.js";
import { runAIPrediction } from "./server-gemini.js";
import { User, PatientProfile, SymptomLog, PredictionResult, MedicalReport, DoctorNote } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API ROUTES FIRST

// Auth API
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const user = Storage.getUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: "User not found. Please register." });
  }

  // Validate admin password
  if (user.role === "ADMIN" || username.toLowerCase() === "chaithanya@430") {
    if (password !== "6281") {
      return res.status(401).json({ error: "Invalid credentials. Admin PIN is 6281." });
    }
  }

  res.json({ user });
});

app.post("/api/auth/register", (req, res) => {
  const { username, role, name } = req.body;
  if (!username || !role || !name) {
    return res.status(400).json({ error: "Username, role, and name are required" });
  }

  if (role !== "PATIENT") {
    return res.status(400).json({ error: "Only patient registration is permitted on this portal." });
  }

  const existingUser = Storage.getUserByUsername(username);
  if (existingUser) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const id = `u-${Date.now()}`;
  const newUser: User = { id, username, role, name };
  Storage.addUser(newUser);

  // If registering as a patient, auto-create an empty profile
  if (role === "PATIENT") {
    const emptyProfile: PatientProfile = {
      patient_id: id,
      name,
      age: 30,
      gender: "Male",
      height: 170,
      weight: 70,
      blood_group: "O+",
      bp: "120/80",
      heart_rate: 72,
      oxygen_level: 98,
      temperature: 36.6,
      lifestyle_habits: "Moderate activity, standard diet",
      smoking_status: "Never",
      alcohol_usage: "None",
      medical_history: "None declared",
      family_history: "None declared"
    };
    Storage.savePatient(emptyProfile);
  }

  res.json({ user: newUser });
});

// Patient Profile API
app.get("/api/patients", (req, res) => {
  res.json(Storage.getPatients());
});

// Admin Users API
app.get("/api/users", (req, res) => {
  res.json(Storage.getUsers());
});

app.get("/api/patients/full-sync-data", (req, res) => {
  const patients = Storage.getPatients();
  const joinedData = patients.map(patient => {
    const symptomsList = Storage.getSymptoms(patient.patient_id);
    const sortedSymptoms = [...symptomsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestSymptoms = sortedSymptoms[0];

    const predictionsList = Storage.getPredictions(patient.patient_id);
    const sortedPredictions = [...predictionsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestPrediction = sortedPredictions[0];

    const heightM = patient.height / 100;
    const bmi = heightM > 0 ? (patient.weight / (heightM * heightM)).toFixed(1) : "N/A";

    return {
      patient_id: patient.patient_id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      height: patient.height,
      weight: patient.weight,
      bmi,
      blood_group: patient.blood_group,
      bp: patient.bp,
      heart_rate: patient.heart_rate,
      oxygen_level: patient.oxygen_level,
      temperature: patient.temperature,
      lifestyle_habits: patient.lifestyle_habits,
      smoking_status: patient.smoking_status,
      alcohol_usage: patient.alcohol_usage,
      medical_history: patient.medical_history,
      family_history: patient.family_history,
      logged_symptoms: latestSymptoms ? latestSymptoms.symptoms.join("; ") : "No symptoms logged",
      disease_name: latestPrediction ? latestPrediction.disease_name : "No predictions run yet",
      probability: latestPrediction ? latestPrediction.probability : 0,
      confidence_score: latestPrediction ? latestPrediction.confidence_score : 0,
      risk_level: latestPrediction ? latestPrediction.risk_level : "N/A",
      recommended_tests: latestPrediction ? latestPrediction.recommendations.tests.join("; ") : "N/A",
      recommended_lifestyle: latestPrediction ? latestPrediction.recommendations.lifestyle.join("; ") : "N/A",
      dos: latestPrediction && latestPrediction.recommendations.dos ? latestPrediction.recommendations.dos.join("; ") : "N/A",
      donts: latestPrediction && latestPrediction.recommendations.donts ? latestPrediction.recommendations.donts.join("; ") : "N/A",
      last_updated: latestPrediction ? latestPrediction.date : new Date().toISOString()
    };
  });
  res.json(joinedData);
});

app.get("/api/patients/export", (req, res) => {
  const patients = Storage.getPatients();
  
  // Create an Excel-compatible CSV content
  let csvContent = "\uFEFF"; // UTF-8 BOM for Excel to open it correctly
  
  // Headers
  const headers = [
    "Patient ID",
    "Full Name",
    "Age",
    "Gender",
    "Height (cm)",
    "Weight (kg)",
    "BMI",
    "Blood Group",
    "Blood Pressure (BP)",
    "Heart Rate (bpm)",
    "Oxygen Level (%)",
    "Temperature (°C)",
    "Lifestyle Habits",
    "Smoking Status",
    "Alcohol Usage",
    "Medical History",
    "Family History",
    "Logged Symptoms",
    "Suspected Disease",
    "Consensus Probability (%)",
    "Ensemble Confidence Score (%)",
    "Overall Risk Level",
    "Recommended Tests",
    "Recommended Lifestyle",
    "Do's",
    "Don'ts"
  ];
  
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
  
  patients.forEach(patient => {
    // Get latest symptoms and predictions
    const symptomsList = Storage.getSymptoms(patient.patient_id);
    const sortedSymptoms = [...symptomsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestSymptoms = sortedSymptoms[0];
    
    const predictionsList = Storage.getPredictions(patient.patient_id);
    const sortedPredictions = [...predictionsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestPrediction = sortedPredictions[0];
    
    const heightM = patient.height / 100;
    const bmi = heightM > 0 ? (patient.weight / (heightM * heightM)).toFixed(1) : "N/A";
    
    const row = [
      patient.patient_id,
      patient.name,
      patient.age.toString(),
      patient.gender,
      patient.height.toString(),
      patient.weight.toString(),
      bmi,
      patient.blood_group,
      patient.bp,
      patient.heart_rate.toString(),
      patient.oxygen_level.toString(),
      patient.temperature.toString(),
      patient.lifestyle_habits,
      patient.smoking_status,
      patient.alcohol_usage,
      patient.medical_history,
      patient.family_history,
      latestSymptoms ? latestSymptoms.symptoms.join("; ") : "No symptoms logged",
      latestPrediction ? latestPrediction.disease_name : "No predictions run yet",
      latestPrediction ? latestPrediction.probability.toString() : "N/A",
      latestPrediction ? latestPrediction.confidence_score.toString() : "N/A",
      latestPrediction ? latestPrediction.risk_level : "N/A",
      latestPrediction ? latestPrediction.recommendations.tests.join("; ") : "N/A",
      latestPrediction ? latestPrediction.recommendations.lifestyle.join("; ") : "N/A",
      latestPrediction && latestPrediction.recommendations.dos ? latestPrediction.recommendations.dos.join("; ") : "N/A",
      latestPrediction && latestPrediction.recommendations.donts ? latestPrediction.recommendations.donts.join("; ") : "N/A"
    ];
    
    csvContent += row.map(val => {
      const stringVal = val ? val.toString() : "";
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(",") + "\n";
  });
  
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=Patient_Registrations_KnowHealth.csv");
  res.send(csvContent);
});

app.get("/api/patients/:id", (req, res) => {
  const patient = Storage.getPatient(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient profile not found" });
  }
  res.json(patient);
});

app.post("/api/patients", (req, res) => {
  const patientData: PatientProfile = req.body;
  if (!patientData.patient_id || !patientData.name) {
    return res.status(400).json({ error: "Patient ID and name are required" });
  }
  const saved = Storage.savePatient(patientData);
  res.json(saved);
});

// Symptoms API
app.get("/api/symptoms/patient/:patientId", (req, res) => {
  res.json(Storage.getSymptoms(req.params.patientId));
});

app.post("/api/symptoms", (req, res) => {
  const symptomData: Omit<SymptomLog, 'symptom_id' | 'date'> = req.body;
  if (!symptomData.patient_id || !symptomData.symptoms || symptomData.symptoms.length === 0) {
    return res.status(400).json({ error: "Patient ID and at least one symptom are required" });
  }

  const newLog: SymptomLog = {
    ...symptomData,
    symptom_id: `s-${Date.now()}`,
    date: new Date().toISOString()
  };

  const saved = Storage.addSymptom(newLog);
  res.json(saved);
});

// Predictions API
app.get("/api/predictions/patient/:patientId", (req, res) => {
  res.json(Storage.getPredictions(req.params.patientId));
});

app.get("/api/predictions/:id", (req, res) => {
  const prediction = Storage.getPrediction(req.params.id);
  if (!prediction) {
    return res.status(404).json({ error: "Prediction record not found" });
  }
  res.json(prediction);
});

app.post("/api/predictions/predict", async (req, res) => {
  const { patient_id, symptoms_log_id } = req.body;
  if (!patient_id || !symptoms_log_id) {
    return res.status(400).json({ error: "Patient ID and Symptoms Log ID are required" });
  }

  const patient = Storage.getPatient(patient_id);
  if (!patient) {
    return res.status(404).json({ error: "Patient profile not found" });
  }

  const symptomsList = Storage.getSymptoms(patient_id);
  const symptomsLog = symptomsList.find(s => s.symptom_id === symptoms_log_id);
  if (!symptomsLog) {
    return res.status(404).json({ error: "Symptom log not found" });
  }

  try {
    // Run AI diagnostic ensemble
    const result = await runAIPrediction(patient, symptomsLog);

    const fullPrediction: PredictionResult = {
      ...result,
      prediction_id: `pred-${Date.now()}`,
      patient_id,
      date: new Date().toISOString()
    };

    Storage.addPrediction(fullPrediction);
    res.json(fullPrediction);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to run prediction: " + error.message });
  }
});

// Doctor Intelligence / Clinical Notes API
app.get("/api/doctor-notes/patient/:patientId", (req, res) => {
  res.json(Storage.getDoctorNotes(req.params.patientId));
});

app.post("/api/doctor-notes", (req, res) => {
  const noteData: DoctorNote = req.body;
  if (!noteData.patient_id || !noteData.prediction_id) {
    return res.status(400).json({ error: "Patient ID and Prediction ID are required" });
  }

  const note: DoctorNote = {
    ...noteData,
    note_id: noteData.note_id || `note-${Date.now()}`,
    date: new Date().toISOString()
  };

  const saved = Storage.saveDoctorNote(note);
  res.json(saved);
});

// Reports API
app.get("/api/reports/patient/:patientId", (req, res) => {
  res.json(Storage.getReports(req.params.patientId));
});

app.post("/api/reports/generate", (req, res) => {
  const { patient_id, prediction_id } = req.body;
  if (!patient_id || !prediction_id) {
    return res.status(400).json({ error: "Patient ID and Prediction ID are required" });
  }

  const patient = Storage.getPatient(patient_id);
  const prediction = Storage.getPrediction(prediction_id);
  const symptomsList = Storage.getSymptoms(patient_id);
  // Find symptom log corresponding to the prediction or most recent
  const symptoms = symptomsList[symptomsList.length - 1];

  if (!patient || !prediction || !symptoms) {
    return res.status(404).json({ error: "Required records to generate report not found" });
  }

  // Get matching doctor notes if any
  const doctorNoteObj = Storage.getDoctorNoteForPrediction(prediction_id);

  const report: MedicalReport = {
    report_id: `rep-${Date.now()}`,
    patient_id,
    prediction_id,
    generated_date: new Date().toISOString(),
    patient_info: patient,
    symptoms,
    prediction,
    doctor_notes: doctorNoteObj?.notes,
    prescription: doctorNoteObj?.prescription
  };

  Storage.saveReport(report);
  res.json(report);
});

// Analytics API
app.get("/api/analytics/summary", (req, res) => {
  const patients = Storage.getPatients();
  const predictions = Storage.getPredictions();

  // Disease distribution
  const diseaseCounts: { [key: string]: number } = {};
  // Risk levels
  const riskCounts = { "LOW RISK": 0, "MEDIUM RISK": 0, "HIGH RISK": 0 };

  predictions.forEach(p => {
    diseaseCounts[p.disease_name] = (diseaseCounts[p.disease_name] || 0) + 1;
    if (p.risk_level === "LOW RISK") riskCounts["LOW RISK"]++;
    if (p.risk_level === "MEDIUM RISK") riskCounts["MEDIUM RISK"]++;
    if (p.risk_level === "HIGH RISK") riskCounts["HIGH RISK"]++;
  });

  const diseaseDistribution = Object.keys(diseaseCounts).map(name => ({
    name,
    value: diseaseCounts[name]
  }));

  const riskDistribution = Object.keys(riskCounts).map(name => ({
    name,
    value: riskCounts[name as keyof typeof riskCounts]
  }));

  // Average prediction confidence / accuracy over time
  const predictionAccuracy = predictions.map((p, i) => ({
    index: i + 1,
    confidence: p.confidence_score,
    probability: p.probability,
    disease: p.disease_name
  }));

  // Real-time Day-wise, Week-wise, and Month-wise cumulative growth calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-indexed (e.g. 5 for June)
  const currentDay = now.getDate(); // 1-indexed

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // 1. Month-wise cumulative growth of this year
  const monthWise = [];
  for (let m = 0; m <= currentMonthIdx; m++) {
    const count = patients.filter(p => {
      if (!p.date_registered) return true; // Include baseline patients who don't have a registration date
      const regDate = new Date(p.date_registered);
      if (regDate.getFullYear() < currentYear) return true;
      if (regDate.getFullYear() === currentYear && regDate.getMonth() <= m) return true;
      return false;
    }).length;
    monthWise.push({ label: monthNames[m], patients: count });
  }

  // 2. Week-wise cumulative growth of THIS month
  const weekWise = [];
  const weeks = [
    { name: 'Week 1', endDay: 7 },
    { name: 'Week 2', endDay: 14 },
    { name: 'Week 3', endDay: 21 },
    { name: 'Week 4', endDay: 28 },
    { name: 'Week 5', endDay: 31 }
  ];
  weeks.forEach(w => {
    const count = patients.filter(p => {
      if (!p.date_registered) return true;
      const regDate = new Date(p.date_registered);
      if (regDate.getFullYear() < currentYear) return true;
      if (regDate.getFullYear() === currentYear && regDate.getMonth() < currentMonthIdx) return true;
      if (regDate.getFullYear() === currentYear && regDate.getMonth() === currentMonthIdx && regDate.getDate() <= w.endDay) return true;
      return false;
    }).length;
    weekWise.push({ label: w.name, patients: count });
  });

  // 3. Day-wise cumulative growth of THIS month up to currentDay
  const dayWise = [];
  for (let d = 1; d <= currentDay; d++) {
    const count = patients.filter(p => {
      if (!p.date_registered) return true;
      const regDate = new Date(p.date_registered);
      if (regDate.getFullYear() < currentYear) return true;
      if (regDate.getFullYear() === currentYear && regDate.getMonth() < currentMonthIdx) return true;
      if (regDate.getFullYear() === currentYear && regDate.getMonth() === currentMonthIdx && regDate.getDate() <= d) return true;
      return false;
    }).length;
    const label = `${monthNames[currentMonthIdx]} ${d}`;
    dayWise.push({ label, patients: count });
  }

  // Recovery Probability trends
  const recoveryTrends = predictions.map((p, i) => ({
    index: i + 1,
    recovery: p.risk_assessment.recovery_probability,
    severity: p.risk_assessment.severity_score
  }));

  // Compiling list of patients visited and the specific types of diseases they faced
  const visitedPatients = patients.map(p => {
    const syms = Storage.getSymptoms(p.patient_id);
    const preds = Storage.getPredictions(p.patient_id);
    
    const sortedPreds = [...preds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedSyms = [...syms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const latestPred = sortedPreds[0];
    const latestSym = sortedSyms[0];
    
    return {
      patient_id: p.patient_id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      disease_name: latestPred ? latestPred.disease_name : "No Diagnosis Recorded",
      risk_level: latestPred ? latestPred.risk_level : "LOW RISK",
      symptoms: latestSym ? latestSym.symptoms : [],
      visit_date: latestPred ? latestPred.date : (latestSym ? latestSym.date : new Date().toISOString()),
      visit_count: Math.max(syms.length, preds.length),
      all_predictions: sortedPreds,
      all_symptoms: sortedSyms
    };
  }).filter(v => v.disease_name !== "No Diagnosis Recorded" || v.symptoms.length > 0);

  res.json({
    totalPatients: patients.length,
    totalPredictions: predictions.length,
    diseaseDistribution,
    riskDistribution,
    predictionAccuracy,
    patientGrowth: monthWise,
    patientGrowthDetailed: {
      dayWise,
      weekWise,
      monthWise
    },
    recoveryTrends,
    visitedPatients
  });
});

// App Ratings Endpoints
app.get("/api/ratings", (req, res) => {
  res.json(Storage.getRatings());
});

app.post("/api/ratings", (req, res) => {
  const { patient_id, patient_name, score, comment } = req.body;
  if (!patient_id || !score) {
    return res.status(400).json({ error: "Patient ID and score are required" });
  }
  const rating = {
    rating_id: 'r-' + Date.now(),
    patient_id,
    patient_name: patient_name || 'Anonymous',
    score: Number(score),
    comment: comment || '',
    date: new Date().toISOString()
  };
  const saved = Storage.addRating(rating);
  res.json(saved);
});



app.post("/api/admin/reset", (req, res) => {
  Storage.resetPatientsOnly();
  res.json({ success: true, message: "Patient registry has been successfully reloaded back to its default state, leaving doctors list intact." });
});

app.delete("/api/admin/visited-patients/:id", (req, res) => {
  const patientId = req.params.id;
  Storage.removeVisitedPatient(patientId);
  res.json({ success: true, message: "Visited patient records removed successfully." });
});

// Doctors API
app.get("/api/doctors", (req, res) => {
  res.json(Storage.getDoctors());
});

app.post("/api/doctors", (req, res) => {
  const { name, specialty, experience, hospital, consultation_fee, availability, bio } = req.body;
  if (!name || !specialty) {
    return res.status(400).json({ error: "Name and specialty are required." });
  }
  const newDoctor = {
    id: 'doc-' + Date.now(),
    name,
    specialty,
    experience: experience || '5 years',
    hospital: hospital || 'General Medical Center',
    rating: 5.0,
    consultation_fee: Number(consultation_fee) || 100,
    availability: availability || 'Mon-Fri 09:00 - 17:00',
    bio: bio || 'Expert medical consultant.'
  };
  const saved = Storage.addDoctor(newDoctor);
  res.json(saved);
});

app.delete("/api/doctors/:id", (req, res) => {
  const success = Storage.removeDoctor(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Doctor not found" });
  }
});

// Bookings API
app.get("/api/bookings", (req, res) => {
  const patientId = req.query.patientId as string;
  res.json(Storage.getBookings(patientId));
});

app.post("/api/bookings", (req, res) => {
  const { patient_id, patient_name, doctor_id, doctor_name, doctor_specialty, appointment_date, appointment_time, reason } = req.body;
  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: "Missing required booking parameters" });
  }
  const booking = {
    booking_id: 'bk-' + Date.now(),
    patient_id,
    patient_name: patient_name || 'Patient',
    doctor_id,
    doctor_name,
    doctor_specialty,
    appointment_date,
    appointment_time,
    reason: reason || 'Routine Checkup',
    status: 'PENDING' as const,
    created_at: new Date().toISOString()
  };
  const saved = Storage.addBooking(booking);
  res.json(saved);
});

app.post("/api/bookings/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status parameter is required" });
  }
  const success = Storage.updateBookingStatus(req.params.id, status);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Booking not found" });
  }
});


// Vite Dev Server / Prod Static Server configuration

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
