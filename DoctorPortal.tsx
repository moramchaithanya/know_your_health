import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, Mail, UserCheck, AlertCircle, RefreshCw, Send, CheckCircle, ArrowLeft, Clipboard } from 'lucide-react';
import { User } from '../types.js';
import { googleSignIn } from '../lib/googleAuth.js';
import { sendOtpEmail } from '../lib/gmailService.js';

interface LoginModuleProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginModule({ onLoginSuccess }: LoginModuleProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification details
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [copied, setCopied] = useState(false);

  // Is the current input the admin user?
  const isAdminUser = email.trim().toLowerCase() === 'chaithanya@430' || email.trim().toLowerCase() === 'chaithanya@430@example.com';

  const triggerOtpSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@') && !isAdminUser) {
      setError('Please enter a valid email address (e.g., name@domain.com)');
      return;
    }

    setLoading(true);

    try {
      // Check if user exists on the backend first
      const response = await fetch('/api/users');
      if (response.ok) {
        const users: User[] = await response.json();
        const userExists = users.some(u => 
          u.username.toLowerCase() === email.trim().toLowerCase() ||
          (email.includes('@') && u.username.toLowerCase() === email.trim().split('@')[0].toLowerCase())
        );

        if (!userExists && !isRegistering) {
          throw new Error('No account found under this email. Please switch to the Register tab.');
        }
        if (userExists && isRegistering) {
          throw new Error('An account with this email already exists. Please login instead.');
        }
      }

      if (isAdminUser) {
        // Admins use PIN instead of standard OTP
        setOtpSent(true);
        setLoading(false);
        return;
      }

      // Generate a realistic 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      setOtpSent(true);
      setShowNotification(true);
      setCopied(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminUser) {
        // Verify via PIN backend
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'Chaithanya@430', password: adminPin })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Incorrect Admin PIN. Please check credentials.');
        }
        onLoginSuccess(data.user);
      } else {
        // Standard OTP verification
        if (enteredOtp !== generatedOtp) {
          throw new Error('Incorrect OTP code. Please enter the precise 6-digit code sent.');
        }

        // OTP is correct! Now log in on the backend
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email.trim(), password: 'otp_verified' })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to authenticate.');
        }
        setShowNotification(false);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // 1. Call register API to save user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email.trim().toLowerCase(),
          role: 'PATIENT',
          name: name.trim()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // 2. Generate registration verification OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      setOtpSent(true);
      setShowNotification(true);
      setCopied(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-12 font-sans relative overflow-hidden">
      
      {/* Decorative animated background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Simulated Email Notification Toast (OTP Dispatcher) */}
      <AnimatePresence>
        {showNotification && generatedOtp && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 overflow-hidden"
            id="otp-dispatch-sim"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="flex gap-3">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl self-start">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">Simulated Mailbox</span>
                  <span className="text-[9px] font-medium text-gray-400">Just Now</span>
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  From: <span className="text-blue-600">security@knowyourhealth.org</span>
                </p>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">Subject: OTP Verification Code</p>
                  <p className="text-[11px] text-slate-600">
                    Your verification security code is <strong className="text-indigo-600 text-sm font-black font-mono select-all">{generatedOtp}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold tracking-wider uppercase py-2 rounded-lg transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5" />
                      Copy OTP Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100/50 overflow-hidden relative z-10"
      >
        {/* Dynamic header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 px-8 py-10 text-center text-white relative border-b border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
          <motion.div 
            animate={{ scale: [0.95, 1.02, 0.95] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto bg-blue-500/10 border border-blue-500/20 w-16 h-16 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-md"
          >
            <Shield className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h2 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-400">
            KNOW YOUR HEALTH
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 tracking-wide font-medium">Explainable AI Clinical Diagnostics Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5 rounded-2xl"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!otpSent ? (
              <motion.div
                key="input-stage"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Custom Role Selector tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                  <button
                    type="button"
                    className={`w-1/2 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${!isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => { setIsRegistering(false); setError(''); }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`w-1/2 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => { setIsRegistering(true); setError(''); }}
                  >
                    Register
                  </button>
                </div>

                {!isRegistering ? (
                  /* Standard Login - Requests Email */
                  <form onSubmit={triggerOtpSend} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address / Admin User</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input 
                          id="login-email"
                          type="text" 
                          required
                          placeholder="e.g. patient@example.com"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-2xl text-sm font-medium outline-none transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <button 
                      id="btn-login-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing Security Dispatch...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {isAdminUser ? 'Verify Admin ID' : 'Send Verification OTP'}
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Standard Patient Registration */
                  <form onSubmit={handleRegisterAndSendOtp} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        id="register-name"
                        type="text" 
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-2xl text-sm font-medium outline-none transition"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input 
                          id="register-email"
                          type="email" 
                          required
                          placeholder="your-name@domain.com"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-2xl text-sm font-medium outline-none transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Security Access Level:</span>
                      <span className="font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl uppercase tracking-wider text-[10px]">Patient</span>
                    </div>

                    <button 
                      id="btn-register-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Registering User...
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Register & Send OTP
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              /* OTP OR PIN ENTERING STAGE */
              <motion.form
                key="otp-stage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerifyAndLogin}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {isAdminUser ? 'Enter Security PIN' : 'Verify One-Time Password'}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {isAdminUser 
                      ? 'Administrative credential checking required.' 
                      : `We dispatched a secure 6-digit confirmation key to ${email}`}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    {isAdminUser ? '4-Digit Admin PIN' : '6-Digit OTP Code'}
                  </label>
                  
                  {isAdminUser ? (
                    <input 
                      id="admin-pin"
                      type="password" 
                      maxLength={4}
                      required
                      placeholder="••••"
                      className="w-full text-center tracking-widest text-3xl px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-2xl outline-none transition"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                    />
                  ) : (
                    <input 
                      id="otp-code"
                      type="text" 
                      maxLength={6}
                      required
                      placeholder="000000"
                      className="w-full text-center tracking-[0.25em] text-2xl font-black px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-2xl outline-none transition"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-black hover:to-indigo-900 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-indigo-400" />
                        Verify & Access Portal
                      </>
                    )}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setOtpSent(false); setError(''); setEnteredOtp(''); setAdminPin(''); }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-slate-900 font-bold transition-all py-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change Email
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
