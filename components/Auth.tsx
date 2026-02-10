
import React, { useState } from 'react';
import { login, register } from '../firebase/authService';
import { PiggyBank, Mail, Lock, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, password);
    } catch (err: any) {
      setError(err.message || "Auth error");
    } finally { setLoading(false); }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-4 bg-accent rounded-3xl shadow-xl shadow-accent/20 mb-4">
            <PiggyBank size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Savr</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">Simplicity in saving</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl flex items-center text-xs font-bold animate-in fade-in">
            <AlertCircle size={14} className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium focus:border-accent dark:focus:border-accent outline-none transition-all placeholder:text-zinc-400"
              required
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-14 pl-12 pr-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium focus:border-accent dark:focus:border-accent outline-none transition-all placeholder:text-zinc-400"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-accent transition-colors p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-bold h-14 rounded-2xl shadow-lg shadow-accent/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? "..." : (isLogin ? "Sign In" : "Register")}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setShowPassword(false);
          }}
          className="w-full mt-6 text-sm text-zinc-400 font-bold hover:text-accent transition-colors"
        >
          {isLogin ? "Need an account? Join us" : "Have an account? Log in"}
        </button>
      </div>
    </div>
  );
};
