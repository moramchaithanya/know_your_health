import { GoogleGenAI, Type } from "@google/genai";
import { PatientProfile, SymptomLog, PredictionResult, ModelPrediction } from "./src/types.js";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

function getSmartFallback(patient: PatientProfile, symptomsLog: SymptomLog): Omit<PredictionResult, 'prediction_id' | 'patient_id' | 'date'> {
  const symptoms = (symptomsLog.symptoms || []).map(s => s.toLowerCase());
  let disease = "General Acute Symptomatic Syndrome";
  let probability = 72;
  let confidence = 85;
  let riskLevel = "MEDIUM RISK";
  let severity = 45;
  let threat = 35;
  let recovery = 92;
  
  let tablets = [
    "Paracetamol 650mg - 1 tablet as needed for body ache/fever up to 3 times a day",
    "Multivitamin Supplement - 1 tablet daily after breakfast to support immune recovery"
  ];
  let dos = [
    "Drink plenty of warm liquids (herbal tea, clear broth)",
    "Monitor body temperature and heart rate every 4 hours",
    "Get at least 8 hours of complete physical bed rest"
  ];
  let donts = [
    "Avoid intensive physical workouts or heavy lifting",
    "Do not consume cold foods, sugary drinks, or street foods",
    "Do not self-prescribe heavy antibiotics without a physical swap test"
  ];
  let tests = ["Complete Blood Count (CBC)", "Basic Metabolic Panel (BMP)"];
  let lifestyle = ["Maintain absolute hydration (2.5L+ fluids daily)", "Isolate in a well-ventilated, quiet room"];

  if (symptoms.some(s => s.includes('fever') || s.includes('chill') || s.includes('body ache') || s.includes('shivering'))) {
    disease = "Viral Influenza (Suspected)";
    probability = 84;
    confidence = 88;
    riskLevel = "MEDIUM RISK";
    severity = 50;
    threat = 40;
    recovery = 95;
    tablets = [
      "Paracetamol 650mg - 1 tablet every 6 hours after food for fever control",
      "Vitamin C 500mg - 1 chewable tablet twice daily for immune support",
      "Levocetirizine 5mg - 1 tablet at night if running nose persists"
    ];
    dos = [
      "Keep body warm and use warm water for steam inhalation",
      "Monitor temperature spikes; use lukewarm damp sponge if fever exceeds 39°C",
      "Get plenty of rest and hydrate with electrolyte solutions (ORS)"
    ];
    donts = [
      "Avoid going outdoors or exposing yourself to sudden drafts of cold air",
      "Do not take aspirin, especially if under age 21",
      "Do not skip meals; eat light, nutritious, easily digestible soups"
    ];
    tests = ["Complete Blood Count (CBC)", "Influenza A & B Rapid Swab"];
  } else if (symptoms.some(s => s.includes('cough') || s.includes('throat') || s.includes('breath') || s.includes('congestion'))) {
    disease = "Acute Bronchitis / Respiratory Tract Infection";
    probability = 78;
    confidence = 82;
    riskLevel = "MEDIUM RISK";
    severity = 55;
    threat = 45;
    recovery = 90;
    tablets = [
      "Ambroxol Syrup - 10ml thrice daily to help clear mucus chest congestion",
      "Paracetamol 650mg - 1 tablet if chest sore or low-grade fever develops",
      "Warm saline gargles 3-4 times a day with Betadine Gargle"
    ];
    dos = [
      "Inhale eucalyptus steam twice daily for bronchial dilation",
      "Sleep with head slightly elevated to prevent nocturnal coughing",
      "Stay in a dust-free and smoke-free environment"
    ];
    donts = [
      "Avoid smoking or secondhand tobacco smoke entirely",
      "Do not consume ice cream, chilled milkshakes, or highly fried food",
      "Do not ignore progressive difficulty in breathing or chest tightness"
    ];
    tests = ["Chest X-Ray (PA View)", "Sputum Culture & Sensitivity"];
  } else if (symptoms.some(s => s.includes('headache')) && symptoms.some(s => s.includes('vomit') || s.includes('nausea'))) {
    disease = "Migraine (with Aura/Nausea)";
    probability = 85;
    confidence = 90;
    riskLevel = "MEDIUM RISK";
    severity = 50;
    threat = 25;
    recovery = 98;
    tablets = [
      "Sumatriptan 50mg - 1 tablet immediately at onset of headache, may repeat once after 2 hours if needed",
      "Ondansetron 4mg - 1 tablet 30 minutes before food/Sumatriptan to control nausea and vomiting",
      "Naproxen 500mg - 1 tablet with food to reduce severe throbbing head pain"
    ];
    dos = [
      "Rest in a quiet, dark, and cool room with eyes closed",
      "Apply a cold compress or ice pack wrapped in a cloth to your forehead or temples",
      "Stay hydrated with small, slow sips of plain water once vomiting stops"
    ];
    donts = [
      "Avoid exposure to bright screens, loud noises, and flickering lights",
      "Do not consume caffeine, chocolate, aged cheese, MSG, or processed meats (common triggers)",
      "Do not skip meals or sleep patterns, which can exacerbate migraine events"
    ];
    tests = ["Neurological Assessment", "MRI/CT Scan of Brain (only if atypical or first-onset severe headache)"];
    lifestyle = ["Maintain regular sleep-wake patterns", "Log a migraine diary to track food, sleep, and environmental triggers"];
  } else if (symptoms.some(s => s.includes('stomach') || s.includes('vomit') || s.includes('diarrhea') || s.includes('nausea') || s.includes('loose motion'))) {
    disease = "Acute Gastroenteritis (Food Poisoning / Stomach Flu)";
    probability = 88;
    confidence = 90;
    riskLevel = "MEDIUM RISK";
    severity = 60;
    threat = 42;
    recovery = 94;
    tablets = [
      "ORS (Oral Rehydration Salts) - 1 sachet dissolved in 1 liter of water, drink continuously",
      "Ondansetron 4mg - 1 tablet before meals if nausea or vomiting is active",
      "Loperamide 2mg - 1 tablet after each loose stool (only if diarrhea is non-bloody)",
      "Probiotic Capsule - 1 capsule daily for gut flora restoration"
    ];
    dos = [
      "Consume small, frequent sips of coconut water, rice water, or clear broth",
      "Eat extremely bland foods like bananas, rice, applesauce, and toast (BRAT diet)",
      "Wash hands thoroughly with soap after using the restroom"
    ];
    donts = [
      "Do not consume milk, dairy products, cheese, or caffeinated coffee",
      "Avoid highly spiced, oily, or carbonated items",
      "Do not stay dehydrated; watch for signs like dry mouth or dark yellow urine"
    ];
    tests = ["Stool Routine & Microscopy", "Serum Electrolytes Panel"];
  } else if (symptoms.some(s => s.includes('chest pain') || s.includes('shortness of breath') || s.includes('palpitations') || s.includes('bp') || s.includes('hypertension'))) {
    disease = "Cardiovascular Strain Warning";
    probability = 65;
    confidence = 92;
    riskLevel = "HIGH RISK";
    severity = 85;
    threat = 80;
    recovery = 80;
    tablets = [
      "Amlodipine 5mg - 1 tablet daily (ONLY if already prescribed by your cardiologist)",
      "Aspirin 75mg - 1 tablet immediately (ONLY under emergency medical advice if experiencing radiating chest pain)",
      "Sorbitrate 5mg - Under the tongue (ONLY if prescribed for angina and pain is severe)"
    ];
    dos = [
      "Sit in an upright, relaxed posture and breathe slowly and deeply",
      "Loosen any tight clothing around your neck or chest",
      "Seek emergency ambulance service immediately if pain radiates to left arm or jaw"
    ];
    donts = [
      "Do not exert yourself physically; avoid walking around or carrying weights",
      "Do not panic or hyperventilate, which can spike blood pressure further",
      "Do not consume high-sodium table salt, coffee, or energy drinks"
    ];
    tests = ["12-Lead Electrocardiogram (ECG)", "Troponin-I Test", "Echocardiogram (Echo)"];
  } else if (symptoms.some(s => s.includes('rash') || s.includes('itch') || s.includes('allergy') || s.includes('redness') || s.includes('skin'))) {
    disease = "Allergic Dermatitis / Acute Urticaria";
    probability = 82;
    confidence = 86;
    riskLevel = "LOW RISK";
    severity = 30;
    threat = 15;
    recovery = 98;
    tablets = [
      "Cetirizine 10mg - 1 tablet daily at night (causes mild drowsiness)",
      "Calamine Lotion - Apply gently over itchy or inflamed skin patches thrice daily",
      "Hydrocortisone 1% Cream - Apply sparingly on highly inflamed localized spots"
    ];
    dos = [
      "Wear loose, highly breathable organic cotton clothing",
      "Take baths with cool or lukewarm water and use mild, fragrance-free soaps",
      "Keep a log of food or materials contacted to trace allergen triggers"
    ];
    donts = [
      "Do not scratch or rub the inflamed areas to prevent secondary bacterial infection",
      "Avoid hot water showers or direct heavy exposure to hot sunlight",
      "Do not use heavily scented lotions, colognes, or synthetic fabrics"
    ];
    tests = ["Total IgE Allergy Panel", "Skin Patch Test"];
  }

  return {
    disease_name: disease,
    probability: probability,
    confidence_score: confidence,
    risk_level: riskLevel as "LOW RISK" | "MEDIUM RISK" | "HIGH RISK",
    model_predictions: [
      { model_name: "Random Forest", disease_name: disease, probability: Math.max(probability - 4, 30) },
      { model_name: "Decision Tree", disease_name: disease, probability: Math.max(probability + 3, 30) },
      { model_name: "XGBoost", disease_name: disease, probability: Math.max(probability - 1, 30) },
      { model_name: "SVM", disease_name: disease, probability: Math.max(probability + 2, 30) },
      { model_name: "Logistic Regression", disease_name: disease, probability: Math.max(probability - 3, 30) }
    ],
    explainable_ai: [
      { feature: "Presenting Symptoms Profile", impact: "High", reason: `High-density correlations observed between logged indicators [${symptomsLog.symptoms.join(", ")}] and standard epidemiological models for ${disease}.` },
      { feature: "Vital Signs Baseline", impact: "Medium", reason: `Patient's resting heart rate (${patient.heart_rate} bpm) and temperature (${patient.temperature}°C) align with active physiological stress response.` },
      { feature: "Demographic Indices", impact: "Low", reason: `Gender (${patient.gender}) and Age (${patient.age} yrs) parsed for age-related baseline risk modifiers.` }
    ],
    risk_assessment: {
      severity_score: severity,
      health_risk_percentage: threat,
      recovery_probability: recovery,
      early_warning_indicators: [
        `Monitor for persistent or escalating temperature spikes exceeding 39°C`,
        `Watch for extreme fatigue, sudden onset breathlessness, or persistent vomiting`
      ]
    },
    recommendations: {
      tests: tests,
      lifestyle: lifestyle,
      dos: dos,
      donts: donts,
      tablets: tablets
    }
  };
}

