import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const { signup, error, clearError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanFullName) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        email: cleanEmail,
        full_name: cleanFullName,
        password,
      });
    } catch (err: any) {
      setFormError(err.message || 'Could not complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = formError || error;

  return (
    <div className="w-full max-w-sm bg-white border border-[#E7E7E5] rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[#171717]">Create your account</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Register to begin building graphic novels in Vizzy.
        </p>
      </div>

      {displayError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-200/80 text-xs text-red-700 font-medium">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold text-[#374151] mb-1"
          >
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Alex Morgan"
            className="w-full px-3.5 py-2 text-sm bg-white border border-[#D1D5DB] rounded-xl text-[#171717] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-[#374151] mb-1"
          >
            Email
          </label>
          <input
            id="signup-email"
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
            htmlFor="signup-password"
            className="block text-xs font-semibold text-[#374151] mb-1"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Minimum 8 characters"
            className="w-full px-3.5 py-2 text-sm bg-white border border-[#D1D5DB] rounded-xl text-[#171717] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition"
            required
            minLength={8}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-xs font-semibold text-[#374151] mb-1"
          >
            Confirm Password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Re-enter password"
            className="w-full px-3.5 py-2 text-sm bg-white border border-[#D1D5DB] rounded-xl text-[#171717] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition"
            required
            minLength={8}
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#F5F5F4] text-center">
        <p className="text-xs text-[#6B7280]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#171717] hover:underline focus:outline-hidden"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
