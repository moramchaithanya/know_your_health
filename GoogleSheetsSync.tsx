import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, UserCheck, ShieldAlert, FileText, Check, Plus, Trash2, Heart, ArrowRight, Activity, Thermometer, RefreshCw } from 'lucide-react';
import { PatientProfile, PredictionResult, DoctorNote } from '../types.js';
import { getCachedAccessToken } from '../lib/googleAuth.js';
import { triggerGoogleSheetsSync } from '../lib/sheetsService.js';

interface DoctorPortalProps {
  doctorId: string;
  onSelectPatient: (patientId: string) => void;
}

export default function DoctorPortal({ doctorId, onSelectPatient }: DoctorPortalProps) {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected patient for active clinical intervention
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionResult | null>(null);

  // Form states for notes and prescriptions
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<string[]>([]);
  const [newPrescriptionItem, setNewPrescriptionItem] = useState('');
  const [recoveryProgress, setRecoveryProgress] = useState(50); // 0-100%
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const handleSelectPatient = async (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setPredictions([]);
    setSelectedPrediction(null);
    setClinicalNotes('');
    setPrescriptions([]);
    setNoteSuccess(false);
    setError('');

    try {
      const res = await fetch(`/api/predictions/patient/${patient.patient_id}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
        if (data.length > 0) {
          // Select most recent prediction by default
          const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setSelectedPrediction(sorted[0]);
          
          // Fetch existing doctor notes if any for this prediction
          fetchExistingNotes(sorted[0].prediction_id);
        }
      }
    } catch (err) {
      console.error('Error fetching patient predictions:', err);
    }
  };

  const fetchExistingNotes = async (predId: string) => {
    try {
      const res = await fetch(`/api/doctor-notes/patient/${selectedPatient?.patient_id}`);
      if (res.ok) {
        const data: DoctorNote[] = await res.json();
        const existingNote = data.find(n => n.prediction_id === predId);
        if (existingNote) {
          setClinicalNotes(existingNote.notes);
          setPrescriptions(existingNote.prescription || []);
          setRecoveryProgress(existingNote.recovery_progress || 50);
        }
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleAddPrescription = () => {
    if (newPrescriptionItem.trim() && !prescriptions.includes(newPrescriptionItem.trim())) {
      setPrescriptions(prev => [...prev, newPrescriptionItem.trim()]);
      setNewPrescriptionItem('');
    }
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitClinicalIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedPrediction) {
      setError('Please select a patient and their diagnostic record.');
      return;
    }
    setError('');
    setSubmittingNote(true);
    setNoteSuccess(false);

    try {
      const payload: Omit<DoctorNote, 'note_id' | 'date'> = {
        patient_id: selectedPatient.patient_id,
        prediction_id: selectedPrediction.prediction_id,
        notes: clinicalNotes,
        prescription: prescriptions,
        recovery_progress: recoveryProgress
      };

      const res = await fetch('/api/doctor-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit clinical notes');
      }

      // Check if Google Sheet is authenticated and trigger background sync
      const token = getCachedAccessToken();
      if (token) {
        try {
          await triggerGoogleSheetsSync(token);
        } catch (syncErr) {
          console.error("Auto-syncing to Google Sheets failed:", syncErr);
        }
      }

      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Patient Selection sidebar panel */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4.5 h-4.5 text-blue-600" />
            Active Patient List
          </h2>
          <a
            id="btn-export-patients"
            href="/api/patients/export"
            download="Patient_Registrations_KnowHealth.csv"
            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition"
            title="Download full patient registration database in Excel-compatible format"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Excel
          </a>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input 
            type="text" 
            placeholder="Search patient or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Patient buttons */}
        <div className="space-y-2 max-h-[450px] overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-6">No matching patients found.</p>
          ) : (
            filteredPatients.map(p => {
              const active = selectedPatient?.patient_id === p.patient_id;
              const hasFever = p.temperature > 37.8;
              const highBP = p.bp.startsWith('14') || p.bp.startsWith('15') || p.bp.startsWith('16');
              const riskAlert = hasFever || highBP;

              return (
                <button
                  id={`patient-select-${p.patient_id}`}
                  key={p.patient_id}
                  onClick={() => handleSelectPatient(p)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between gap-2 ${active ? 'bg-blue-50/50 border-blue-500 text-blue-900' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{p.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">{p.gender}, Age {p.age} • ID: {p.patient_id}</span>
                    
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-600">BP: {p.bp}</span>
                      <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-600">Temp: {p.temperature}°C</span>
                    </div>
                  </div>

                  {riskAlert && (
                    <span className="shrink-0 text-red-500" title="Clinical biomarker warning flag!">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Interventions Form and Diagnostics Panel */}
      <div className="lg:col-span-2 space-y-6">
        {selectedPatient ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Active Demographics Profile display */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selectedPatient.name}</h3>
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Clinical Vitals Baseline</span>
                </div>
                <button
                  onClick={() => onSelectPatient(selectedPatient.patient_id)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Open Full File
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Biomarkers summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-blue-600" />
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Pulse Rate</span>
                    <p className="text-sm font-bold text-gray-800">{selectedPatient.heart_rate} bpm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4.5 h-4.5 text-teal-600" />
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Temp Baseline</span>
                    <p className="text-sm font-bold text-gray-800">{selectedPatient.temperature}°C</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4.5 h-4.5 text-red-600" />
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Vascular BP</span>
                    <p className="text-sm font-bold text-gray-800">{selectedPatient.bp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold shrink-0">Blood:</span>
                  <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{selectedPatient.blood_group}</span>
                </div>
              </div>
            </div>

            {/* AI Predictions dropdown/select */}
            {predictions.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ensemble Prediction Records</h4>
                  <select 
                    id="doctor-prediction-select"
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none"
                    value={selectedPrediction?.prediction_id || ''}
                    onChange={(e) => {
                      const pred = predictions.find(p => p.prediction_id === e.target.value);
                      if (pred) {
                        setSelectedPrediction(pred);
                        fetchExistingNotes(pred.prediction_id);
                      }
                    }}
                  >
                    {predictions.map(p => (
                      <option key={p.prediction_id} value={p.prediction_id}>
                        {p.disease_name} ({p.probability}%) - {new Date(p.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPrediction && (
                  <div className="p-4 bg-blue-50/20 border border-blue-100 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-sm font-bold text-blue-900">{selectedPrediction.disease_name}</h5>
                        <p className="text-xs text-gray-500 mt-1">Calculated Ensemble Confidence: <strong>{selectedPrediction.confidence_score}%</strong></p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${selectedPrediction.risk_level === 'HIGH RISK' ? 'bg-red-100 text-red-800' : selectedPrediction.risk_level === 'MEDIUM RISK' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {selectedPrediction.risk_level}
                      </span>
                    </div>

                    {/* AI Explainability contributing features */}
                    <div className="mt-4 pt-4 border-t border-gray-100/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Primary Symptom Contributors</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedPrediction.explainable_ai.map((item, i) => (
                          <span key={i} className="text-[10px] bg-white border border-gray-100 px-2 py-1 rounded text-gray-700">
                            {item.feature} ({item.impact})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERVENTION FORM */}
                <form onSubmit={handleSubmitClinicalIntervention} className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Clinical Interventions</h4>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r text-xs">
                      {error}
                    </div>
                  )}

                  {noteSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded-r text-xs">
                      Clinical intervention records saved successfully! Report generated.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Add Clinical Diagnoses & Notes</label>
                    <textarea 
                      id="doctor-clinical-notes"
                      rows={3}
                      required
                      placeholder="Type official doctor logs, evaluations, recovery status..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                    />
                  </div>

                  {/* Prescription Builder */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Prescribe Medicines</label>
                    <div className="flex gap-2">
                      <input 
                        id="prescription-item-input"
                        type="text"
                        placeholder="e.g. Amoxicillin 500mg - 1 tablet twice daily for 5 days"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                        value={newPrescriptionItem}
                        onChange={(e) => setNewPrescriptionItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPrescription(); } }}
                      />
                      <button
                        id="btn-add-prescription"
                        type="button"
                        onClick={handleAddPrescription}
                        className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700"
                      >
                        Add
                      </button>
                    </div>

                    {/* Prescription items list */}
                    {prescriptions.length > 0 && (
                      <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-1.5">
                        {prescriptions.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center gap-4 text-xs">
                            <span className="text-gray-700 font-mono flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePrescription(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Patient Recovery Progress Slider */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <label className="font-semibold text-gray-700">Track Patient Recovery Progress</label>
                      <span className="font-bold text-blue-600">{recoveryProgress}%</span>
                    </div>
                    <input 
                      id="recovery-slider"
                      type="range"
                      min={0}
                      max={100}
                      className="w-full accent-blue-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                      value={recoveryProgress}
                      onChange={(e) => setRecoveryProgress(parseInt(e.target.value))}
                    />
                  </div>

                  <button
                    id="btn-submit-intervention"
                    type="submit"
                    disabled={submittingNote}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition duration-150"
                  >
                    {submittingNote ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving notes...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Commit Intervention Notes
                      </>
                    )}
                  </button>

                </form>

              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
                <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800">No diagnostic history found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">This patient does not have any AI prediction records logged yet. Please have the patient record symptoms first.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-16 shadow-sm text-center">
            <UserCheck className="w-12 h-12 text-blue-100 mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-800">Clinical Dashboard</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">Select a patient from the active register column on the left to review physical biomarkers, access machine learning predictions, and add diagnostic interventions.</p>
          </div>
        )}
      </div>

    </div>
  );
}
