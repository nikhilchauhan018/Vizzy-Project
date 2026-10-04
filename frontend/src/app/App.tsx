import React, { useState, useEffect } from 'react';
import { useStoryEngine } from '../features/style-setup/hooks/useStoryEngine';
import { useAuth } from '../features/auth/context/AuthContext';
import { AuthScreen } from '../features/auth/components/AuthScreen';
import { StoryPage, GenerationCandidate, ChatMessageItem } from '../types/story';
import { createGraphicNovelArt } from '../features/panel-review/data/artworkGenerator';
import { Sidebar } from '../shared/components/Sidebar';
import { ChatPanel } from '../features/chat/components/ChatPanel';
import { PreviewDrawer } from '../shared/components/PreviewDrawer';
import { AccountModal } from '../shared/components/AccountModal';
import { InitialCreateScreen } from '../shared/components/InitialCreateScreen';
import { MobileDrawer } from '../shared/components/MobileDrawer';
import { Menu, Plus } from 'lucide-react';

export default function App() {
  const { isAuthenticated, isLoading: isAuthLoading, user, logout } = useAuth();
  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    updateProject,
    createNewProject,
    resetToPresets,
  } = useStoryEngine();

  // Navigation & Drawer States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showInitialCreate, setShowInitialCreate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active page resolution
  const projectPages = Array.isArray(activeProject?.pages) ? activeProject.pages : [];
  const [activePageId, setActivePageId] = useState<string>(() => {
    return projectPages[0]?.id || 'p-1';
  });

  // Ensure activePageId remains valid when project changes
  useEffect(() => {
    if (activeProject && projectPages.length > 0) {
      const pageExists = projectPages.some((p) => p.id === activePageId);
      if (!pageExists) {
        setActivePageId(projectPages[0].id);
      }
    }
  }, [activeProjectId, projectPages]);

  const currentPage: StoryPage =
    projectPages.find((p) => p.id === activePageId) ||
    projectPages[0] || {
      id: 'p-1',
      order: 1,
      pageNumber: '01',
      title: 'Opening Shot',
      sceneSummary: 'Initial story scene',
      status: 'OPTIONS_READY',
      candidates: [],
      versions: [],
      characterIds: [],
      created_at: new Date().toISOString(),
    };

  const projectChatHistory = Array.isArray(activeProject?.chatHistory)
    ? activeProject.chatHistory
    : [];

  // Filter messages for current page or global
  const pageMessages = projectChatHistory.filter(
    (m) => m.pageId === currentPage.id || !m.pageId
  );

  // Start a new project creation flow
  const handleNewChat = () => {
    setShowInitialCreate(true);
    setIsMobileMenuOpen(false);
    setIsPreviewOpen(false);
  };

  // Switch active project
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setShowInitialCreate(false);
    setIsMobileMenuOpen(false);
    setIsPreviewOpen(false);
  };

  // 1. Send Message / Prompt Refinement Flow
  const handleSendMessage = (text: string, attachedImage?: string | null) => {
    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: currentPage.id,
      type: 'text',
    };

    const updatedHistory = [...projectChatHistory, userMsg];
    updateProject({ chatHistory: updatedHistory });
    setIsGenerating(true);

    // Asynchronous simulated candidate generation / refinement
    setTimeout(() => {
      const isRefine = Boolean(currentPage.currentImage);
      const newPalette = activeProject.styleBible.palette;

      if (isRefine) {
        // Refinement: creates a new version
        const refinedArt = createGraphicNovelArt({
          title: `${currentPage.title} (Refined)`,
          theme: activeProject.historically_grounded ? 'war' : 'cyberpunk',
          palette: newPalette,
          mood: text.toLowerCase().includes('dark') ? 'dark' : 'cinematic',
          shotType: text.toLowerCase().includes('close') ? 'close' : 'medium',
        });

        const newVersion = {
          id: `v-${Date.now()}`,
          versionNumber: (currentPage.versions?.length || 0) + 1,
          prompt: text,
          refinementNote: text,
          imageUrl: refinedArt,
          created_at: new Date().toISOString(),
        };

        const updatedPage: StoryPage = {
          ...currentPage,
          currentImage: refinedArt,
          status: 'APPROVED',
          versions: [...(currentPage.versions || []), newVersion],
        };

        const vizzyReply: ChatMessageItem = {
          id: `msg-${Date.now() + 1}`,
          sender: 'vizzy',
          text: `I refined the scene based on your instruction: "${text}". Here is the updated artwork:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pageId: currentPage.id,
          type: 'approval',
          refinedImageUrl: refinedArt,
        };

        updateProject({
          pages: projectPages.map((p) => (p.id === currentPage.id ? updatedPage : p)),
          chatHistory: [...updatedHistory, vizzyReply],
        });
      } else {
        // Initial Generation: creates 3 distinct visual candidates
        const c1 = createGraphicNovelArt({
          title: `${currentPage.title} Option 1`,
          theme: 'war',
          shotType: 'wide',
          palette: newPalette,
        });
        const c2 = createGraphicNovelArt({
          title: `${currentPage.title} Option 2`,
          theme: 'war',
          shotType: 'medium',
          palette: newPalette,
        });
        const c3 = createGraphicNovelArt({
          title: `${currentPage.title} Option 3`,
          theme: 'war',
          shotType: 'close',
          palette: newPalette,
        });

        const candidates: GenerationCandidate[] = [
          {
            id: `cand-${Date.now()}-1`,
            title: 'Option 1: Wide Angle',
            description: 'Establishing wide perspective with atmospheric lighting',
            imageUrl: c1,
            camera: 'Wide Angle',
            lighting: 'Chiaroscuro',
            aspectRatio: '16:9',
          },
          {
            id: `cand-${Date.now()}-2`,
            title: 'Option 2: Medium Focus',
            description: 'Dynamic medium shot highlighting squad interaction',
            imageUrl: c2,
            camera: 'Medium Shot',
            lighting: 'Rim Light',
            aspectRatio: '16:9',
          },
          {
            id: `cand-${Date.now()}-3`,
            title: 'Option 3: Close Focus',
            description: 'Intense close-up capturing tactical determination',
            imageUrl: c3,
            camera: 'Close-Up',
            lighting: 'High Contrast',
            aspectRatio: '16:9',
          },
        ];

        const updatedPage: StoryPage = {
          ...currentPage,
          candidates,
          selectedCandidateId: candidates[0].id,
          currentImage: candidates[0].imageUrl,
          status: 'OPTIONS_READY',
        };

        const vizzyReply: ChatMessageItem = {
          id: `msg-${Date.now() + 1}`,
          sender: 'vizzy',
          text: `I generated 3 visual directions for Page ${currentPage.pageNumber}. Select your preferred option or ask for refinements:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pageId: currentPage.id,
          type: 'options',
          candidates,
        };

        updateProject({
          pages: projectPages.map((p) => (p.id === currentPage.id ? updatedPage : p)),
          chatHistory: [...updatedHistory, vizzyReply],
        });
      }

      setIsGenerating(false);
    }, 1200);
  };

  // 2. Candidate Selection Action
  const handleSelectCandidate = (candidateId: string) => {
    const candidate = currentPage.candidates?.find((c) => c.id === candidateId);
    if (!candidate) return;

    const updatedPage: StoryPage = {
      ...currentPage,
      selectedCandidateId: candidateId,
      currentImage: candidate.imageUrl,
      status: 'APPROVED',
    };

    const confirmMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'vizzy',
      text: `Selected ${candidate.title}. You can now refine it or preview the page.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: currentPage.id,
      type: 'approval',
      refinedImageUrl: candidate.imageUrl,
    };

    updateProject({
      pages: projectPages.map((p) => (p.id === currentPage.id ? updatedPage : p)),
      chatHistory: [...projectChatHistory, confirmMsg],
    });
  };

  // 3. Candidate Removal Action
  const handleRemoveCandidate = (candidateId: string) => {
    const remainingCandidates = currentPage.candidates?.filter((c) => c.id !== candidateId) || [];
    const isRemovingSelected = currentPage.selectedCandidateId === candidateId;
    const newSelectedId = isRemovingSelected ? remainingCandidates[0]?.id : currentPage.selectedCandidateId;
    const newCurrentImage = isRemovingSelected ? remainingCandidates[0]?.imageUrl : currentPage.currentImage;

    const updatedPage: StoryPage = {
      ...currentPage,
      candidates: remainingCandidates,
      selectedCandidateId: newSelectedId,
      currentImage: newCurrentImage,
    };

    // Update message candidates if present
    const updatedHistory = projectChatHistory.map((msg) => {
      if (msg.candidates) {
        return {
          ...msg,
          candidates: msg.candidates.filter((c) => c.id !== candidateId),
        };
      }
      return msg;
    });

    updateProject({
      pages: projectPages.map((p) => (p.id === currentPage.id ? updatedPage : p)),
      chatHistory: updatedHistory,
    });
  };


  // 4. Create Project from Initial Input Screen
  const handleCreateFromInitial = (params: {
    title: string;
    storyPrompt: string;
    uploadedImage?: string | null;
    genre: string;
    historicallyGrounded: boolean;
  }) => {
    createNewProject(params.title);

    const initialArt = createGraphicNovelArt({
      title: params.title,
      theme: params.historicallyGrounded ? 'war' : 'general',
      palette: ['#1C242C', '#39464E', '#66757F', '#B45309', '#F1ECE1'],
    });

    const newPage: StoryPage = {
      id: 'p-1',
      order: 1,
      pageNumber: '01',
      title: 'Opening Scene',
      sceneSummary: params.storyPrompt,
      status: 'OPTIONS_READY',
      currentImage: initialArt,
      candidates: [
        {
          id: 'c-1',
          title: 'Option 1: Establishing Angle',
          description: 'Atmospheric scene setting based on your premise',
          imageUrl: initialArt,
          camera: 'Wide Angle',
          lighting: 'Cinematic',
          aspectRatio: '16:9',
        },
      ],
      versions: [],
      characterIds: [],
      created_at: new Date().toISOString(),
    };

    updateProject({
      title: params.title,
      story_notes: params.storyPrompt,
      genre: params.genre,
      historically_grounded: params.historicallyGrounded,
      uploadedReferenceImage: params.uploadedImage,
      pages: [newPage],
      chatHistory: [
        {
          id: 'm-init',
          sender: 'vizzy',
          text: `Welcome to "${params.title}". I established the visual foundation. Here is the opening scene:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pageId: 'p-1',
          type: 'approval',
          candidates: newPage.candidates,
        },
      ],
    });

    setActivePageId('p-1');
    setShowInitialCreate(false);
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FCFCFB] text-[#171717] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#171717] flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="text-xs text-[#6B7280] font-medium animate-pulse">Loading Vizzy...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const userDisplayName = user?.full_name || "Artist";
  const userEmail = user?.email || 'artist@vizzy.studio';

  return (
    <div className="h-screen w-screen flex bg-[#FCFCFB] text-[#171717] overflow-hidden font-sans">
      {/* 1. DESKTOP LEFT SIDEBAR (Always visible on desktop ~250px-280px) */}
      <div className="hidden md:block w-64 lg:w-72 h-full shrink-0">
        <Sidebar
          projects={projects}
          activeProjectId={activeProject?.id || ''}
          onSelectProject={handleSelectProject}
          onNewChat={handleNewChat}
          onOpenAccount={() => setIsAccountOpen(true)}
          fullName={userDisplayName}
          userEmail={userEmail}
          userName={userDisplayName}
          userPlan="Go Plan"
        />
      </div>

      {/* 2. CENTER CONVERSATION WORKSPACE */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#FCFCFB] relative overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden h-14 px-4 border-b border-[#E7E7E5] bg-white flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-base tracking-tight text-[#171717]">Vizzy</span>
          </div>

          <button
            onClick={handleNewChat}
            aria-label="New chat"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F4] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-[#3B82F6]" />
          </button>
        </header>

        {/* Center Main View: Initial Creation OR Ongoing Conversation */}
        {showInitialCreate ? (
          <InitialCreateScreen
            onCreateProject={handleCreateFromInitial}
            onLoadPreset={() => {
              resetToPresets();
              setShowInitialCreate(false);
            }}
          />
        ) : (
          <ChatPanel
            messages={pageMessages}
            pageId={currentPage.id}
            pageNumber={currentPage.pageNumber}
            onSendMessage={handleSendMessage}
            onSelectCandidate={handleSelectCandidate}
            onRemoveCandidate={handleRemoveCandidate}
            onOpenPreview={() => setIsPreviewOpen(true)}
            selectedCandidateId={currentPage.selectedCandidateId}
            isPageApproved={currentPage.status === 'APPROVED'}
            isLoading={isGenerating}
          />
        )}
      </div>

      {/* 3. DESKTOP PREVIEW PANEL (Appears from the right only when opened ~36%) */}
      <div className="hidden md:block h-full shrink-0">
        <PreviewDrawer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          project={activeProject}
          activePageId={currentPage.id}
          onSelectPage={setActivePageId}
          isMobile={false}
        />
      </div>

      {/* 4. MOBILE DRAWER (For mobile navigation) */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        side="left"
      >
        <Sidebar
          projects={projects}
          activeProjectId={activeProject?.id || ''}
          onSelectProject={handleSelectProject}
          onNewChat={handleNewChat}
          onOpenAccount={() => {
            setIsMobileMenuOpen(false);
            setIsAccountOpen(true);
          }}
          fullName={userDisplayName}
          userEmail={userEmail}
          userName={userDisplayName}
          userPlan="Go Plan"
        />
      </MobileDrawer>

      {/* 5. MOBILE FULLSCREEN PREVIEW */}
      <div className="md:hidden">
        <PreviewDrawer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          project={activeProject}
          activePageId={currentPage.id}
          onSelectPage={setActivePageId}
          isMobile={true}
        />
      </div>

      {/* 6. ACCOUNT POPUP MODAL */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        fullName={userDisplayName}
        userName={userDisplayName}
        userEmail={userEmail}
        onSignOut={logout}
      />
    </div>
  );
}
