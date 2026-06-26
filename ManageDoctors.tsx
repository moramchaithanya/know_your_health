import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Printer, Mail, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import { MedicalReport } from '../types.js';

interface PrintableReportProps {
  report: MedicalReport;
  onClose: () => void;
}

export default function PrintableReport({ report, onClose }: PrintableReportProps) {
  const [emailing, setEmailing] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePrint = () => {
    // Open print layout natively
    window.print();
  };

  const handleSimulateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please provide a target dispatch email');
      return;
    }
    setError('');
    setEmailing(true);

    setTimeout(() => {
      setEmailing(false);
      setEmailSuccess(true);
      setEmailInput('');
      setTimeout(() => setEmailSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-start overflow-y-auto p-4 md:p-8 z-50 font-sans print:p-0 print:bg-white print:static print:overflow-visible">
      
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-gray-100 shadow-2xl overflow-hidden flex flex-col justify-between print:shadow-none print:border-none print:rounded-none min-h-[90vh]">
        
        {/* Actions panel - hidden during print */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Interactive Options</span>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-print-trigger"
              onClick={handlePrint}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>

            <form onSubmit={handleSimulateEmail} className="flex gap-1.5 text-xs">
              <input
                id="report-email-input"
                type="email"
                required
                placeholder="dispatch@health.org"
                className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white w-40 text-xs"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <button
                id="btn-email-trigger"
                type="submit"
                disabled={emailing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition"
              >
                {emailing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                Email
              </button>
            </form>

            <button
              id="btn-close-report"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-3 py-2 rounded-lg text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email status labels */}
        {emailSuccess && (
          <div className="mx-6 mt-4 p-3 bg-green-50 text-green-700 text-xs rounded border border-green-200 flex items-center gap-1.5 print:hidden">
            <Check className="w-4 h-4" />
            Medical clinical report dispatched to target secure server successfully!
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center gap-1.5 print:hidden">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* CLINICAL REPORT CONTENT BODY (Formatted for printing) */}
        <div id="printable-area" className="p-8 md:p-12 space-y-8 bg-white flex-1 print:p-0">
          
          {/* Hospital/Lab Letterhead */}
          <div className="border-b-4 border-blue-600 pb-5 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tight uppercase">Clinical Diagnosis Report</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">KNOW YOUR HEALTH AI CLINICS INC.</p>
            </div>
            <div className="text-right text-[10px] text-gray-400 font-mono">
              <p>Reference: {report.report_id}</p>
              <p>Date Generated: {new Date(report.generated_date).toLocaleString()}</p>
            </div>
          </div>

          {/* 1. Patient Demographics & Baseline Vitals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 rounded">I. Patient Baseline Demographics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Full Name</span>
                <p className="font-bold text-gray-800">{report.patient_info.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Age / Gender</span>
                <p className="font-bold text-gray-800">{report.patient_info.age} Years / {report.patient_info.gender}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Weight & Height</span>
                <p className="font-bold text-gray-800">{report.patient_info.weight} kg / {report.patient_info.height} cm</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Blood Group</span>
                <p className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded inline-block">{report.patient_info.blood_group}</p>
              </div>
            </div>

            {/* Vitals baseline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs border-t border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Blood Pressure</span>
                <p className="font-bold text-gray-800 font-mono">{report.patient_info.bp}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Heart Pulse Rate</span>
                <p className="font-bold text-gray-800 font-mono">{report.patient_info.heart_rate} bpm</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Temperature</span>
                <p className="font-bold text-gray-800 font-mono">{report.patient_info.temperature} °C</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Oxygen Saturation</span>
                <p className="font-bold text-gray-800 font-mono">{report.patient_info.oxygen_level}% SpO₂</p>
              </div>
            </div>
          </div>

          {/* 2. Reported Symptoms intake */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 rounded">II. Symptoms Intake Log</h3>
            <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Subjective Intake Symptoms</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.symptoms.symptoms.map(s => (
                    <span key={s} className="bg-gray-100 border border-gray-200 text-gray-800 px-2 py-1 rounded text-[11px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Logger Metadata</span>
                <p className="text-gray-700 font-medium">Logged on {new Date(report.symptoms.date).toLocaleDateString()} via {report.symptoms.input_method} method. Subjective severity was marked as <strong className="text-gray-900 font-semibold">{report.symptoms.severity}</strong>.</p>
              </div>
            </div>
          </div>

          {/* 3. AI Diagnostics consensus predictions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 rounded">III. AI Ensemble Diagnostics Prognosis</h3>
            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Consensus Suspected Pathology</span>
                  <p className="text-lg font-extrabold text-blue-900 mt-0.5">{report.prediction.disease_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Risk Classification</span>
                  <p className="text-sm font-black text-red-600 mt-0.5">{report.prediction.risk_level}</p>
                </div>
              </div>

              {/* Sub model grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-gray-100 text-[10px]">
                {report.prediction.model_predictions.map(m => (
                  <div key={m.model_name} className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                    <span className="text-gray-400 font-semibold uppercase">{m.model_name}</span>
                    <p className="font-bold text-gray-800 mt-0.5">{m.probability}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Explainable Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 rounded">IV. Explainable AI Clinical Feature Contributions</h3>
            <div className="space-y-2">
              {report.prediction.explainable_ai.map((exp, i) => (
                <div key={i} className="text-xs flex items-start gap-4 p-2 bg-gray-50/50 rounded border border-gray-100">
                  <span className="font-bold text-gray-800 w-36 shrink-0">{exp.feature}</span>
                  <span className="text-gray-400 font-semibold w-16 uppercase">{exp.impact}</span>
                  <p className="text-gray-600 font-mono flex-1 leading-normal">{exp.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Clinical Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Required Laboratory Tests</h4>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                {report.prediction.recommendations.tests.map((t, idx) => <li key={idx}>{t}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Advised Lifestyle Adaptations</h4>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                {report.prediction.recommendations.lifestyle.map((l, idx) => <li key={idx}>{l}</li>)}
              </ul>
            </div>
          </div>

          {report.prediction.recommendations.dos && report.prediction.recommendations.donts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Behavioral DO's (Favorable Actions)</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-700">
                  {report.prediction.recommendations.dos.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Behavioral DON'Ts (Actions to Avoid)</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-700">
                  {report.prediction.recommendations.donts.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* 6. Doctor clinical notes (if any) */}
          {(report.doctor_notes || report.prescription) && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1.5 rounded">V. Clinical Attending Interventions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {report.doctor_notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Attending Doctor Notes</span>
                    <p className="text-gray-700 leading-relaxed font-mono whitespace-pre-line">{report.doctor_notes}</p>
                  </div>
                )}
                {report.prescription && report.prescription.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Attending Prescriptions</span>
                    <ul className="list-decimal pl-4 space-y-1 text-gray-800 font-semibold font-mono">
                      {report.prescription.map((rx, idx) => <li key={idx}>{rx}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hospital Signature */}
          <div className="pt-12 border-t border-gray-200 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-gray-800">KNOW YOUR HEALTH CLINICS</p>
              <p className="text-gray-400">Secure electronic system validation</p>
            </div>
            <div className="text-center w-48 border-t border-gray-400 pt-1.5">
              <p className="font-semibold text-gray-700">Chief Attending Physician Signature</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Clinical Diagnostics Board Approved</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
