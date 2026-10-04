import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
    } catch (err: any) {
      setFormError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;

  return (
    <div className="w-full max-w-sm bg-white border border-[#E7E7E5] rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[#171717]">Sign in to Vizzy</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Enter your email and password to access your studio workspace.
        </p>
      </div>

      {displayError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-200/80 text-xs text-red-700 font-medium">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-[#374151] mb-1.5"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="artist@vizzy.studio"
            className="w-full px-3.5 py-2 text-sm bg-white border border-[#D1D5DB] rounded-xl text-[#171717] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-[#374151] mb-1.5"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="••••••••"
            className="w-full px-3.5 py-2 text-sm bg-white border border-[#D1D5DB] rounded-xl text-[#171717] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition"
            required
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 bg-[#171717] hover:bg-[#262626] active:bg-[#000000] text-white text-xs font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#F5F5F4] text-center">
        <p className="text-xs text-[#6B7280]">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-[#171717] hover:underline focus:outline-hidden"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};
