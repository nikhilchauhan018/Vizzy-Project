import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  side = 'left',
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-2xs transition-opacity"
      />

      {/* Drawer surface */}
      <div
        className={`relative z-10 w-4/5 max-w-xs h-full bg-white border-[#E7E7E5] flex flex-col shadow-lg transition-transform duration-200 ease-in-out ${
          side === 'left' ? 'border-r mr-auto' : 'border-l ml-auto'
        }`}
      >
        {title && (
          <div className="h-14 px-4 border-b border-[#E7E7E5] flex items-center justify-between shrink-0">
            <span className="font-semibold text-sm text-[#171717]">{title}</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
