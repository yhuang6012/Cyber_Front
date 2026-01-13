import { NewsPanel } from '@/components/NewsPanel/NewsPanel';
import { WorkspacePanel } from '@/components/WorkSpace/WorkspacePanel';
import { ChatPanel } from '@/components/ChatPanel/ChatPanel';
import { ProjectsPanel } from '@/components/Projects/ProjectsPanel';
import { KnowledgeBasePanel } from '@/components/KnowledgeBase/KnowledgeBasePanel';
import { ProjectDetailPage } from '@/components/Projects/ProjectDetailPanel/ProjectDetail/ProjectDetailPage';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { ChatInput } from '@/components/ChatPanel/ChatInput';
import { SmartCanvas } from '@/components/SmartCanvas';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export function HomePage() {
  const { isChatExpanded, activePanel, smartCanvasOpen, selectedProjectId, projects, updateProject } = useAppStore();

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const renderActivePanel = () => {
    // If a project is selected, show the detail page
    if (activePanel === 'projects' && selectedProject) {
      return <ProjectDetailPage project={selectedProject} onSave={updateProject.bind(null, selectedProject.id)} />;
    }

    switch (activePanel) {
      case 'news':
        return <NewsPanel />;
      case 'projects':
        return <ProjectsPanel />;
      case 'knowledge':
        return <KnowledgeBasePanel />;
      default:
        return <WorkspacePanel />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Content Panels */}
      <div className="flex flex-1 min-h-0">
        {/* When chat is collapsed, keep original layout (no resizable needed) */}
        {!isChatExpanded ? (
          <motion.div className="border-r border-border flex flex-col h-full" animate={{ width: '100%' }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <div className={`flex-1 min-h-0 pb-0`}>
              {renderActivePanel()}
            </div>
            <div className="sticky bottom-2">
              <div className="mx-auto w-full max-w-2xl">
                <ChatInput />
              </div>
            </div>
          </motion.div>
        ) : (
          // Chat is expanded → use resizable panels
          smartCanvasOpen ? (
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
              <ResizablePanel defaultSize={35} minSize={20} className="min-w-0">
                <div className="h-full flex flex-col min-w-0">
                  <div className="flex-1 min-h-0 min-w-0">
                    {renderActivePanel()}
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={39} minSize={20} className="min-w-0">
                <div className="h-full overflow-hidden shadow-[4px_0_12px_rgba(0,0,0,0.1)] min-w-0">
                  <ChatPanel />
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={26} minSize={16} className="min-w-0">
                <SmartCanvas />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
              <ResizablePanel defaultSize={60} minSize={30} className="min-w-0">
                <div className="h-full flex flex-col min-w-0">
                  <div className="flex-1 min-h-0 min-w-0">
                    {renderActivePanel()}
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={25} className="min-w-0">
                <div className="h-full overflow-hidden shadow-[4px_0_12px_rgba(0,0,0,0.1)] min-w-0">
                  <ChatPanel />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )
        )}
      </div>
    </div>
  );
} 
