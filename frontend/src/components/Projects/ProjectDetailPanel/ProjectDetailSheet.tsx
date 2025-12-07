import { useState, useEffect } from 'react';
import { ProjectItem } from '@/store/useAppStore';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import { ProjectDetailBody } from './ProjectDetailBody';
import { ProjectProgressLedger } from './ProjectProgressLedger';
import { ProjectStatusDialog } from './ProjectStatusDialog';
import { getStatusDisplay, getConfirmMessage, normalizeKeywords } from './projectDetailUtils';

interface ProjectDetailSheetProps {
  project: ProjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: ProjectItem) => void;
}

export function ProjectDetailSheet({ project, open, onOpenChange, onSave }: ProjectDetailSheetProps) {
  const [editedProject, setEditedProject] = useState<ProjectItem | null>(project);
  const [keywords, setKeywords] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<ProjectItem['status'] | null>(null);
  const [sheetOffsets, setSheetOffsets] = useState({ top: 0, left: 0 });
  const [activeTab, setActiveTab] = useState<'details' | 'progress'>('details');
  const [confirmConfig, setConfirmConfig] = useState<{
    status: ProjectItem['status'];
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Sync when project changes
  useEffect(() => {
    if (project) {
      setEditedProject(project);
      setKeywords(project.keywords?.join(', ') || '');
      setIsEditing(false);
      setPendingStatusUpdate(null);
      setActiveTab('details'); // Reset to details tab when project changes
    }
  }, [project]);

  // Measure header/sidebar to avoid covering them
  useEffect(() => {
    const measureLayout = () => {
      const header = document.getElementById('app-header-bar');
      const sidebar = (document.getElementById('app-sidebar') || document.querySelector('[data-slot="sidebar"]')) as HTMLElement | null;

      setSheetOffsets({
        top: header?.offsetHeight ?? 0,
        left: sidebar?.offsetWidth ?? 0,
      });
    };

    measureLayout();
    window.addEventListener('resize', measureLayout);
    const sidebar = (document.getElementById('app-sidebar') || document.querySelector('[data-slot="sidebar"]')) as HTMLElement | null;
    const resizeObserver = sidebar ? new ResizeObserver(measureLayout) : null;
    if (sidebar && resizeObserver) {
      resizeObserver.observe(sidebar);
    }
    return () => {
      window.removeEventListener('resize', measureLayout);
      resizeObserver?.disconnect();
    };
  }, []);

  if (!editedProject) return null;

  const handleChange = (field: keyof ProjectItem, value: any) => {
    setEditedProject({ ...editedProject, [field]: value });
  };

  const buildUpdatedProject = (statusOverride?: ProjectItem['status']) => ({
    ...editedProject,
    status: statusOverride ?? pendingStatusUpdate ?? editedProject.status,
    keywords: normalizeKeywords(keywords),
  });

  const openConfirm = (status: ProjectItem['status'], onConfirm: () => void) => {
    setConfirmConfig({
      status,
      message: getConfirmMessage(status),
      onConfirm,
    });
  };

  const handleSave = () => {
    const nextStatus = pendingStatusUpdate ?? editedProject.status;
    const isStatusChanged = project?.status !== nextStatus;
    
    // 如果状态从 received 变为 accepted，需要确认
    if (isStatusChanged && project?.status === 'received' && nextStatus === 'accepted') {
      openConfirm(nextStatus, () => {
        const updated = buildUpdatedProject(nextStatus);
        // 更新本地状态，确保状态标签立即更新
        setEditedProject(updated);
        onSave(updated);
        setIsEditing(false);
        setPendingStatusUpdate(null);
      });
      return;
    }
    
    // 其他状态变更也需要确认
    if (isStatusChanged) {
      openConfirm(nextStatus, () => {
        const updated = buildUpdatedProject(nextStatus);
        // 更新本地状态，确保状态标签立即更新
        setEditedProject(updated);
        onSave(updated);
        setIsEditing(false);
        setPendingStatusUpdate(null);
      });
      return;
    }

    const updated = buildUpdatedProject(nextStatus);
    // 更新本地状态
    setEditedProject(updated);
    onSave(updated);
    setIsEditing(false);
    setPendingStatusUpdate(null);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setKeywords(project?.keywords?.join(', ') || '');
    setIsEditing(false);
    setPendingStatusUpdate(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setIsEditing(false);
      setPendingStatusUpdate(null);
      setConfirmConfig(null);
    }
    onOpenChange(value);
  };

  const handleMarkStatus = (nextStatus: ProjectItem['status']) => {
    openConfirm(nextStatus, () => {
      setEditedProject(prev => prev ? { ...prev, status: nextStatus } : prev);
      const updated = buildUpdatedProject(nextStatus);
      onSave(updated);
      setIsEditing(false);
      setPendingStatusUpdate(null);
    });
  };

  const handleStartAcceptance = () => {
    // 直接进入编辑模式，不弹出确认
    setPendingStatusUpdate('accepted');
    setIsEditing(true);
  };

  const handleMarkEstablished = () => handleMarkStatus('initiated');
  const handleMarkNotAccepted = () => handleMarkStatus('rejected');
  const handleStartEdit = () => {
    setPendingStatusUpdate(null);
    setIsEditing(true);
  };

  const displayStatus = getStatusDisplay(pendingStatusUpdate ?? editedProject.status) ?? getStatusDisplay('received');

  const drawerPositionStyle = {
    left: sheetOffsets.left,
    right: 0,
    top: sheetOffsets.top,
    height: `calc(100vh - ${sheetOffsets.top}px)`,
    maxHeight: `calc(100vh - ${sheetOffsets.top}px)`,
  } as const;

  return (
    <Drawer direction="bottom" open={open && !!project} onOpenChange={handleOpenChange}>
      <DrawerContent 
        overlayClassName="bg-transparent"
        overlayStyle={drawerPositionStyle}
        style={drawerPositionStyle}
        className="p-0 gap-0 overflow-hidden flex flex-col border-t border-border/60 shadow-[0_-10px_26px_-18px_rgba(0,0,0,0.28)] data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:rounded-t-3xl"
      >
        {/* Header */}
        <ProjectDetailHeader
          editedProject={editedProject}
          isEditing={isEditing}
          displayStatus={displayStatus}
          onFieldChange={handleChange}
          onStartEdit={handleStartEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onMarkNotAccepted={handleMarkNotAccepted}
          onStartAcceptance={handleStartAcceptance}
          onMarkEstablished={handleMarkEstablished}
          onClose={() => onOpenChange(false)}
        />

        {/* Content with Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'progress')} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-4 pb-0 flex-shrink-0">
            <TabsList>
              <TabsTrigger value="details">详情页</TabsTrigger>
              <TabsTrigger value="progress">进度台账</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="details" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <ProjectDetailBody
                editedProject={editedProject}
                isEditing={isEditing}
                keywords={keywords}
                onFieldChange={handleChange}
                onKeywordsChange={setKeywords}
              />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="progress" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ProjectProgressLedger project={editedProject} />
          </TabsContent>
        </Tabs>

        {/* Confirm dialog for status changes */}
        <ProjectStatusDialog
          open={!!confirmConfig}
          message={confirmConfig?.message || ''}
          onConfirm={() => {
            confirmConfig?.onConfirm();
            setConfirmConfig(null);
          }}
          onCancel={() => setConfirmConfig(null)}
        />
      </DrawerContent>
    </Drawer>
  );
}