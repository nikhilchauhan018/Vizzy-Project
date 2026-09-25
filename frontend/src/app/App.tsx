import React, { useState } from 'react';
import { useStoryEngine } from '../features/style-setup/hooks/useStoryEngine';
import { TopBar } from '../shared/components/TopBar';
import { StoryNavigator } from '../features/page-manager/components/StoryNavigator';
import { VisualWorkspace } from '../features/panel-review/components/VisualWorkspace';
import { ChatPanel } from '../features/chat/components/ChatPanel';
import { ContextPanel } from '../shared/components/ContextPanel';
import { MobileDrawer } from '../shared/components/MobileDrawer';
import { SequenceView } from '../features/export/components/SequenceView';
import { PreviewPlayer } from '../features/export/components/PreviewPlayer';
import { ExportModal } from '../features/export/components/ExportModal';
import { InitialCreateScreen } from '../shared/components/InitialCreateScreen';
import { StoryPage, GenerationCandidate, ChatMessageItem } from '../types/story';
import { createGraphicNovelArt } from '../features/panel-review/data/artworkGenerator';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    updateProject,
    createNewProject,
    resetToPresets,
  } = useStoryEngine();

  // View state
  const [activeView, setActiveView] = useState<'workspace' | 'sequence'>('workspace');
  const [activePageId, setActivePageId] = useState<string>(() => {
    return activeProject.pages?.[2]?.id || activeProject.pages?.[0]?.id || 'page-1';
  });

  // Dialog states
  const [showInitialCreate, setShowInitialCreate] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [mobileStoryNavOpen, setMobileStoryNavOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Resolve project pages and chat history safely
  const projectPages = Array.isArray(activeProject?.pages) ? activeProject.pages : [];
  const projectChatHistory = Array.isArray(activeProject?.chatHistory) ? activeProject.chatHistory : [];

  // Resolve current active page
  const currentPage: StoryPage =
    projectPages.find((p) => p.id === activePageId) ||
    projectPages[0] || {
      id: 'page-1',
      order: 1,
      pageNumber: '01',
      title: 'Initial Scene',
      sceneSummary: 'Story setup',
      status: 'DRAFT',
      candidates: [],
      versions: [],
      characterIds: [],
      created_at: new Date().toISOString(),
    };

  const currentPageIndex = projectPages.findIndex((p) => p.id === currentPage.id);
  const hasNextPage = currentPageIndex >= 0 && currentPageIndex < projectPages.length - 1;

  // Handle User Message in Chat (Conversational Director Loop)
  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: currentPage.id,
      type: 'text',
    };

    const updatedChat = [...projectChatHistory, userMsg];

    // Check if the user is asking to approve
    const lower = text.toLowerCase();
    if (lower.includes('approve') || lower.includes('perfect') || lower.includes('looks great')) {
      handleApprovePage();
      return;
    }

    // Check if user is asking to refine
    if (currentPage.currentImage) {
      // Simulate refinement generation
      const newRefinedArt = createGraphicNovelArt({
        title: `${currentPage.title} Refined`,
        theme: activeProject.historically_grounded ? 'war' : 'cyberpunk',
        shotType: lower.includes('close') ? 'close' : lower.includes('wide') ? 'wide' : 'medium',
        palette: activeProject.styleBible.palette,
        mood: lower.includes('dark') ? 'dark & tense' : 'dramatic',
        character: activeProject.characters[0]?.name,
      });

      const updatedPages = projectPages.map((p) =>
        p.id === currentPage.id
          ? {
              ...p,
              currentImage: newRefinedArt,
              status: 'REFINING' as const,
              versions: [
                ...p.versions,
                {
                  id: `v-${Date.now()}`,
                  versionNumber: p.versions.length + 1,
                  prompt: text,
                  refinementNote: text,
                  imageUrl: newRefinedArt,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : p
      );

      const vizzyReply: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'vizzy',
        text: `I incorporated your refinement: "${text}". The updated artwork is now rendered on your visual canvas. How does this look?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pageId: currentPage.id,
        type: 'text',
        refinedImageUrl: newRefinedArt,
      };

      updateProject({
        pages: updatedPages,
        chatHistory: [...updatedChat, vizzyReply],
      });
      showToast('Artwork refined based on chat');
      return;
    }

    // Default assistant response
    setTimeout(() => {
      const vizzyReply: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'vizzy',
        text: `Got it! I am aligning your instruction "${text}" with your Style Bible and ${activeProject.characters[0]?.name || 'characters'}. Click "Generate 3 Visual Options" to synthesize the panels.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pageId: currentPage.id,
        type: 'text',
      };
      updateProject({ chatHistory: [...updatedChat, vizzyReply] });
    }, 600);

    updateProject({ chatHistory: updatedChat });
  };

  // Generate 3 Visual Candidate Options
  const handleGenerateInitialOptions = () => {
    // Show generating state
    const generatingPages = projectPages.map((p) =>
      p.id === currentPage.id ? { ...p, status: 'GENERATING' as const } : p
    );
    updateProject({ pages: generatingPages });

    setTimeout(() => {
      const opt1 = createGraphicNovelArt({
        title: `${currentPage.title} - Option 1`,
        theme: activeProject.historically_grounded ? 'war' : 'cyberpunk',
        shotType: 'close',
        palette: activeProject.styleBible.palette,
        mood: 'intense',
      });
      const opt2 = createGraphicNovelArt({
        title: `${currentPage.title} - Option 2`,
        theme: activeProject.historically_grounded ? 'war' : 'cyberpunk',
        shotType: 'wide',
        palette: activeProject.styleBible.palette,
        mood: 'establishing',
      });
      const opt3 = createGraphicNovelArt({
        title: `${currentPage.title} - Option 3`,
        theme: activeProject.historically_grounded ? 'war' : 'cyberpunk',
        shotType: 'medium',
        palette: activeProject.styleBible.palette,
        mood: 'dynamic',
      });

      const candidates: GenerationCandidate[] = [
        {
          id: `c1-${Date.now()}`,
          title: 'Option 1: Intense Close-Up',
          description: 'High emotional focus on subject with dramatic shadow falloff',
          imageUrl: opt1,
          camera: 'Intense Close-Up',
          lighting: 'Rim light with artillery flare',
          aspectRatio: activeProject.styleBible.aspect_ratio,
        },
        {
          id: `c2-${Date.now()}`,
          title: 'Option 2: Wide Environmental Framing',
          description: 'Expansive composition establishing spatial tension and terrain obstacles',
          imageUrl: opt2,
          camera: 'Wide Angle Cinematic',
          lighting: 'Atmospheric diffuse lighting',
          aspectRatio: activeProject.styleBible.aspect_ratio,
        },
        {
          id: `c3-${Date.now()}`,
          title: 'Option 3: Medium Dynamic Two-Shot',
          description: 'Balanced framing emphasizing character action and momentum',
          imageUrl: opt3,
          camera: 'Medium Two-Shot',
          lighting: 'High-contrast chiaroscuro',
          aspectRatio: activeProject.styleBible.aspect_ratio,
        },
      ];

      const finalizedPages = projectPages.map((p) =>
        p.id === currentPage.id
          ? {
              ...p,
              candidates,
              currentImage: opt2,
              selectedCandidateId: candidates[1].id,
              status: 'OPTIONS_READY' as const,
            }
          : p
      );

      const vizzyMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        sender: 'vizzy',
        text: `I created three visual directions for Page ${currentPage.pageNumber}. Select one option to lock it or describe what you want to change:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pageId: currentPage.id,
        type: 'options',
        candidates,
      };

      updateProject({
        pages: finalizedPages,
        chatHistory: [...projectChatHistory, vizzyMsg],
      });
      showToast(`Generated 3 options for Page ${currentPage.pageNumber}`);
    }, 1200);
  };

  // Select Option from 3 Candidates
  const handleSelectCandidate = (candidateId: string) => {
    const candidate = currentPage.candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    const updatedPages = projectPages.map((p) =>
      p.id === currentPage.id
        ? {
            ...p,
            selectedCandidateId: candidateId,
            currentImage: candidate.imageUrl,
            status: 'REFINING' as const,
          }
        : p
    );

    const vizzyMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'vizzy',
      text: `Selected ${candidate.title}. You can now refine it (e.g. "make it darker", "move character to the left", "add smoke"), or click Approve.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: currentPage.id,
      type: 'text',
      refinedImageUrl: candidate.imageUrl,
    };

    updateProject({
      pages: updatedPages,
      chatHistory: [...projectChatHistory, vizzyMsg],
    });
    showToast(`Locked ${candidate.title}`);
  };

  // Approve Page Workflow
  const handleApprovePage = () => {
    const updatedPages = projectPages.map((p) =>
      p.id === currentPage.id ? { ...p, status: 'APPROVED' as const } : p
    );

    const nextPageIndex = currentPageIndex + 1;
    const hasNext = nextPageIndex < projectPages.length;
    const nextPage = hasNext ? projectPages[nextPageIndex] : null;

    const approvalMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'vizzy',
      text: `Page ${currentPage.pageNumber} is approved! ${
        nextPage
          ? `Ready to continue to Page ${nextPage.pageNumber} ("${nextPage.title}")?`
          : 'All pages in this sequence are now complete and ready for export!'
      }`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: currentPage.id,
      type: 'approval',
    };

    updateProject({
      pages: updatedPages,
      chatHistory: [...projectChatHistory, approvalMsg],
    });
    showToast(`Page ${currentPage.pageNumber} approved!`);
  };

  // Advance to Next Page
  const handleGoToNextPage = () => {
    if (hasNextPage) {
      const nextPage = projectPages[currentPageIndex + 1];
      setActivePageId(nextPage.id);
      showToast(`Navigated to Page ${nextPage.pageNumber}`);
    }
  };

  // Add New Page
  const handleAddNewPage = () => {
    const nextOrder = projectPages.length + 1;
    const pageNumStr = String(nextOrder).padStart(2, '0');
    const newPage: StoryPage = {
      id: `page-${Date.now()}`,
      order: nextOrder,
      pageNumber: pageNumStr,
      title: `Scene ${pageNumStr}`,
      sceneSummary: 'Describe this scene in chat...',
      status: 'DRAFT',
      candidates: [],
      versions: [],
      characterIds: activeProject.characters.map((c) => c.id),
      environmentId: activeProject.environments[0]?.id,
      created_at: new Date().toISOString(),
    };

    const updatedPages = [...projectPages, newPage];

    const introMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'vizzy',
      text: `Created Page ${pageNumStr}. What happens in this moment? Describe the action, camera framing, and character emotions to generate visual options.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pageId: newPage.id,
      type: 'text',
    };

    updateProject({
      pages: updatedPages,
      chatHistory: [...projectChatHistory, introMsg],
    });

    setActivePageId(newPage.id);
    setActiveView('workspace');
    showToast(`Created Page ${pageNumStr}`);
  };

  // Handle Project Creation from Initial Screen
  const handleCreateFromInitial = (params: {
    title: string;
    storyPrompt: string;
    uploadedImage?: string | null;
    genre: string;
    historicallyGrounded: boolean;
  }) => {
    const newId = `proj-${Date.now()}`;
    const initialPalette = params.historicallyGrounded
      ? ['#1C242C', '#39464E', '#66757F', '#B45309', '#F1ECE1']
      : ['#0B0E14', '#00F0FF', '#FF0055', '#7928CA', '#F3F4F6'];

    const firstArt = createGraphicNovelArt({
      title: params.title,
      theme: params.historicallyGrounded ? 'war' : 'cyberpunk',
      palette: initialPalette,
      mood: 'dramatic',
    });

    const newPage: StoryPage = {
      id: 'p-1',
      order: 1,
      pageNumber: '01',
      title: 'Opening Shot',
      sceneSummary: params.storyPrompt.slice(0, 140),
      status: 'OPTIONS_READY',
      currentImage: firstArt,
      candidates: [
        {
          id: 'c-1',
          title: 'Option 1: Establishing Angle',
          description: 'Atmospheric scene setting following your instructions',
          imageUrl: firstArt,
          camera: 'Wide Angle',
          lighting: 'Cinematic Chiaroscuro',
          aspectRatio: '16:9',
        },
      ],
      versions: [],
      characterIds: [],
      created_at: new Date().toISOString(),
    };

    createNewProject(params.title);
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
          text: `Welcome to "${params.title}"! I initialized your project aesthetic with ${params.genre} styling. Page 01 is ready for review.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pageId: 'p-1',
          type: 'text',
        },
      ],
    });

    setActivePageId('p-1');
    setShowInitialCreate(false);
    showToast(`Created story: ${params.title}`);
  };

  // If initial screen is requested
  if (showInitialCreate) {
    return (
      <InitialCreateScreen
        onCreateProject={handleCreateFromInitial}
        onLoadPreset={(presetId) => {
          resetToPresets();
          setShowInitialCreate(false);
          showToast('Loaded D-Day 1944 Graphic Novel');
        }}
      />
    );
  }

  // Filter messages for current page
  const pageMessages = projectChatHistory.filter(
    (m) => m.pageId === currentPage.id || !m.pageId
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl animate-fade-in border border-indigo-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR */}
      <TopBar
        project={activeProject}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenExport={() => setShowExport(true)}
        onOpenPlayer={() => setShowPlayer(true)}
        onOpenNewProject={() => setShowInitialCreate(true)}
        onToggleMobileStoryNav={() => setMobileStoryNavOpen(!mobileStoryNavOpen)}
        onToggleMobileContext={() => setMobileContextOpen(!mobileContextOpen)}
        onUpdateTitle={(title) => {
          updateProject({ title });
          showToast('Updated story title');
        }}
      />

      {/* MAIN VIEWPORT WORKSPACE */}
      {activeView === 'sequence' ? (
        /* STORYBOARD / SEQUENCE VIEW */
        <SequenceView
          project={activeProject}
          onSelectPage={(pageId) => {
            setActivePageId(pageId);
            setActiveView('workspace');
          }}
          onOpenPlayer={() => setShowPlayer(true)}
          onOpenExport={() => setShowExport(true)}
          onAddNewPage={handleAddNewPage}
        />
      ) : (
        /* MAIN THREE-SECTION DESKTOP WORKSPACE (18% / 64% / 18%) */
        <div className="flex-1 flex overflow-hidden relative">
          {/* LEFT: Story / Page Navigation (~18% on desktop, hidden on mobile/tablet drawer) */}
          <div className="hidden lg:block w-[18%] min-w-[220px] max-w-[280px] h-full shrink-0">
            <StoryNavigator
              pages={activeProject.pages}
              activePageId={currentPage.id}
              onSelectPage={(id) => {
                setActivePageId(id);
              }}
              onAddNewPage={handleAddNewPage}
            />
          </div>

          {/* CENTER: Main Visual Workspace (Artwork Focus) + Chat (~64% on desktop, 100% on mobile) */}
          <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950 overflow-hidden">
            {/* Visual Workspace (Artwork Focus) */}
            <VisualWorkspace
              page={currentPage}
              onSelectCandidate={handleSelectCandidate}
              onApprovePage={handleApprovePage}
              onQuickRefine={(chip) => handleSendMessage(`Refine: ${chip}`)}
              onGenerateInitialOptions={handleGenerateInitialOptions}
              onGoToNextPage={handleGoToNextPage}
              hasNextPage={hasNextPage}
            />

            {/* Chat Experience (Primary Interaction Control) */}
            <ChatPanel
              messages={pageMessages}
              pageId={currentPage.id}
              pageNumber={currentPage.pageNumber}
              onSendMessage={handleSendMessage}
              onSelectCandidate={handleSelectCandidate}
              onApproveCurrent={handleApprovePage}
              onGoToNextPage={handleGoToNextPage}
              isPageApproved={currentPage.status === 'APPROVED'}
              canApprove={Boolean(currentPage.currentImage)}
            />
          </div>

          {/* RIGHT: Story Context Information (~18% on desktop, hidden on <xl screens) */}
          <div className="hidden xl:block w-[18%] min-w-[240px] max-w-[300px] h-full shrink-0">
            <ContextPanel project={activeProject} currentPage={currentPage} />
          </div>
        </div>
      )}

      {/* MOBILE DRAWERS (For Mobile & Tablet Phones) */}
      <MobileDrawer
        isOpen={mobileStoryNavOpen}
        onClose={() => setMobileStoryNavOpen(false)}
        title="Story Pages Filmstrip"
        side="left"
      >
        <StoryNavigator
          pages={activeProject.pages}
          activePageId={currentPage.id}
          onSelectPage={(id) => {
            setActivePageId(id);
            setMobileStoryNavOpen(false);
          }}
          onAddNewPage={() => {
            handleAddNewPage();
            setMobileStoryNavOpen(false);
          }}
        />
      </MobileDrawer>

      <MobileDrawer
        isOpen={mobileContextOpen}
        onClose={() => setMobileContextOpen(false)}
        title="Story & Scene Context"
        side="right"
      >
        <ContextPanel project={activeProject} currentPage={currentPage} />
      </MobileDrawer>

      {/* DISTRACTION-FREE FULLSCREEN SEQUENCE PREVIEW PLAYER */}
      {showPlayer && (
        <PreviewPlayer project={activeProject} onClose={() => setShowPlayer(false)} />
      )}

      {/* EXPORT MODAL */}
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        project={activeProject}
      />
    </div>
  );
}
