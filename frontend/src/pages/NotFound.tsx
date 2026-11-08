import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-violet-50)] text-[var(--color-violet-600)] border border-[var(--color-violet-100)] flex items-center justify-center mb-4 shadow-[var(--shadow-xs)]">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-[var(--color-ink-900)] tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-[var(--color-ink-500)] mt-2 max-w-sm leading-relaxed">
        The requested ATS resource or page does not exist or has been relocated.
      </p>
      <div className="mt-6">
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
