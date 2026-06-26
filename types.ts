import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Brain, CheckSquare, User, BarChart3, FileText, LogOut, 
  Settings, Users, ShieldAlert, Heart, Activity, Thermometer, Wind, Plus, Info, ChevronRight, RefreshCw, Key,
  Calendar, Stethoscope, Trash2, PlusCircle, Clock, DollarSign, Check, Star, AlertCircle, History, X
} from 'lucide-react';
import { User as UserType, PatientProfile, SymptomLog, PredictionResult, MedicalReport, Doctor, Booking } from './types.js';
import LoginModule from './components/LoginModule.js';
import PatientProfileForm from './components/PatientProfileForm.js';
import SymptomCollector from './components/SymptomCollector.js';
import AIResultView from './components/AIResultView.js';
import DoctorPortal from './components/DoctorPortal.js';
import AnalyticsView from './components/AnalyticsView.js';
import PrintableReport from './components/PrintableReport.js';
import GoogleSheetsSync from './components/GoogleSheetsSync.js';
import ManageDoctors from './components/ManageDoctors.js';
import BookConsultation from './components/BookConsultation.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard'); // dashboard, profile, symptom-checker, results, doctor-portal, analytics, admin-panel
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<PredictionResult[]>([]);
  const [activePrediction, setActivePrediction] = useState<PredictionResult | null>(null);
  
  // Loading animations
  const [diagnosticRunning, setDiagnosticRunning] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState('');
  
  // Reports
  const [reportGenerating, setReportGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<MedicalReport | null>(null);
  const [reportsList, setReportsList] = useState<MedicalReport[]>([]);

  // Admin specific states
  const [systemUsers, setSystemUsers] = useState<UserType[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'loading' | 'success' | 'error'>('idle');
  const [growthPeriod, setGrowthPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [selectedAdminPatient, setSelectedAdminPatient] = useState<any | null>(null);

  // Doctors & Bookings states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Ratings states
  const [ratings, setRatings] = useState<any[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const fetchRatings = async () => {
    try {
      const res = await fetch('/api/ratings');
      if (res.ok) {
        const data = await res.json();
        setRatings(data);
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };


  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const fetchBookings = async (patientId?: string) => {
    setBookingsLoading(true);
    try {
      const url = patientId ? `/api/bookings?patientId=${patientId}` : '/api/bookings';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleAddDoctor = async (doctorData: Omit<Doctor, 'id' | 'rating'>) => {
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData)
      });
      if (res.ok) {
        await fetchDoctors();
        return true;
      }
    } catch (err) {
      console.error('Error adding doctor:', err);
    }
    return false;
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchDoctors();
        return true;
      }
    } catch (err) {
      console.error('Error removing doctor:', err);
    }
    return false;
  };

  const handleBookConsultation = async (bookingData: {
    doctor_id: string;
    doctor_name: string;
    doctor_specialty: string;
    appointment_date: string;
    appointment_time: string;
    reason: string;
  }) => {
    if (!user) return false;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user.id,
          patient_name: user.name,
          ...bookingData
        })
      });
      if (res.ok) {
        await fetchBookings(user.id);
        return true;
      }
    } catch (err) {
      console.error('Error booking consultation:', err);
    }
    return false;
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (user?.role === 'PATIENT') {
          await fetchBookings(user.id);
        } else {
          await fetchBookings();
        }
        return true;
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
    }
    return false;
  };

  const fetchAdminAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/summary');
      if (res.ok) {
        const json = await res.json();
        setAdminAnalytics(json);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    }
  };

  const handleRemoveVisitedPatient = async (patientId: string) => {
    try {
      const res = await fetch(`/api/admin/visited-patients/${patientId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchAdminAnalytics();
        return true;
      }
    } catch (err) {
      console.error('Error removing visited patient:', err);
    }
    return false;
  };

  // Load patient details or system users if logged in
  useEffect(() => {
    if (user && user.role === 'PATIENT') {
      fetchPatientBaseline();
      fetchPatientHistory();
      fetchDoctors();
      fetchBookings(user.id);
      fetchRatings();
    } else if (user && user.role === 'ADMIN') {
      fetchSystemUsers();
      fetchAdminAnalytics();
      fetchDoctors();
      fetchBookings();
    } else if (user && user.role === 'DOCTOR') {
      fetchDoctors();
      fetchBookings();
    }
  }, [user]);

  const fetchPatientBaseline = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/patients/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPatientProfile(data);
      }
    } catch (err) {
      console.error('Error fetching patient baseline:', err);
    }
  };

  const fetchPatientHistory = async () => {
    if (!user) return;
    try {
      const resPred = await fetch(`/api/predictions/patient/${user.id}`);
      if (resPred.ok) {
        const data = await resPred.json();
        // Sort by date descending
        const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentPredictions(sorted);
        if (sorted.length > 0) {
          // fetch reports as well
          const resRep = await fetch(`/api/reports/patient/${user.id}`);
          if (resRep.ok) {
            const repData = await resRep.json();
            setReportsList(repData);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Fetch all users for Admin panel
  const fetchSystemUsers = async () => {
    if (user?.role !== 'ADMIN') return;
    setAdminLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setSystemUsers(data);
      }
    } catch (err) {
      console.error('Error fetching system users:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSymptomLogSaved = async (log: SymptomLog) => {
    setDiagnosticRunning(true);
    setCurrentView('symptom-checker');
    
    // Play cool diagnostics steps
    const steps = [
      'Normalizing biomarkers and physiological baseline...',
      'Preprocessing current physical symptom indicators...',
      'Configuring Random Forest decision forest...',
      'Executing SVM hyperplane boundary projections...',
      'Running XGBoost gradient boosted classifiers...',
      'Resolving consensus clinical diagnostic weights...',
      'Explainable AI feature impact mapping complete.'
    ];

    for (let i = 0; i < steps.length; i++) {
      setDiagnosticStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const res = await fetch('/api/predictions/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: log.patient_id,
          symptoms_log_id: log.symptom_id
        })
      });
      if (!res.ok) {
        throw new Error('Prediction execution failed');
      }
      const data: PredictionResult = await res.json();
      setActivePrediction(data);
      setCurrentView('results');
      
      // reload patient history
      fetchPatientHistory();
    } catch (err) {
      console.error(err);
      setDiagnosticRunning(false);
    } finally {
      setDiagnosticRunning(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user || !activePrediction) return;
    setReportGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user.id,
          prediction_id: activePrediction.prediction_id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data);
        // reload reports
        fetchPatientHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportGenerating(false);
    }
  };

  const handleSubmitRating = async (scoreNum: number, commentStr: string) => {
    if (!user) return;
    setSubmittingRating(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user.id,
          patient_name: user.name,
          score: scoreNum,
          comment: commentStr
        })
      });
      if (res.ok) {
        setRatingSubmitted(true);
        setRatingComment('');
        await fetchRatings();
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    setPatientProfile(null);
    setRecentPredictions([]);
    setActivePrediction(null);
    setActiveReport(null);
  };

  const calculateHealthScore = () => {
    if (!patientProfile) return 100;
    let score = 100;
    
    // age baseline
    if (patientProfile.age > 50) score -= 5;
    
    // BP check
    const bpParts = patientProfile.bp.split('/');
    if (bpParts.length === 2) {
      const sys = parseInt(bpParts[0]);
      if (sys > 140) score -= 15;
      else if (sys > 120) score -= 5;
    }

    // temperature check
    if (patientProfile.temperature > 37.8) score -= 15;
    
    // smoking check
    if (patientProfile.smoking_status === 'Active') score -= 10;
    if (patientProfile.alcohol_usage === 'Regular') score -= 5;

    // recent predictions count
    if (recentPredictions.length > 0) {
      const highestRisk = recentPredictions[0].risk_level;
      if (highestRisk === 'HIGH RISK') score -= 25;
      else if (highestRisk === 'MEDIUM RISK') score -= 10;
    }

    return Math.max(10, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 stroke-green-500';
    if (score >= 65) return 'text-amber-500 stroke-amber-500';
    return 'text-red-600 stroke-red-500';
  };

  // UI Views Router helper
  const renderViewContent = () => {
    switch (currentView) {
      
      case 'dashboard':
        if (user?.role === 'PATIENT') {
          const score = calculateHealthScore();
          const hasPrediction = recentPredictions.length > 0;
          const latestPred = hasPrediction ? recentPredictions[0] : null;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              
              {/* Patient Core Dashboard stats */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Score and recent summary block */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-8 justify-between">
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Welcome, {user.name}</h2>
                    <p className="text-gray-500 text-xs">Your personalized clinical diagnostics dashboard tracks physical biomarkers, symptom progressions, and explainable ML disease models.</p>
                    <div className="pt-2">
                      <button
                        id="btn-run-symptom-checker"
                        onClick={() => setCurrentView('symptom-checker')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
                      >
                        Launch Symptom Intake
                      </button>
                    </div>
                  </div>

                  {/* Circular Score dial */}
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full rotate-270" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent" 
                        stroke={score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444'} 
                        strokeWidth="8" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-3xl font-black text-gray-900">{score}</span>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Health Score</p>
                    </div>
                  </div>
                </div>

                {/* Patient Biometrics baselines cards */}
                {patientProfile && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Biomarkers Baseline</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                          <Heart className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-semibold uppercase">Vascular BP</span>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{patientProfile.bp}</p>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-semibold uppercase">Pulse Rate</span>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{patientProfile.heart_rate} bpm</p>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0">
                          <Thermometer className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-semibold uppercase">Body Temp</span>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{patientProfile.temperature}°C</p>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xs flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <Wind className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-semibold uppercase">SpO₂ Oxygen</span>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{patientProfile.oxygen_level}%</p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Clinical Health Precautions & Preventive Guidance */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Clinical Health Precautions & Preventive Guidance
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Actionable health recommendations, symptom monitoring guidelines, and clinical checklists curated specifically for you.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Condition-specific advice if there's a suspected pathology */}
                    {latestPred ? (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 md:col-span-2 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Targeted Pathology Precautions: {latestPred.disease_name}</h4>
                          <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                            {latestPred.disease_name.toLowerCase().includes('seborrheic') ? (
                              'Avoid picking, scratching, or rubbing skin lesions to prevent secondary bacterial infection. Use mild, fragrance-free cleansers and apply gentle, non-comedogenic moisturizers daily.'
                            ) : latestPred.disease_name.toLowerCase().includes('carcinoma') || latestPred.disease_name.toLowerCase().includes('melanoma') || latestPred.disease_name.toLowerCase().includes('actinic') ? (
                              'Practice strict daily photoprotection. Apply broad-spectrum mineral sunscreen (SPF 50+) every 2 hours when outdoors. Wear protective clothing (wide-brimmed hats, UV-blocking eyewear) and avoid direct sunlight exposure during high UV index hours (10 AM - 4 PM).'
                            ) : (
                              'Closely monitor any visual changes, boundary shifts, or color variations in the suspected area. Use mild soap to avoid skin irritation and report persistent itching or bleeding.'
                            )}
                          </p>
                          <div className="mt-2.5 flex gap-2">
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
                              Severity Status: {latestPred.risk_level}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:col-span-2 flex items-start gap-3">
                        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Awaiting Pathology Diagnosis</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Complete the baseline Symptom Intake questionnaire to receive dynamically computed clinical precautions and highly specific pathology guidelines.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Standard Precaution Cards */}
                    <div className="border border-slate-100 rounded-xl p-4 flex gap-3 items-start hover:bg-slate-50/50 transition duration-150">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Daily Baseline Monitoring</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Monitor your cardiovascular pulse, oxygen saturation (SpO₂), and blood pressure levels twice daily to lock in baseline vitals.</p>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-4 flex gap-3 items-start hover:bg-slate-50/50 transition duration-150">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Hydration & Cellular Clearance</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Keep average daily hydration above 2.5 to 3.0 liters. Structured fluids support vital organ clearance and enhance dermatological cellular health.</p>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-4 flex gap-3 items-start hover:bg-slate-50/50 transition duration-150">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Urgent Care Warning Signs</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Seek immediate in-person medical attention if you experience severe shortness of breath, sudden skin color changes, or persistent chest tightness.</p>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-4 flex gap-3 items-start hover:bg-slate-50/50 transition duration-150">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Schedule Preventive Visits</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Coordinate preventative consultations with board-certified physicians using the Book Consultation engine to lock in routine check-ups.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Diagnostic History Card */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        Clinical Diagnostic & Prediction History
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Your cumulative record of symptom check-ins, predictive assessments, and AI diagnostics.</p>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full">
                      {recentPredictions.length} {recentPredictions.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>

                  {recentPredictions.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-2 space-y-3 pt-1">
                      {recentPredictions.map((pred) => {
                        const dateFormatted = new Date(pred.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div key={pred.prediction_id} className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-50/50 p-2.5 rounded-xl transition duration-150">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-gray-900">{pred.disease_name}</h4>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                  pred.risk_level === 'HIGH RISK' 
                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                    : pred.risk_level === 'MEDIUM RISK' 
                                      ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                      : 'bg-green-50 text-green-700 border-green-100'
                                }`}>
                                  {pred.risk_level}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {dateFormatted}
                              </p>
                              
                              {/* Symptoms and tablets lists inside */}
                              <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px]">
                                {pred.recommendations?.tests?.length > 0 && (
                                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                    🔬 Recommended: {pred.recommendations.tests[0]}
                                  </span>
                                )}
                                {pred.recommendations?.tablets?.length > 0 && (
                                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                    💊 Prescribed: {pred.recommendations.tablets[0].split(' - ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                              <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-blue-950">{pred.probability}% probability</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Confidence: {pred.confidence_score}%</p>
                              </div>
                              <button
                                id={`btn-view-history-${pred.prediction_id}`}
                                onClick={() => { setActivePrediction(pred); setCurrentView('results'); }}
                                className="bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-gray-200 hover:border-blue-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                              >
                                View Report
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Patient History Found</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">Complete a symptom check assessment first to generate predictive diagnostic outcomes and log your clinical history.</p>
                      <button
                        onClick={() => setCurrentView('symptom-checker')}
                        className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Start Symptom Check
                      </button>
                    </div>
                  )}
                </div>

                {/* Patient Feedback & Experiential Rating */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Rate Your Diagnostic Experience
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Help us fine-tune our virtual clinical engine and healthcare delivery models.</p>
                  </div>

                  {(() => {
                    const existingRating = ratings.find(r => r.patient_id === user.id);
                    if (existingRating || ratingSubmitted) {
                      const activeRating = existingRating || { score: ratingScore, comment: ratingComment, date: new Date().toISOString() };
                      return (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Feedback Submitted Successfully</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < activeRating.score ? 'text-amber-500 fill-amber-500' : 'text-gray-250'}`} 
                                />
                              ))}
                              <span className="text-xs font-black text-emerald-800 ml-1">({activeRating.score}/5 stars)</span>
                            </div>
                            {activeRating.comment && (
                              <p className="text-xs text-emerald-800 italic mt-1.5 leading-relaxed bg-white/60 px-3 py-2 rounded-lg border border-emerald-100/50">
                                "{activeRating.comment}"
                              </p>
                            )}
                            <p className="text-[10px] text-emerald-600 mt-2">Submitted on {new Date(activeRating.date || new Date()).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Your Experience Score:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                id={`rating-star-btn-${val}`}
                                onClick={() => setRatingScore(val)}
                                className="p-1 hover:scale-115 transition duration-150 cursor-pointer"
                              >
                                <Star 
                                  className={`w-5 h-5 transition-colors ${
                                    val <= ratingScore 
                                      ? 'text-amber-500 fill-amber-500' 
                                      : 'text-gray-300 hover:text-amber-400'
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-600 ml-1">
                            {ratingScore === 5 ? 'Excellent' : ratingScore === 4 ? 'Very Good' : ratingScore === 3 ? 'Good' : ratingScore === 2 ? 'Fair' : 'Poor'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Write a short review (Optional)</label>
                          <textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Tell us what you liked, or where we can improve our machine learning diagnostic accuracy..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition h-20"
                          />
                        </div>

                        <button
                          type="button"
                          id="btn-submit-app-rating"
                          onClick={() => handleSubmitRating(ratingScore, ratingComment)}
                          disabled={submittingRating}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {submittingRating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          {submittingRating ? 'Saving Feedback...' : 'Submit Experience Rating'}
                        </button>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Sidebar: Latest Predictions & Recommendations */}
              <div className="space-y-6">
                
                {/* Suspected Pathology Record card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Suspected Diagnostics</h3>
                  {latestPred ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Consensus Suspected Pathology</span>
                        <h4 className="text-base font-extrabold text-blue-950 mt-0.5">{latestPred.disease_name}</h4>
                        <div className="flex gap-2 mt-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${latestPred.risk_level === 'HIGH RISK' ? 'bg-red-50 text-red-700' : latestPred.risk_level === 'MEDIUM RISK' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                            {latestPred.risk_level}
                          </span>
                          <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-600">{latestPred.probability}% suspected</span>
                        </div>
                      </div>

                      {/* Recommend Tests preview */}
                      <div className="pt-3 border-t border-gray-100 space-y-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Upcoming Recommended Investigations</span>
                        <ul className="space-y-1">
                          {latestPred.recommendations.tests.slice(0, 2).map((t, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-center gap-1.5 font-medium">
                              <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        id="btn-open-latest-prediction"
                        onClick={() => { setActivePrediction(latestPred); setCurrentView('results'); }}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 pt-2"
                      >
                        Access Full Diagnostic Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-xs">
                      <CheckSquare className="w-8 h-8 text-blue-100 mx-auto mb-2" />
                      Awaiting primary symptom check inputs to execute predictive algorithms.
                    </div>
                  )}
                </div>

                {/* PDF clinical reports lists */}
                {reportsList.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Compiled Reports List</h3>
                    <div className="space-y-2">
                      {reportsList.map(rep => (
                        <button
                          id={`report-select-${rep.report_id}`}
                          key={rep.report_id}
                          onClick={() => setActiveReport(rep)}
                          className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-xs flex justify-between items-center transition"
                        >
                          <div>
                            <p className="font-bold text-gray-800">{rep.prediction.disease_name}</p>
                            <span className="text-[10px] text-gray-400 mt-0.5 block">{new Date(rep.generated_date).toLocaleDateString()}</span>
                          </div>
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          );
        } else if (user?.role === 'DOCTOR') {
          return (
            <div className="space-y-6">
              <GoogleSheetsSync />
              <DoctorPortal 
                doctorId={user.id} 
                onSelectPatient={(id) => {
                  // If patient selected, open patient's diagnostics baseline
                  setCurrentView('dashboard');
                }}
              />
            </div>
          );
        } else if (user?.role === 'ADMIN') {
          const patientsCount = systemUsers.filter(u => u.role === 'PATIENT').length;

          const triggerReset = async () => {
            setResetState('loading');
            try {
              const res = await fetch('/api/admin/reset', { method: 'POST' });
              if (res.ok) {
                setResetState('success');
                setTimeout(() => {
                  setResetState('idle');
                  window.location.reload();
                }, 1500);
              } else {
                setResetState('error');
              }
            } catch (err) {
              console.error("Error resetting database:", err);
              setResetState('error');
            }
          };

          // Selected growth dataset selection
          let growthData = [];
          if (growthPeriod === 'day') {
            growthData = adminAnalytics?.patientGrowthDetailed?.dayWise || [
              { label: 'Jun 1', patients: Math.round(patientsCount * 0.1) },
              { label: 'Jun 5', patients: Math.round(patientsCount * 0.3) },
              { label: 'Jun 12', patients: Math.round(patientsCount * 0.5) },
              { label: 'Jun 18', patients: Math.round(patientsCount * 0.7) },
              { label: 'Jun 23', patients: Math.round(patientsCount * 0.9) },
              { label: `Jun ${new Date().getDate()}`, patients: patientsCount }
            ];
          } else if (growthPeriod === 'week') {
            growthData = adminAnalytics?.patientGrowthDetailed?.weekWise || [
              { label: 'Week 1', patients: Math.round(patientsCount * 0.2) },
              { label: 'Week 2', patients: Math.round(patientsCount * 0.4) },
              { label: 'Week 3', patients: Math.round(patientsCount * 0.6) },
              { label: 'Week 4', patients: Math.round(patientsCount * 0.8) },
              { label: 'Week 5', patients: patientsCount }
            ];
          } else {
            growthData = adminAnalytics?.patientGrowthDetailed?.monthWise || adminAnalytics?.patientGrowth || [
              { label: 'Jan', patients: Math.round(patientsCount * 0.2) },
              { label: 'Feb', patients: Math.round(patientsCount * 0.4) },
              { label: 'Mar', patients: Math.round(patientsCount * 0.6) },
              { label: 'Apr', patients: Math.round(patientsCount * 0.8) },
              { label: 'May', patients: Math.round(patientsCount * 0.9) },
              { label: 'Jun', patients: patientsCount }
            ];
          }

          return (
            <div className="max-w-5xl mx-auto space-y-8 font-sans">
              <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="border-b border-gray-100 pb-6 text-center md:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">System Administration Panel</h2>
                    <p className="text-xs text-gray-500 mt-1">Direct authority panel to manage global clinical records, synchronize exports, and track patient visits.</p>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-100 px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-[9px] text-blue-800 font-extrabold uppercase tracking-widest block">Total Patients</span>
                      <p className="text-xl font-black text-blue-950 leading-none mt-0.5">{patientsCount}</p>
                    </div>
                  </div>
                </div>

                {/* Swapped "Visited Patients & Diagnostic Log" here */}
                <div className="mt-8 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Visited Patients & Diagnostic Log</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Detailed directory of active patient visits, pathological symptom logs, and diagnosed diseases.</p>
                    </div>
                    <div className="w-full md:w-80 relative">
                      <input
                        type="text"
                        placeholder="Search by patient or disease..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                        value={adminSearchTerm}
                        onChange={(e) => setAdminSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-gray-100 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="p-4">Patient Profile</th>
                          <th className="p-4">Visit Date</th>
                          <th className="p-4">Logged Symptoms</th>
                          <th className="p-4">Diagnosed Disease Face</th>
                          <th className="p-4 text-center">Threat Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                        {(() => {
                          const visitedList = adminAnalytics?.visitedPatients || [];
                          const filtered = visitedList.filter((item: any) => 
                            item.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                            item.disease_name.toLowerCase().includes(adminSearchTerm.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 font-medium bg-slate-50/20">
                                  No patient clinic visits matching search term.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((p: any) => {
                            const getRiskTag = (level: string) => {
                              switch (level) {
                                case 'HIGH RISK': return 'bg-rose-50 text-rose-700 border-rose-100';
                                case 'MEDIUM RISK': return 'bg-amber-50 text-amber-700 border-amber-100';
                                default: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
                              }
                            };

                            return (
                              <tr key={p.patient_id} className="hover:bg-slate-50/40 transition duration-150">
                                <td className="p-4">
                                  <div className="font-bold text-gray-900">{p.name}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">{p.age} yrs • {p.gender}</div>
                                  <div className="mt-1.5 flex items-center">
                                    <button
                                      type="button"
                                      id={`btn-admin-visit-count-${p.patient_id}`}
                                      onClick={() => setSelectedAdminPatient(p)}
                                      className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 hover:border-blue-200 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer"
                                      title="Click to view all historic symptom check-ins and predictions for this patient"
                                    >
                                      <History className="w-2.5 h-2.5" />
                                      {p.visit_count || 1} {p.visit_count === 1 ? 'visit' : 'visits'}
                                    </button>
                                  </div>
                                </td>
                                <td className="p-4 font-mono text-[10px] text-gray-400">
                                  {new Date(p.visit_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="p-4 max-w-xs">
                                  <div className="flex flex-wrap gap-1.5">
                                    {p.symptoms && p.symptoms.length > 0 ? (
                                      p.symptoms.map((s: string) => (
                                        <span key={s} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide">
                                          {s}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 italic text-[10px]">No symptoms logged</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="font-extrabold text-blue-900 bg-blue-50/70 border border-blue-100/60 px-2.5 py-1 rounded-lg text-[11px]">
                                    {p.disease_name}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${getRiskTag(p.risk_level)}`}>
                                    {p.risk_level}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleRemoveVisitedPatient(p.patient_id)}
                                    title="Remove from Visited Patients list"
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Google Sheets Sync Module inside Admin Control Panel */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm">
                <GoogleSheetsSync />
              </div>

              {/* Patient History Modal for Admin */}
              {selectedAdminPatient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    
                    {/* Modal Header */}
                    <div className="border-b border-gray-100 p-6 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Patient Clinical File
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-600" />
                          Cumulative Data: {selectedAdminPatient.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedAdminPatient.age} years old • {selectedAdminPatient.gender}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAdminPatient(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                      
                      {/* Vitals Summary */}
                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4">
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-2">Vitals & Clinical Profile</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Age / Gender</span>
                            <span className="font-bold text-slate-800 mt-0.5 block">{selectedAdminPatient.age} yrs / {selectedAdminPatient.gender}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Check-ins</span>
                            <span className="font-bold text-blue-700 mt-0.5 block">{selectedAdminPatient.visit_count} recorded</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100 col-span-2">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Latest Suspected Diagnosis</span>
                            <span className="font-bold text-slate-800 mt-0.5 block truncate">{selectedAdminPatient.disease_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cumulative Diagnoses List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-blue-500" />
                          Diagnostic Timeline Records
                        </h4>

                        {selectedAdminPatient.all_predictions && selectedAdminPatient.all_predictions.length > 0 ? (
                          <div className="space-y-3">
                            {selectedAdminPatient.all_predictions.map((pred: any, idx: number) => {
                              const correspondingSyms = selectedAdminPatient.all_symptoms?.find((s: any) => s.date === pred.date) || selectedAdminPatient.all_symptoms?.[idx];
                              return (
                                <div key={pred.prediction_id || idx} className="border border-slate-150 rounded-2xl p-4 bg-slate-50/30 hover:bg-slate-50/70 transition space-y-3">
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <h5 className="font-bold text-slate-900 text-sm">{pred.disease_name}</h5>
                                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {new Date(pred.date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                                      pred.risk_level === 'HIGH RISK' 
                                        ? 'bg-red-50 text-red-700 border-red-100' 
                                        : pred.risk_level === 'MEDIUM RISK' 
                                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                          : 'bg-green-50 text-green-700 border-green-100'
                                    }`}>
                                      {pred.risk_level}
                                    </span>
                                  </div>

                                  <div className="text-xs space-y-2">
                                    <div className="flex gap-4">
                                      <div>
                                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">Probability</span>
                                        <span className="font-extrabold text-blue-950">{pred.probability}%</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">Confidence Score</span>
                                        <span className="font-bold text-slate-700">{pred.confidence_score}%</span>
                                      </div>
                                    </div>

                                    {correspondingSyms?.symptoms && correspondingSyms.symptoms.length > 0 && (
                                      <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Symptoms Evaluated:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {correspondingSyms.symptoms.map((sym: string) => (
                                            <span key={sym} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                              {sym}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {pred.recommendations?.tablets && pred.recommendations.tablets.length > 0 && (
                                      <div className="bg-white border border-gray-150 p-2.5 rounded-xl space-y-1 mt-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Pharmacological Care Plan:</span>
                                        <ul className="list-disc pl-4 text-[11px] text-slate-700 space-y-0.5">
                                          {pred.recommendations.tablets.map((tab: string, tIdx: number) => (
                                            <li key={tIdx} className="leading-relaxed">
                                              <span className="font-semibold text-slate-900">{tab.split(' - ')[0]}</span>
                                              {tab.split(' - ')[1] && ` - ${tab.split(' - ')[1]}`}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                            No full predictions logged.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="border-t border-gray-100 p-4 bg-slate-50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedAdminPatient(null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Close History File
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return null;

      case 'profile':
        return user ? (
          <PatientProfileForm 
            patientId={user.id} 
            onSaveSuccess={(profile) => {
              setPatientProfile(profile);
              setCurrentView('dashboard');
            }} 
          />
        ) : null;

      case 'symptom-checker':
        return user ? (
          <SymptomCollector 
            patientId={user.id} 
            onLogSaved={handleSymptomLogSaved} 
          />
        ) : null;

      case 'results':
        return activePrediction ? (
          <AIResultView 
            prediction={activePrediction} 
            onGenerateReport={handleGenerateReport}
            reportGenerating={reportGenerating}
            hasReport={!!activeReport}
          />
        ) : null;

      case 'analytics':
        return <AnalyticsView />;

      case 'manage-doctors':
        return (
          <ManageDoctors
            doctors={doctors}
            loading={doctorsLoading}
            onAddDoctor={handleAddDoctor}
            onRemoveDoctor={handleRemoveDoctor}
          />
        );

      case 'book-consultant':
        return (
          <BookConsultation
            doctors={doctors}
            bookings={bookings}
            doctorsLoading={doctorsLoading}
            bookingsLoading={bookingsLoading}
            onBookConsultation={handleBookConsultation}
            onCancelBooking={(id) => handleUpdateBookingStatus(id, 'CANCELLED')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {!user ? (
        <LoginModule onLoginSuccess={(u) => setUser(u)} />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Sidebar / Navigation Rail */}
          <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 shrink-0 border-r border-slate-800">
            <div className="space-y-8">
              
              {/* Sidebar Header */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-white text-base font-extrabold tracking-tight">KNOW HEALTH</h1>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">AI Diagnostic Console</span>
                </div>
              </div>

              {/* Active User Label */}
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">{user.role} Access</span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                
                {user.role === 'PATIENT' && (
                  <>
                    <button
                      id="nav-dashboard"
                      onClick={() => setCurrentView('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <Activity className="w-4.5 h-4.5" />
                      Patient Dashboard
                    </button>
                    <button
                      id="nav-profile"
                      onClick={() => setCurrentView('profile')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'profile' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <User className="w-4.5 h-4.5" />
                      Baseline Profile
                    </button>
                    <button
                      id="nav-symptom-checker"
                      onClick={() => setCurrentView('symptom-checker')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'symptom-checker' || currentView === 'results' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <CheckSquare className="w-4.5 h-4.5" />
                      Symptom Checker
                    </button>
                    <button
                      id="nav-book-consultant"
                      onClick={() => setCurrentView('book-consultant')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'book-consultant' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <Calendar className="w-4.5 h-4.5" />
                      Book Consultant
                    </button>
                  </>
                )}

                {user.role === 'DOCTOR' && (
                  <>
                    <button
                      id="nav-doctor-dashboard"
                      onClick={() => setCurrentView('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <Activity className="w-4.5 h-4.5" />
                      Clinical Interventions
                    </button>
                    <button
                      id="nav-analytics"
                      onClick={() => setCurrentView('analytics')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <BarChart3 className="w-4.5 h-4.5" />
                      Clinical Analytics
                    </button>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <button
                      id="nav-admin-dashboard"
                      onClick={() => setCurrentView('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <Settings className="w-4.5 h-4.5" />
                      Admin Control Panel
                    </button>
                    <button
                      id="nav-doctors-admin"
                      onClick={() => setCurrentView('manage-doctors')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'manage-doctors' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <Stethoscope className="w-4.5 h-4.5" />
                      Manage Doctors
                    </button>
                    <button
                      id="nav-analytics-admin"
                      onClick={() => setCurrentView('analytics')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition ${currentView === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <BarChart3 className="w-4.5 h-4.5" />
                      Clinical Analytics
                    </button>
                  </>
                )}

              </nav>
            </div>

            {/* Logout trigger */}
            <button
              id="btn-logout"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition text-left mt-8"
            >
              <LogOut className="w-4.5 h-4.5" />
              Sign out session
            </button>

          </aside>

          {/* Main Workspace Frame */}
          <main className="flex-1 bg-gray-50/50 p-6 md:p-10 overflow-y-auto max-h-screen">
            
            {/* DIAGNOSTIC PROGRESS LOADER */}
            {diagnosticRunning ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-70" />
                  <div className="relative w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                    <Brain className="w-10 h-10 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">AI Diagnostics Ensemble Running</h2>
                  <p className="text-gray-500 text-xs mt-1.5 max-w-sm mx-auto">Evaluating biometrics through Random Forest, Decision Tree, XGBoost, and SVM classifiers...</p>
                </div>
                <div className="px-4 py-2 bg-blue-50 text-blue-800 text-[11px] font-mono border border-blue-100 rounded-md animate-pulse">
                  {diagnosticStep}
                </div>
              </div>
            ) : (
              renderViewContent()
            )}

          </main>

        </div>
      )}

      {/* PRINTABLE REPORT MODAL INTERFACE */}
      {activeReport && (
        <PrintableReport report={activeReport} onClose={() => setActiveReport(null)} />
      )}

    </div>
  );
}
