import React, { useState } from 'react';
import { Project } from '../../types/story';
import { Plus, ChevronRight, MessageSquare } from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNewChat: () => void;
  onOpenAccount: () => void;
  fullName?: string;
  userEmail?: string;
  userName?: string;
  userPlan?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onNewChat,
  onOpenAccount,
  fullName,
  userEmail,
  userName,
  userPlan = 'Go Plan',
}) => {
  const displayName = fullName || userName || 'Artist';
  const [showAllChats, setShowAllChats] = useState(false);

  const displayedProjects = showAllChats ? projects : projects.slice(0, 8);
  const hasMore = projects.length > 8;

  return (
    <aside className="w-full h-full bg-[#FFFFFF] border-r border-[#E7E7E5] flex flex-col justify-between select-none">
      {/* Top Brand & New Chat */}
      <div className="p-4 sm:p-5 space-y-4 shrink-0">
        {/* Vizzy Branding */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight text-[#171717]">
            Vizzy
          </span>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F5F5F4] border border-[#E7E7E5] text-[#171717] text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-2xs min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
        <div className="px-2 py-1 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
          Chats
        </div>

        <div className="space-y-0.5">
          {displayedProjects.map((p) => {
            const isSelected = p.id === activeProjectId;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`w-full px-2.5 py-2 rounded-xl text-left text-xs transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#EEF5FF] text-[#171717] font-medium'
                    : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4]'
                }`}
              >
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'
                  }`}
                />
                <span className="truncate flex-1">{p.title || 'Untitled Story'}</span>
              </button>
            );
          })}
        </div>

        {/* Show more toggle */}
        {hasMore && (
          <button
            onClick={() => setShowAllChats(!showAllChats)}
            className="w-full px-2.5 py-1.5 text-left text-[11px] text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F5F5F4] rounded-lg transition mt-1"
          >
            {showAllChats ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Account Section Fixed at Bottom */}
      <div className="p-3 border-t border-[#E7E7E5] bg-[#FFFFFF] shrink-0">
        <button
          onClick={onOpenAccount}
          className="w-full p-2 rounded-xl hover:bg-[#F5F5F4] transition flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[#F5F5F4] border border-[#E7E7E5] flex items-center justify-center font-bold text-xs text-[#171717] shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-[#171717] truncate">{displayName}</div>
              <div className="text-[10px] text-[#9CA3AF] truncate">{userEmail || userPlan}</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
        </button>
      </div>
    </aside>
  );
};