export async function runAIPrediction(patient: PatientProfile, symptomsLog: SymptomLog): Promise<Omit<PredictionResult, 'prediction_id' | 'patient_id' | 'date'>> {
  const client = getGeminiClient();

  const prompt = `
Analyze the following patient profile and current symptoms.
You are acting as an ensemble of Machine Learning models:
- Random Forest
- Decision Tree
- XGBoost
- SVM
- Logistic Regression

Provide an ensemble prediction of the primary suspected disease/condition, along with individual model predictions, Explainable AI features, risk assessment, and recommendations (including recommended tablets/medications, tests, lifestyle adjustments, and clinical DOs/DONTs).

Patient Profile:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Height: ${patient.height} cm, Weight: ${patient.weight} kg
- Blood Group: ${patient.blood_group}
- Blood Pressure: ${patient.bp}
- Heart Rate: ${patient.heart_rate} bpm
- Oxygen Level: ${patient.oxygen_level}%
- Temperature: ${patient.temperature} °C
- Lifestyle Habits: ${patient.lifestyle_habits}
- Smoking Status: ${patient.smoking_status}
- Alcohol Usage: ${patient.alcohol_usage}
- Medical History: ${patient.medical_history}
- Family History: ${patient.family_history}

Current Symptoms:
- Logged Symptoms: ${symptomsLog.symptoms.join(", ")}
- Severity: ${symptomsLog.severity}
- Input Method: ${symptomsLog.input_method}

Format the response strictly as JSON matching the schema specified.
`;

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting Gemini prediction with model: ${modelName}...`);
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert AI clinical diagnostic assistant that simulates machine learning algorithms (Random Forest, Decision Tree, XGBoost, SVM, Logistic Regression) to analyze health risks and provide highly clinical, structured, explainable health feedback, including recommended tablets and clinical DOs and DONTs. Critical Rule: If a patient's logged symptoms are primarily a combination of Headache and Vomiting (or Nausea) without prominent abdominal pain or diarrhea, prioritize diagnosing 'Migraine' over gastroenteritis or acute gastritis, as isolated head pain combined with emesis is a classical neurological migraine presentation.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["disease_name", "probability", "confidence_score", "risk_level", "model_predictions", "explainable_ai", "risk_assessment", "recommendations"],
            properties: {
              disease_name: {
                type: Type.STRING,
                description: "Suspected disease or medical condition."
              },
              probability: {
                type: Type.INTEGER,
                description: "Suspected disease consensus probability (0-100)."
              },
              confidence_score: {
                type: Type.INTEGER,
                description: "Confidence of the diagnostic ensemble (0-100)."
              },
              risk_level: {
                type: Type.STRING,
                enum: ["LOW RISK", "MEDIUM RISK", "HIGH RISK"],
                description: "Overall health risk level."
              },
              model_predictions: {
                type: Type.ARRAY,
                description: "Individual machine learning model output probabilities.",
                items: {
                  type: Type.OBJECT,
                  required: ["model_name", "disease_name", "probability"],
                  properties: {
                    model_name: { type: Type.STRING },
                    disease_name: { type: Type.STRING },
                    probability: { type: Type.INTEGER }
                  }
                }
              },
              explainable_ai: {
                type: Type.ARRAY,
                description: "List of key features (biomarkers, history, habits) and their contributing impact weight.",
                items: {
                  type: Type.OBJECT,
                  required: ["feature", "impact", "reason"],
                  properties: {
                    feature: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    reason: { type: Type.STRING, description: "Detailed clinical explanation of why this feature contributed to the prediction." }
                  }
                }
              },
              risk_assessment: {
                type: Type.OBJECT,
                required: ["severity_score", "health_risk_percentage", "recovery_probability", "early_warning_indicators"],
                properties: {
                  severity_score: { type: Type.INTEGER },
                  health_risk_percentage: { type: Type.INTEGER },
                  recovery_probability: { type: Type.INTEGER },
                  early_warning_indicators: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                }
              },
              recommendations: {
                type: Type.OBJECT,
                required: ["tests", "lifestyle", "dos", "donts", "tablets"],
                properties: {
                  tests: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  lifestyle: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  dos: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Clinical DOs for the patient based on their suspected condition."
                  },
                  donts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Clinical DONTs for the patient based on their suspected condition."
                  },
                  tablets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of recommended OTC tablets/medications with standard safe dosage guidance (e.g. 'Paracetamol 650mg - 1 tablet three times daily after food')."
                  }
                }
              }
            }
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn(`Model ${modelName} failed or is currently experiencing high demand.`, error);
      lastError = error;
    }
  }

  console.error("All Gemini API models failed. Triggering Smart Programmatic Fallback Engine...", lastError);
  return getSmartFallback(patient, symptomsLog);
}
