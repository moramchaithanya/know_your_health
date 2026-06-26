import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, AlertCircle, Plus, Info, RefreshCw, Smartphone, CheckSquare } from 'lucide-react';
import { SymptomLog } from '../types.js';
import { getCachedAccessToken } from '../lib/googleAuth.js';
import { triggerGoogleSheetsSync } from '../lib/sheetsService.js';

interface SymptomCollectorProps {
  patientId: string;
  onLogSaved: (log: SymptomLog) => void;
}

const AVAILABLE_SYMPTOMS = [
  'Fever',
  'Headache',
  'Cough',
  'Fatigue',
  'Vomiting',
  'Chest Pain',
  'Dizziness',
  'Body Pain',
  'High BP',
  'Low BP',
  'Diabetes Symptoms (Excessive thirst/frequent urination)'
];

export default function SymptomCollector({ patientId, onLogSaved }: SymptomCollectorProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [inputMethod, setInputMethod] = useState<'Checkbox' | 'Dropdown' | 'Voice'>('Checkbox');
  const [customSymptom, setCustomSymptom] = useState('');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleSymptom = (name: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleAddCustom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleVoiceInput = () => {
    setError('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setError('Web Speech recognition is not natively supported in this browser. Showing simulated voice parser instead.');
      setIsListening(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceText('Listening for symptoms...');
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      setError('Microphone access denied or error occurred. Simulating speech transcription instead.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      parseSymptomsFromText(transcript);
    };

    recognition.start();
  };

  const handleSimulatedVoiceSubmit = (text: string) => {
    setVoiceText(text);
    parseSymptomsFromText(text);
    setIsListening(false);
  };

  const parseSymptomsFromText = (text: string) => {
    const found: string[] = [];
    const t = text.toLowerCase();
    
    if (t.includes('fever') || t.includes('temp') || t.includes('hot')) found.push('Fever');
    if (t.includes('headache') || t.includes('head pain')) found.push('Headache');
    if (t.includes('cough') || t.includes('throat')) found.push('Cough');
    if (t.includes('tired') || t.includes('fatigue') || t.includes('weak')) found.push('Fatigue');
    if (t.includes('vomit') || t.includes('nausea') || t.includes('sick')) found.push('Vomiting');
    if (t.includes('chest') || t.includes('heart pain')) found.push('Chest Pain');
    if (t.includes('dizzy') || t.includes('lighthead')) found.push('Dizziness');
    if (t.includes('body') || t.includes('ache') || t.includes('muscle')) found.push('Body Pain');
    if (t.includes('high bp') || t.includes('hypertension')) found.push('High BP');
    if (t.includes('low bp')) found.push('Low BP');
    if (t.includes('thirst') || t.includes('pee') || t.includes('urination')) found.push('Diabetes Symptoms (Excessive thirst/frequent urination)');

    if (found.length > 0) {
      setSelectedSymptoms(prev => {
        const combined = [...prev];
        found.forEach(f => {
          if (!combined.includes(f)) combined.push(f);
        });
        return combined;
      });
    } else {
      // Add general text as custom symptom if none matched
      setSelectedSymptoms(prev => [...prev, `Reported: "${text.substring(0, 40)}..."`]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError('Please select or record at least one symptom');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const logPayload = {
        patient_id: patientId,
        symptoms: selectedSymptoms,
        severity,
        input_method: inputMethod
      };

      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logPayload)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit symptoms');
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

      onLogSaved(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 font-sans"
    >
      <div className="border-b border-gray-100 pb-5 mb-6">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          Symptom Collection Intake
        </h2>
        <p className="text-gray-500 text-xs mt-1">Select current physical symptoms or record them via voice.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Methods Tab Selector */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${inputMethod === 'Checkbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => { setInputMethod('Checkbox'); setError(''); }}
        >
          Checklist
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${inputMethod === 'Voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => { setInputMethod('Voice'); setError(''); }}
        >
          Voice Input
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* CHECKLIST INPUT */}
        {inputMethod === 'Checkbox' && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Clinical Checklist</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_SYMPTOMS.map((sym) => {
                const checked = selectedSymptoms.includes(sym);
                return (
                  <button
                    id={`sym-btn-${sym.replace(/\s+/g, '-').toLowerCase()}`}
                    key={sym}
                    type="button"
                    onClick={() => { toggleSymptom(sym); setInputMethod('Checkbox'); }}
                    className={`flex items-center text-left px-4 py-3 rounded-xl border text-sm transition ${checked ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 shrink-0 ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {checked && <Plus className="w-3 h-3 stroke-[3]" />}
                    </div>
                    {sym}
                  </button>
                );
              })}
            </div>

            {/* Custom symptoms adder */}
            <div className="flex gap-2 pt-2">
              <input
                id="custom-symptom-input"
                type="text"
                placeholder="Add secondary or custom symptoms..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
              />
              <button
                id="btn-add-custom-symptom"
                type="button"
                onClick={handleAddCustom}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* VOICE INPUT */}
        {inputMethod === 'Voice' && (
          <div className="space-y-4">
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 relative">
              <button
                id="btn-voice-record"
                type="button"
                onClick={handleVoiceInput}
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
              >
                {isListening ? <Mic className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <h3 className="text-sm font-semibold text-gray-800 mt-4">
                {isListening ? 'Listening... Speak now.' : 'Tap to start voice dictation'}
              </h3>
              <p className="text-gray-500 text-xs mt-1 px-8">"Describe your symptoms naturally, e.g., I have had a heavy cough and a medium fever since yesterday morning."</p>

              {voiceText && (
                <div className="mt-4 mx-6 p-3 bg-white border border-gray-100 rounded-xl text-left">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Transcript</span>
                  <p className="text-sm text-gray-700 mt-1 font-mono italic">"{voiceText}"</p>
                </div>
              )}
            </div>

            {/* Sim parser in case mic is blocked/unsupported */}
            {isListening && !speechSupported && (
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Simulate Speech-to-Text Input
                </span>
                <p className="text-[11px] text-gray-500">Since voice recognition is disabled or unsupported, choose a verbal template below to simulate speech:</p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulatedVoiceSubmit("I am feeling extreme fatigue, got a mild fever of 38 degrees and a persistent headache.")}
                    className="text-left text-xs bg-white hover:bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-gray-700 font-medium transition"
                  >
                    "I am feeling extreme fatigue, got a mild fever of 38 degrees and a persistent headache."
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulatedVoiceSubmit("I have persistent vomiting, cough, and some chest pain.")}
                    className="text-left text-xs bg-white hover:bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 text-gray-700 font-medium transition"
                  >
                    "I have persistent vomiting, cough, and some chest pain."
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Symptoms Badges */}
        {selectedSymptoms.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Intake Symptoms Queue ({selectedSymptoms.length})</span>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map(sym => (
                <span key={sym} className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-blue-200">
                  {sym}
                  <button type="button" onClick={() => toggleSymptom(sym)} className="hover:text-red-600 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Severity selection & Submit */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Subjective Severity</span>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              {(['Mild', 'Moderate', 'Severe'] as const).map(sev => (
                <button
                  key={sev}
                  type="button"
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition ${severity === sev ? 'bg-white text-gray-900 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setSeverity(sev)}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <button
            id="btn-submit-symptoms"
            type="submit"
            disabled={saving || selectedSymptoms.length === 0}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-md flex items-center justify-center gap-2 transition duration-150"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Submitting Log...
              </>
            ) : 'Record & Analyze Symptoms'}
          </button>
        </div>

      </form>
    </motion.div>
  );
}
