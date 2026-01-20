import { useState, useEffect, useRef } from 'react';
import { ProjectItem, useAppStore } from '@/store/useAppStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, FileText, ClipboardList } from 'lucide-react';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import { ProjectDetailBody } from './ProjectDetailBody';
import { ProjectDetailNav } from './ProjectDetailNav';
import { ProjectProgressLedger } from '../Ledger/ProjectProgressLedger';
import { ProjectStatusDialog } from '../Ledger/ProjectStatusDialog';
import { getStatusDisplay, getConfirmMessage, normalizeKeywords } from './projectDetailUtils';
import { AcceptanceDialog } from '../Ledger/AcceptanceDialog';
import { CompanyMatchDialog } from './CompanyMatchDialog';
import { updateProject as updateProjectApi, initiateProject, getProjectIntakeDraft, mapDetailToProjectItem } from '@/lib/projectApi';
import { useCompanyMatch } from './hooks/useCompanyMatch';

interface ProjectDetailPageProps {
  project: ProjectItem;
  onSave: (updated: ProjectItem) => void;
}

export function ProjectDetailPage({ project, onSave }: ProjectDetailPageProps) {
  const { setSelectedProjectId } = useAppStore();
  const [editedProject, setEditedProject] = useState<ProjectItem>(project);
  const [isNavCompact, setIsNavCompact] = useState(false);
  const [keywords, setKeywords] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'ledger'>('detail');
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
  
  // Company match hook
  const {
    isMatching,
    matchDialogOpen,
    companyCandidates,
    isConfirmingMatch,
    handleMatchCompany,
    handleConfirmCompanyMatch,
    setMatchDialogOpen,
  } = useCompanyMatch({
    project,
    editedProject,
    onSave: (updated) => {
      setEditedProject(updated);
      onSave(updated);
    },
  });

  // Load full project data on mount or when project changes
  useEffect(() => {
    const isProjectChanged = previousProjectIdRef.current !== project.id;

    if (isProjectChanged) {
      previousProjectIdRef.current = project.id;
    }
    
    // 每次项目改变时都从服务器加载完整数据（包含工商信息）
    const loadFullProjectData = async () => {
      try {
        const data = await getProjectIntakeDraft(project.id, {
          includeCompany: true,
          includeComparison: true,
        }) as { project: any; company?: any; field_comparison?: any };
        
        console.log('[ProjectDetailPage] ===== API 返回数据检查 =====');
        console.log('[ProjectDetailPage] 完整响应:', data);
        console.log('[ProjectDetailPage] data.project:', data.project);
        console.log('[ProjectDetailPage] data.company:', data.company);
        console.log('[ProjectDetailPage] data.field_comparison:', data.field_comparison);
        console.log('[ProjectDetailPage] company 是否存在:', !!data.company);
        console.log('[ProjectDetailPage] =====================================');
        
        // 合并响应数据，将 company 和 field_comparison 添加到 project 中
        const mergedData = {
          ...data.project,
          company: data.company,
          field_comparison: data.field_comparison,
        };
        
        console.log('[ProjectDetailPage] mergedData:', mergedData);
        console.log('[ProjectDetailPage] mergedData.company:', mergedData.company);
        
        // 映射项目数据（现在会自动包含 company 和 field_comparison）
        const fullProject = mapDetailToProjectItem(mergedData, project);
        
        console.log('[ProjectDetailPage] 映射后的完整项目数据:', fullProject);
        console.log('[ProjectDetailPage] company 数据:', fullProject.company);
        
        setEditedProject(fullProject);
        setKeywords(fullProject.keywords?.join(', ') || '');
      } catch (error) {
        console.error('[ProjectDetailPage] 加载项目详情失败:', error);
        // 如果加载失败，使用传入的 project 数据
        setEditedProject(project);
        setKeywords(project.keywords?.join(', ') || '');
      }
    };
    
    loadFullProjectData();
    
    setIsEditing(false);
    setPendingStatusUpdate(null);
  }, [project.id]); // 改为监听 project.id 而不是整个 project 对象

  // Monitor window size for nav compact mode
  useEffect(() => {
    const handleResize = () => {
      // Show compact nav when window width is less than 1400px
      setIsNavCompact(window.innerWidth < 1400);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      financial_status: editedProject.financial_status,
      financing_history: editedProject.financing_history,
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
    const data = await getProjectIntakeDraft(project.id, {
      includeCompany: true,
      includeComparison: true,
    }) as { project: any; company?: any; field_comparison?: any };
    
    // 合并响应数据
    const mergedData = {
      ...data.project,
      company: data.company,
      field_comparison: data.field_comparison,
    };
    
    // 3. 将后端返回的数据映射回 ProjectItem
    const updatedProject = mapDetailToProjectItem(mergedData, {
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
        const data = await getProjectIntakeDraft(project.id, {
          includeCompany: true,
          includeComparison: true,
        }) as { project: any; company?: any; field_comparison?: any };
        
        // 合并响应数据
        const mergedData = {
          ...data.project,
          company: data.company,
          field_comparison: data.field_comparison,
        };
        
        const mappedProject = mapDetailToProjectItem(mergedData, {
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
        financial_status: acceptanceDraft.financial_status,
        financing_history: acceptanceDraft.financing_history,
        keywords: normalizeKeywords(acceptanceKeywords),
      };

      // 1. 调用后端 API 更新项目信息
      await updateProjectApi(project.id, updates);
      
      // 2. 重新拉取完整的项目信息
      const data = await getProjectIntakeDraft(project.id, {
        includeCompany: true,
        includeComparison: true,
      }) as { project: any; company?: any; field_comparison?: any };
      
      // 合并响应数据
      const mergedData = {
        ...data.project,
        company: data.company,
        field_comparison: data.field_comparison,
      };
      
      // 3. 将后端返回的数据映射回 ProjectItem
      const updatedProject = mapDetailToProjectItem(mergedData, {
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

      {/* Header */}
      <ProjectDetailHeader
        editedProject={editedProject}
        isEditing={isEditing}
        displayStatus={displayStatus}
        keywords={keywords}
        onFieldChange={handleChange}
        onKeywordsChange={setKeywords}
        onStartEdit={handleStartEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onMarkNotAccepted={handleMarkNotAccepted}
        onStartAcceptance={handleStartAcceptance}
        onMarkEstablished={handleMarkEstablished}
        onClose={handleBack}
        onMatchCompany={handleMatchCompany}
        isMatching={isMatching}
      />

      {/* Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'detail' | 'ledger')} className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="px-6 pt-4">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1">
              <TabsTrigger 
                value="detail" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-2"
              >
                <FileText className="size-4" />
                项目详情
              </TabsTrigger>
              <TabsTrigger 
                value="ledger" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow gap-2"
              >
                <ClipboardList className="size-4" />
                项目台账
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="detail" className="h-full m-0 p-0 relative">
              {/* Navigation - only show in detail tab */}
              {activeTab === 'detail' && (
                <div className="absolute top-0 right-0 h-full pointer-events-none z-10 pr-6">
                  <div className="sticky top-6 pointer-events-auto">
                    <ProjectDetailNav isCompact={isNavCompact} />
                  </div>
                </div>
              )}
              
              <ScrollArea 
                className="h-full" 
                data-detail-scroll
                style={{ 
                  paddingTop: '1.5rem',
                  paddingBottom: '1.5rem',
                  paddingLeft: '1.5rem',
                  paddingRight: isNavCompact ? '4rem' : '12rem' 
                }}
              >
                <ProjectDetailBody
                  editedProject={editedProject}
                  isEditing={isEditing}
                  onFieldChange={handleChange}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ledger" className="h-full m-0 p-0">
              <div className="h-full overflow-auto">
                <ProjectProgressLedger project={editedProject} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
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
        onFieldChange={handleAcceptanceFieldChange}
        onCancel={handleCancelAcceptance}
        onConfirm={handleAcceptSave}
      />

      {/* Company Match Dialog */}
      <CompanyMatchDialog
        open={matchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        candidates={companyCandidates}
        onConfirm={handleConfirmCompanyMatch}
        isConfirming={isConfirmingMatch}
      />
    </div>
  );
}
