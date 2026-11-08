import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      try {
        await login({ email: email.trim(), password });
        navigate('/');
      } catch {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. The email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'var(--color-canvas)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-violet-600), var(--color-violet-700))' }}
            >
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-[17px] font-bold text-[var(--color-ink-900)] tracking-tight">ResumeAI</span>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[var(--radius-xl)] p-8"
          style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="mb-7 text-center">
            <h1 className="text-xl font-bold text-[var(--color-ink-900)] tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-sm text-[var(--color-ink-500)]">
              Start building your AI-powered career toolkit
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
              label="Full name"
              type="text"
              id="signup-name"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email address"
              type="email"
              id="signup-email"
              required
              autoComplete="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Password"
              type="password"
              id="signup-password"
              required
              autoComplete="new-password"
              placeholder="Minimum 6 characters"
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
                {isLoading ? 'Creating account…' : 'Create account'}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-[12px] text-[var(--color-ink-500)]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-violet-600)' }}
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] text-[var(--color-ink-300)]">
          Resume data is processed privately. Never shared with public AI models.
        </p>
      </motion.div>
    </div>
  );
};
