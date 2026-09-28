'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, Mail, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ fullName, email, password, phone, roleName: 'FARMER' });
        setRegistered(true);
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred. Please verify your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-ks-bg text-ks-text flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-ks-surface border border-ks-border rounded-3xl p-6 md:p-8 shadow-ks-lg flex flex-col gap-6">
        
        {/* Brand Stamp */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-4 bg-primary-green/10 rounded-full">
            <Shield className="w-12 h-12 text-primary-green fill-primary-green/10" />
          </div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-primary-green leading-none">
            Kisan Suraksha
          </h1>
          <p className="text-xs text-ks-text-secondary font-semibold max-w-xs">
            {isLogin ? 'Sign in to access early warning dashboard' : 'Create an agricultural profile to protect your fields'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 bg-ks-border/20 p-1.5 rounded-xl border border-ks-border">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 rounded-lg font-bold text-sm cursor-pointer select-none transition ${
              isLogin ? 'bg-ks-surface border border-ks-border shadow-ks-sm text-primary-green' : 'text-ks-text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 rounded-lg font-bold text-sm cursor-pointer select-none transition ${
              !isLogin ? 'bg-ks-surface border border-ks-border shadow-ks-sm text-primary-green' : 'text-ks-text-secondary'
            }`}
          >
            Register
          </button>
        </div>

        {registered && (
          <div className="bg-primary-green/10 border border-primary-green/20 rounded-xl p-3 flex gap-2 items-center text-primary-green text-xs font-semibold">
            Registration successful! Please login below.
          </div>
        )}

        {error && (
          <div className="bg-critical-red/10 border border-critical-red/20 rounded-xl p-3 flex gap-2 items-center text-critical-red text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ks-text-secondary uppercase">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-ks-text-secondary" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-ks-border bg-ks-surface text-sm focus:outline-none focus:border-primary-green"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ks-text-secondary uppercase">Mobile Number</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-ks-text-secondary" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-ks-border bg-ks-surface text-sm focus:outline-none focus:border-primary-green"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ks-text-secondary uppercase">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-ks-text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-ks-border bg-ks-surface text-sm focus:outline-none focus:border-primary-green"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ks-text-secondary uppercase">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-ks-text-secondary" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-ks-border bg-ks-surface text-sm focus:outline-none focus:border-primary-green"
              />
            </div>
            {!isLogin && (
              <p className="text-[11px] text-ks-text-secondary mt-0.5">
                Must be 8+ chars with uppercase, lowercase, number & special char (e.g. <span className="text-primary-green font-mono">Test@1234</span>)
              </p>
            )}
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-3.5 rounded-xl font-bold bg-primary-green text-white mt-2 flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLogin ? 'Sign In' : 'Register Account'}</span>
          </Button>
        </form>

      </div>
    </div>
  );
}
