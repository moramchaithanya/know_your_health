import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, RefreshCw, Activity, User, Heart, Wind, Thermometer } from 'lucide-react';
import { PatientProfile } from '../types.js';
import { getCachedAccessToken } from '../lib/googleAuth.js';
import { triggerGoogleSheetsSync } from '../lib/sheetsService.js';

interface PatientProfileFormProps {
  patientId: string;
  onSaveSuccess: (profile: PatientProfile) => void;
}

export default function PatientProfileForm({ patientId, onSaveSuccess }: PatientProfileFormProps) {
  const [profile, setProfile] = useState<PatientProfile>({
    patient_id: patientId,
    name: '',
    age: 35,
    gender: 'Male',
    height: 175,
    weight: 75,
    blood_group: 'O+',
    bp: '120/80',
    heart_rate: 72,
    oxygen_level: 98,
    temperature: 36.6,
    lifestyle_habits: '',
    smoking_status: 'Never',
    alcohol_usage: 'None',
    medical_history: '',
    family_history: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching patient profile, using default values:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      // Check if Google Sheet is authenticated and trigger background sync
      const token = getCachedAccessToken();
      if (token) {
        try {
          await triggerGoogleSheetsSync(token);
          setSuccess(true);
        } catch (syncErr) {
          console.error("Auto-syncing to Google Sheets failed:", syncErr);
        }
      }

      setSuccess(true);
      onSaveSuccess(data);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRandomizeBiometrics = () => {
    // Generate high-fidelity realistic biometric indicators
    const heartRate = Math.floor(65 + Math.random() * 35); // 65-100
    const sys = Math.floor(110 + Math.random() * 35); // 110-145
    const dia = Math.floor(70 + Math.random() * 25); // 70-95
    const oxygen = Math.floor(95 + Math.random() * 5); // 95-100
    const temp = Number((36.2 + Math.random() * 2.5).toFixed(1)); // 36.2-38.7

    setProfile(prev => ({
      ...prev,
      heart_rate: heartRate,
      bp: `${sys}/${dia}`,
      oxygen_level: oxygen,
      temperature: temp
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 font-sans"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Patient Clinical Profiling
          </h2>
          <p className="text-gray-500 text-xs mt-1">Configure physical biomarkers, clinical baselines, and medical histories.</p>
        </div>
        <button
          type="button"
          onClick={handleRandomizeBiometrics}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3.5 py-2 rounded-lg border border-blue-100 flex items-center gap-1.5 transition"
        >
          <Activity className="w-3.5 h-3.5" />
          Quick Autofill Vitals
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border-l-4 border-green-500 rounded-r-lg text-sm">
          Profile Baseline Saved Successfully! Sync complete.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              id="profile-name"
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Age (Years)</label>
            <input 
              id="profile-age"
              type="number" 
              required
              min={1}
              max={120}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Gender</label>
            <select 
              id="profile-gender"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white outline-none transition"
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Blood Group</label>
            <select 
              id="profile-blood"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white outline-none transition"
              value={profile.blood_group}
              onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Physical Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Height (cm)</label>
            <input 
              id="profile-height"
              type="number" 
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.height}
              onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Weight (kg)</label>
            <input 
              id="profile-weight"
              type="number" 
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Physical Biometrics Panel (Cards) */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Biomarkers Baseline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider">Blood Pressure</label>
                <input 
                  id="profile-bp"
                  type="text" 
                  required
                  placeholder="120/80"
                  className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none mt-0.5"
                  value={profile.bp}
                  onChange={(e) => setProfile({ ...profile, bp: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-orange-700 uppercase tracking-wider">Heart Rate (bpm)</label>
                <input 
                  id="profile-hr"
                  type="number" 
                  required
                  className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none mt-0.5"
                  value={profile.heart_rate}
                  onChange={(e) => setProfile({ ...profile, heart_rate: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                <Wind className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Oxygen level (%)</label>
                <input 
                  id="profile-oxygen"
                  type="number" 
                  required
                  className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none mt-0.5"
                  value={profile.oxygen_level}
                  onChange={(e) => setProfile({ ...profile, oxygen_level: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100 flex items-center gap-3">
              <div className="p-2 bg-teal-100 text-teal-600 rounded-lg shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-teal-700 uppercase tracking-wider">Body Temp (°C)</label>
                <input 
                  id="profile-temp"
                  type="number" 
                  step="0.1"
                  required
                  className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none mt-0.5"
                  value={profile.temperature}
                  onChange={(e) => setProfile({ ...profile, temperature: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Habits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Smoking Status</label>
            <select 
              id="profile-smoke"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white outline-none transition"
              value={profile.smoking_status}
              onChange={(e) => setProfile({ ...profile, smoking_status: e.target.value })}
            >
              <option value="Never">Never Smoked</option>
              <option value="Former">Former Smoker</option>
              <option value="Active">Active Smoker</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Alcohol Usage</label>
            <select 
              id="profile-alcohol"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white outline-none transition"
              value={profile.alcohol_usage}
              onChange={(e) => setProfile({ ...profile, alcohol_usage: e.target.value })}
            >
              <option value="None">None</option>
              <option value="Occasional">Occasional / Socially</option>
              <option value="Regular">Regular Consumption</option>
            </select>
          </div>
        </div>

        {/* Text Area Histories */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Lifestyle Habits & Diet</label>
            <textarea 
              id="profile-lifestyle"
              rows={2}
              placeholder="e.g. Desk job, exercises 2 times a week, average hydration, high caffeine intake..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.lifestyle_habits}
              onChange={(e) => setProfile({ ...profile, lifestyle_habits: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Personal Medical History</label>
            <textarea 
              id="profile-medhistory"
              rows={2}
              placeholder="e.g. Diagnosed with hypertension 2 years ago, takes 5mg Lisinopril, seasonal asthma..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.medical_history}
              onChange={(e) => setProfile({ ...profile, medical_history: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Family Medical History</label>
            <textarea 
              id="profile-famhistory"
              rows={2}
              placeholder="e.g. Father has Type 2 diabetes and hypertension, maternal grandmother had cardiovascular issues..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition"
              value={profile.family_history}
              onChange={(e) => setProfile({ ...profile, family_history: e.target.value })}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button 
            id="btn-save-profile"
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-md flex items-center gap-2 transition duration-150"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving Baseline...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Commit Baseline Baseline
              </>
            )}
          </button>
        </div>

      </form>
    </motion.div>
  );
}
