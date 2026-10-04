import React from 'react';
import { X, User, CreditCard, Settings, LogOut, CheckCircle2 } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  onSignOut?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'artist@vizzy.studio',
  userName = 'Artist',
  onSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7E7E5] rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F5F5F4] border border-[#E7E7E5] flex items-center justify-center font-bold text-xs text-[#171717]">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#171717]">{userName}</h3>
              <p className="text-xs text-[#6B7280]">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close account modal"
            className="p-1 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan / Subscription */}
        <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E7E7E5] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-[#171717] flex items-center gap-1">
              <span>Go Plan</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div className="text-[11px] text-[#6B7280]">Active subscription</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#E7E7E5] text-[#171717] font-medium">
            Pro
          </span>
        </div>

        {/* Actions list */}
        <div className="space-y-1 text-xs">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#171717] hover:bg-[#F5F5F4] transition text-left"
          >
            <User className="w-4 h-4 text-[#6B7280]" />
            <span>Profile details</span>
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#171717] hover:bg-[#F5F5F4] transition text-left"
          >
            <CreditCard className="w-4 h-4 text-[#6B7280]" />
            <span>Billing & invoices</span>
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#171717] hover:bg-[#F5F5F4] transition text-left"
          >
            <Settings className="w-4 h-4 text-[#6B7280]" />
            <span>Account preferences</span>
          </button>
          <button
            onClick={() => {
              onClose();
              if (onSignOut) onSignOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition text-left"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
