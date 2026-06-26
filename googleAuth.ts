import React from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, AlertCircle, Sparkles, Pill, Heart, Check, X } from 'lucide-react';
import { PredictionResult } from '../types.js';

interface AIResultViewProps {
  prediction: PredictionResult;
  onGenerateReport: () => void;
  reportGenerating: boolean;
  hasReport: boolean;
}

export default function AIResultView({ prediction, onGenerateReport, reportGenerating, hasReport }: AIResultViewProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH RISK': return 'text-rose-600 bg-rose-50 border-rose-200 shadow-rose-100/50';
      case 'MEDIUM RISK': return 'text-amber-600 bg-amber-50 border-amber-200 shadow-amber-100/50';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100/50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'HIGH RISK': return <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'MEDIUM RISK': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Shield className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto py-4">
      
      {/* 1. Header & Disease Prediction Block */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/40 p-8 relative overflow-hidden"
        id="ai-prediction-header"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-1 opacity-60" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-emerald-50/30 to-transparent rounded-tr-full -z-1" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100/60 px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Primary Disease Diagnostic Prediction
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
              {prediction.disease_name}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Consensus Probability: <strong className="text-blue-600 font-bold">{prediction.probability}%</strong> • Confidence: <strong className="text-gray-900 font-semibold">{prediction.confidence_score}%</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              id="btn-generate-report"
              onClick={onGenerateReport}
              disabled={reportGenerating}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-2xl text-xs tracking-wider uppercase shadow-lg shadow-blue-600/25 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
            >
              {reportGenerating ? 'Generating...' : hasReport ? 'Re-Generate Report' : 'Compile Medical Report'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 2. Overall Health Risk Card */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-8 flex flex-col justify-between relative overflow-hidden"
          id="ai-risk-card"
        >
          <div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4.5 h-4.5 text-rose-500" />
                  Clinical Risk Level
                </h2>
                <p className="text-[11px] text-gray-400">Evaluated severity and health prognosis indices</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 shadow-sm ${getRiskColor(prediction.risk_level)}`}>
                {getRiskIcon(prediction.risk_level)}
                {prediction.risk_level}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100/50 text-center">
                <span className="text-[9px] text-rose-700 font-bold uppercase tracking-wider">Severity</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{prediction.risk_assessment?.severity_score || 0}%</p>
              </div>

              <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50 text-center">
                <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">Health Threat</span>
                <p className="text-2xl font-black text-amber-600 mt-1">{prediction.risk_assessment?.health_risk_percentage || 0}%</p>
              </div>

              <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 text-center">
                <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Recovery Rate</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{prediction.risk_assessment?.recovery_probability || 0}%</p>
              </div>
            </div>

            {prediction.risk_assessment?.early_warning_indicators && prediction.risk_assessment.early_warning_indicators.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Clinical Alert Indicators
                </span>
                <ul className="space-y-1.5">
                  {prediction.risk_assessment.early_warning_indicators.map((ind, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/40 text-[10px] text-blue-800 leading-normal">
            <strong>Medical Notice:</strong> This report represents artificial intelligence data synthesis. Do not skip standard diagnostic consults with certified medical staff.
          </div>
        </motion.div>

        {/* 3. Recommended Tablets & Medications Card */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 md:p-8 relative overflow-hidden"
          id="ai-tablets-card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-bl-full -z-1 opacity-40" />
          
          <div className="border-b border-gray-50 pb-4 mb-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4.5 h-4.5 text-blue-600" />
              Recommended OTC Tablets & Dosage
            </h2>
            <p className="text-[11px] text-gray-400">First-line safe symptom relief tablets with dosage schedules</p>
          </div>

          <div className="space-y-3">
            {prediction.recommendations?.tablets && prediction.recommendations.tablets.length > 0 ? (
              prediction.recommendations.tablets.map((tablet, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  key={idx}
                  className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3 hover:bg-blue-50/20 hover:border-blue-100 transition duration-150"
                >
                  <div className="bg-blue-500 text-white rounded-xl p-2 shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 leading-snug">{tablet}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Check full prescription or ask pharmacist for validation.</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs font-medium">
                No recommended tablets specified for this diagnosis. Please review with medical professionals.
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* 4. DO's and DONT's Modules */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
        id="ai-dos-donts-grid"
      >
        {/* DO's */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
            <div className="bg-emerald-500 text-white rounded-xl p-1.5 shrink-0">
              <Check className="w-4 h-4 font-black" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">
                Clinical DO's (Favorable Actions)
              </h3>
              <p className="text-[10px] text-gray-400">Actions that actively promote recovery & strength</p>
            </div>
          </div>
          
          <ul className="space-y-3">
            {prediction.recommendations?.dos && prediction.recommendations.dos.length > 0 ? (
              prediction.recommendations.dos.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400 font-medium">No actions listed</li>
            )}
          </ul>
        </div>

        {/* DON'Ts */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
            <div className="bg-rose-500 text-white rounded-xl p-1.5 shrink-0">
              <X className="w-4 h-4 font-black" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider">
                Clinical DON'Ts (Avoid Actions)
              </h3>
              <p className="text-[10px] text-gray-400">Activities to avoid to prevent further complications</p>
            </div>
          </div>
          
          <ul className="space-y-3">
            {prediction.recommendations?.donts && prediction.recommendations.donts.length > 0 ? (
              prediction.recommendations.donts.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400 font-medium">No warnings listed</li>
            )}
          </ul>
        </div>
      </motion.div>

    </div>
  );
}
