import { useState, useEffect, useRef } from 'react';
import { ProjectItem, useAppStore } from '@/store/useAppStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import { ProjectDetailBody } from './ProjectDetailBody';
import { ProjectProgressLedger } from './ProjectProgressLedger';
import { ProjectStatusDialog } from './ProjectStatusDialog';
import { getStatusDisplay, getConfirmMessage, normalizeKeywords } from './projectDetailUtils';
import { AcceptanceDialog } from './AcceptanceDialog';
import { updateProject as updateProjectApi, initiateProject, getProjectIntakeDraft, mapDetailToProjectItem } from '@/lib/projectApi';

interface ProjectDetailPageProps {
  project: ProjectItem;
  onSave: (updated: ProjectItem) => void;
}

export function ProjectDetailPage({ project, onSave }: ProjectDetailPageProps) {
  const { setSelectedProjectId, projectDetailTab, setProjectDetailTab } = useAppStore();
  const [editedProject, setEditedProject] = useState<ProjectItem>(project);
  const [keywords, setKeywords] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<ProjectItem['status'] | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    status: ProjectItem['status'];
    message: string;
    onConfirm: (rejectionReason?: string) => void;
  } | null>(null);
  const previousProjectIdRef = useRef(project.id);
  // Acceptance dialog state
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [acceptanceDraft, setAcceptanceDraft] = useState<ProjectItem | null>(null);
  const [acceptanceKeywords, setAcceptanceKeywords] = useState<string>('');

  // Sync when project changes
  useEffect(() => {
    const isProjectChanged = previousProjectIdRef.current !== project.id;

    setEditedProject(project);
    setKeywords(project.keywords?.join(', ') || '');
    setIsEditing(false);
    setPendingStatusUpdate(null);

    // Only reset tab when switching to a different project
    if (isProjectChanged) {
      setProjectDetailTab('details');
      previousProjectIdRef.current = project.id;
    }
  }, [project]);

  const handleChange = (field: keyof ProjectItem, value: any) => {
    setEditedProject({ ...editedProject, [field]: value });
  };

  const openConfirm = (status: ProjectItem['status'], onConfirm: () => void) => {
    setConfirmConfig({
      status,
      message: getConfirmMessage(status),
      onConfirm,
    });
  };

  const handleSave = async () => {
    const nextStatus = pendingStatusUpdate ?? editedProject.status;
    const isStatusChanged = project?.status !== nextStatus;
    
    // 如果状态从 received 变为 accepted，需要确认
    if (isStatusChanged && project?.status === 'received' && nextStatus === 'accepted') {
      openConfirm(nextStatus, async () => {
        try {
          await saveProjectToBackend();
        } catch (error) {
          console.error('保存失败:', error);
          alert(error instanceof Error ? error.message : '保存失败，请重试');
        }
      });
      return;
    }
    
    // 其他状态变更也需要确认
    if (isStatusChanged) {
      openConfirm(nextStatus, async () => {
        try {
          await saveProjectToBackend();
        } catch (error) {
          console.error('保存失败:', error);
          alert(error instanceof Error ? error.message : '保存失败，请重试');
        }
      });
      return;
    }

    // 无状态变更，直接保存
    try {
      await saveProjectToBackend();
    } catch (error) {
      console.error('保存失败:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
    }
  };

  const saveProjectToBackend = async () => {
    // 构建更新数据
    const updates: any = {
      project_name: editedProject.name,
      company_name: editedProject.companyName,
      company_address: editedProject.companyAddress,
      project_source: editedProject.projectSource,
      description: editedProject.description, // 投资经理笔记
      project_contact: editedProject.projectContact,
      contact_info: editedProject.contactInfo,
      industry: editedProject.industry,
      core_team: editedProject.coreTeam,
      core_product: editedProject.coreProduct,
      core_technology: editedProject.coreTechnology,
      competition_analysis: editedProject.competitionAnalysis,
      market_size: editedProject.marketSize,
      financial_status: editedProject.financialStatus,
      financing_history: editedProject.financingHistory,
      keywords: normalizeKeywords(keywords),
    };

    // 如果有状态变更，添加状态变更参数
    const nextStatus = pendingStatusUpdate ?? editedProject.status;
    if (nextStatus === 'accepted' && project.status !== 'accepted') {
      updates.accept = true;
    } else if (nextStatus === 'rejected' && project.status !== 'rejected') {
      updates.reject = true;
      // description 字段已在上面设置，作为拒绝理由使用
    }

    // 1. 调用后端 API 更新项目信息
    await updateProjectApi(project.id, updates);
    
    // 2. 重新拉取完整的项目信息
    const fullProjectDetail = await getProjectIntakeDraft(project.id);
    
    // 3. 将后端返回的数据映射回 ProjectItem
    const updatedProject = mapDetailToProjectItem(fullProjectDetail, {
      id: project.id,
      name: '',
      status: nextStatus,
      createdAt: new Date().toISOString(),
    } as ProjectItem);
    
    // 4. 更新本地状态
    setEditedProject(updatedProject);
    setKeywords(updatedProject.keywords?.join(', ') || '');
    onSave(updatedProject);
    setIsEditing(false);
    setPendingStatusUpdate(null);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setKeywords(project?.keywords?.join(', ') || '');
    setIsEditing(false);
    setPendingStatusUpdate(null);
  };

  const handleMarkStatus = async (nextStatus: ProjectItem['status'], updates?: Partial<ProjectItem>) => {
    openConfirm(nextStatus, async (rejectionReason?: string) => {
      try {
        const payload: any = { ...updates };
        
        // 根据状态设置对应的参数
        if (nextStatus === 'accepted') {
          payload.accept = true;
        } else if (nextStatus === 'rejected') {
          payload.reject = true;
          // 拒绝原因使用 description 字段
          if (rejectionReason) {
            payload.description = rejectionReason;
          } else if (updates?.description) {
            payload.description = updates.description;
          }
        }

        // 调用后端 API
        await updateProjectApi(project.id, payload);
        
        // 重新拉取完整的项目信息
        const fullProjectDetail = await getProjectIntakeDraft(project.id);
        const mappedProject = mapDetailToProjectItem(fullProjectDetail, {
          id: project.id,
          name: '',
          status: nextStatus,
          createdAt: new Date().toISOString(),
        } as ProjectItem);
        
        // 更新本地状态
        setEditedProject(mappedProject);
        onSave(mappedProject);
        setIsEditing(false);
        setPendingStatusUpdate(null);
      } catch (error) {
        console.error('状态变更失败:', error);
        alert(error instanceof Error ? error.message : '状态变更失败，请重试');
      }
    });
  };

  const handleStartAcceptance = () => {
    setAcceptanceDraft({ ...editedProject, status: 'accepted' });
    setAcceptanceKeywords(editedProject.keywords?.join(', ') || '');
    setAcceptanceOpen(true);
  };

  const handleMarkEstablished = () => {
    openConfirm('initiated', async () => {
      try {
        // 调用立项接口：POST /api/projects/{project_id}/initiate
        const updatedProject = await initiateProject(project.id);
        
        // 更新本地状态，确保 keywords 也被更新
        setEditedProject(updatedProject);
        setKeywords(updatedProject.keywords?.join(', ') || '');
        onSave(updatedProject);
        setIsEditing(false);
        setPendingStatusUpdate(null);
      } catch (error) {
        console.error('立项失败:', error);
        alert(error instanceof Error ? error.message : '立项失败，请重试');
      }
    });
  };
  const handleMarkNotAccepted = () => handleMarkStatus('rejected');
  const handleStartEdit = () => {
    setPendingStatusUpdate(null);
    setIsEditing(true);
  };
  const handleCancelAcceptance = () => {
    setAcceptanceOpen(false);
    setAcceptanceDraft(null);
    setAcceptanceKeywords('');
  };
  const handleAcceptanceFieldChange = (field: keyof ProjectItem, value: any) => {
    setAcceptanceDraft(prev => prev ? { ...prev, [field]: value } : prev);
  };
  const handleAcceptSave = async () => {
    if (!acceptanceDraft) return;
    
    try {
      // 构建更新数据
      const updates: any = {
        accept: true,
        project_name: acceptanceDraft.name,
        company_name: acceptanceDraft.companyName,
        company_address: acceptanceDraft.companyAddress,
        project_source: acceptanceDraft.projectSource,
        description: acceptanceDraft.description, // 投资经理笔记
        project_contact: acceptanceDraft.projectContact,
        contact_info: acceptanceDraft.contactInfo,
        industry: acceptanceDraft.industry,
        core_team: acceptanceDraft.coreTeam,
        core_product: acceptanceDraft.coreProduct,
        core_technology: acceptanceDraft.coreTechnology,
        competition_analysis: acceptanceDraft.competitionAnalysis,
        market_size: acceptanceDraft.marketSize,
        financial_status: acceptanceDraft.financialStatus,
        financing_history: acceptanceDraft.financingHistory,
        keywords: normalizeKeywords(acceptanceKeywords),
      };

      // 1. 调用后端 API 更新项目信息
      await updateProjectApi(project.id, updates);
      
      // 2. 重新拉取完整的项目信息
      const fullProjectDetail = await getProjectIntakeDraft(project.id);
      
      // 3. 将后端返回的数据映射回 ProjectItem
      const updatedProject = mapDetailToProjectItem(fullProjectDetail, {
        id: project.id,
        name: '',
        status: 'accepted',
        createdAt: new Date().toISOString(),
      } as ProjectItem);
      
      // 4. 更新本地状态
      setEditedProject(updatedProject);
      setKeywords(updatedProject.keywords?.join(', ') || '');
      onSave(updatedProject);
      setPendingStatusUpdate(null);
      setIsEditing(false);
      setAcceptanceOpen(false);
    } catch (error) {
      console.error('受理失败:', error);
      alert(error instanceof Error ? error.message : '受理失败，请重试');
    }
  };

  const handleBack = () => {
    setSelectedProjectId(null);
  };

  const displayStatus = getStatusDisplay(pendingStatusUpdate ?? editedProject.status) ?? getStatusDisplay('received');

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Breadcrumb Navigation */}
      <div className="px-4 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            返回
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={projectDetailTab} onValueChange={(v) => setProjectDetailTab(v as 'details' | 'progress')} className="flex-shrink-0">
        <div className="px-7 pt-2 pb-4">
          <TabsList>
            <TabsTrigger value="details">详情页</TabsTrigger>
            <TabsTrigger value="progress">进度台账</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

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
        onClose={handleBack}
        activeTab={projectDetailTab}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {projectDetailTab === 'details' ? (
          <ScrollArea className="flex-1">
            <ProjectDetailBody
              editedProject={editedProject}
              isEditing={isEditing}
              keywords={keywords}
              onFieldChange={handleChange}
              onKeywordsChange={setKeywords}
            />
          </ScrollArea>
        ) : (
          <ProjectProgressLedger project={editedProject} />
        )}
      </div>

      {/* Confirm dialog for status changes */}
      <ProjectStatusDialog
        open={!!confirmConfig}
        message={confirmConfig?.message || ''}
        status={confirmConfig?.status}
        onConfirm={(rejectionReason) => {
          confirmConfig?.onConfirm(rejectionReason);
          setConfirmConfig(null);
        }}
        onCancel={() => setConfirmConfig(null)}
      />

      {/* Acceptance dialog */}
      <AcceptanceDialog
        open={acceptanceOpen}
        draft={acceptanceDraft}
        keywords={acceptanceKeywords}
        onFieldChange={handleAcceptanceFieldChange}
        onKeywordsChange={setAcceptanceKeywords}
        onCancel={handleCancelAcceptance}
        onConfirm={handleAcceptSave}
      />
    </div>
  );
}
