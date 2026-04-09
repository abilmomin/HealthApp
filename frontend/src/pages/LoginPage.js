import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Google sign-in failed');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #2d5a27 0%, #3d6b35 30%, #4a7c42 60%, #3d6b35 100%)' }}
      data-testid="login-page"
    >
      <div className="mb-8 flex flex-col items-center">
        <Leaf className="w-20 h-20 text-[#c0c86a] mb-4 drop-shadow-lg" strokeWidth={1.5} />
        <h1 className="text-5xl md:text-6xl font-black font-['Barlow_Condensed'] tracking-tight text-white drop-shadow-md">
          Healthmax Tracking
        </h1>
      </div>

      <div className="w-full max-w-md bg-[#1a2535]/90 backdrop-blur-sm border border-[#5b9a3c]/20 rounded-xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-white mb-1 text-center">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-[#94a3b8] font-['Manrope'] text-sm mb-6 text-center">
          {isRegister ? 'Start your fitness journey' : 'Sign in to continue tracking'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-4 text-sm font-['Manrope']" data-testid="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5b9a3c]/60" />
              <input
                type="text"
                placeholder="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0f1a1a] border border-[#5b9a3c]/20 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#5a6a70] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c] transition-colors"
                data-testid="register-name-input"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5b9a3c]/60" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0f1a1a] border border-[#5b9a3c]/20 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#5a6a70] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c] transition-colors"
              data-testid="email-input"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5b9a3c]/60" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#0f1a1a] border border-[#5b9a3c]/20 rounded-lg pl-11 pr-11 py-3 text-white placeholder:text-[#5a6a70] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c] transition-colors"
              data-testid="password-input"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6a70] hover:text-[#94a3b8]">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5b9a3c] hover:bg-[#4a8530] text-white py-3 rounded-lg font-bold font-['Barlow_Condensed'] uppercase tracking-wider transition-colors disabled:opacity-50"
            data-testid="auth-submit-button"
          >
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-[#5b9a3c]/20" />
          <span className="px-4 text-xs text-[#5a6a70] uppercase tracking-wider font-['Manrope']">or</span>
          <div className="flex-1 h-px bg-[#5b9a3c]/20" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#0f1a1a] border border-[#5b9a3c]/20 hover:border-[#5b9a3c]/40 text-white py-3 rounded-lg font-['Manrope'] font-medium transition-colors disabled:opacity-50"
          data-testid="google-signin-button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>

        <p className="mt-5 text-center text-sm text-[#5a6a70] font-['Manrope']">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-[#8bc34a] hover:text-[#a4d65e] font-medium"
            data-testid="toggle-auth-mode"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
}
