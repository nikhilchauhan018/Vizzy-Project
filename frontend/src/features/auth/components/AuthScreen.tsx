import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  return (
    <div className="min-h-screen w-screen bg-[#FCFCFB] text-[#171717] flex flex-col items-center justify-center p-4 font-sans select-none">
      {/* Top Minimal Branding */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#171717] flex items-center justify-center text-white font-bold text-xs">
          V
        </div>
        <span className="font-bold text-lg tracking-tight text-[#171717]">Vizzy</span>
      </div>

      {mode === 'login' ? (
        <LoginForm onSwitchToSignup={() => setMode('signup')} />
      ) : (
        <SignupForm onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  );
};
