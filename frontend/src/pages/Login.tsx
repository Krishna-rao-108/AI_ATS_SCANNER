import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const FEATURES = [
  'ATS score against any job description',
  'AI-powered resume tailoring (zero hallucination)',
  'Evidence-based cover letter generation',
  'Multi-resume vault with instant reuse',
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-canvas)' }}>
      {/* Left panel — feature highlight */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 xl:p-14 shrink-0"
        style={{
          background: 'linear-gradient(160deg, var(--color-violet-700) 0%, var(--color-ink-900) 100%)',
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-8 h-8 rounded-[9px] bg-white/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">ResumeAI</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Land your next<br />
              <span style={{ color: 'rgba(196,181,253,1)' }}>dream role.</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-10 max-w-xs">
              An AI career workspace that gives you the edge — with grounded, evidence-based tools.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
                className="flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(167,139,250,1)' }} />
                <span className="text-sm text-white/75 leading-snug">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/30">
          Resume content is processed via a private backend. Your data never reaches public AI models.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm w-full mx-auto"
        >
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: 'var(--color-violet-600)' }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[14px] font-bold text-[var(--color-ink-900)]">ResumeAI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-ink-900)] tracking-tight mb-1.5">
              Sign in
            </h1>
            <p className="text-sm text-[var(--color-ink-500)]">
              Welcome back to your career workspace.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-3.5 py-3 rounded-[var(--radius-md)] bg-rose-50 border border-rose-200 text-[12px] text-rose-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              id="login-email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Password"
              type="password"
              id="login-password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-[12px] text-[var(--color-ink-500)]">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-violet-600)' }}
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
