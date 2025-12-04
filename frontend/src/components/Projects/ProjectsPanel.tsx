import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import { Upload, Search, Loader2, FolderPlus, LayoutGrid, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailSheet } from './ProjectDetailSheet';
import { FileList } from './FileList';
import { EnhancedUploadDialog } from './CreateProject';
import { cn } from '@/lib/utils';
import {
  uploadBpFiles,
  openPdfTasksSse,
  getProjectIntakeDraft,
  PdfTaskStatus,
} from '@/lib/projectApi';

export function ProjectsPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  
  const { 
    projects, 
    removeProject, 
    updateProject,
    uploadTasks,
    addUploadTask,
    updateUploadTask,
    hasActiveUploads,
  } = useAppStore();
  
  const [viewMode, setViewMode] = useState<'cards' | 'files'>('cards');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleClickUpload = () => {
    // 统一打开上传管理大窗口（包含上传、进度、受理决策、批量管理）
    setUploadDialogOpen(true);
  };

  // SSE connection ref for cleanup
  const sseConnectionRef = useRef<{ close: () => void } | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      sseConnectionRef.current?.close();
    };
  }, []);

  // Track pending tasks: taskId -> { uiTaskId, fileName, fileSize, projectId }
  const pendingTasksRef = useRef<Map<string, { uiTaskId: string; fileName: string; fileSize: number; projectId: string }>>(new Map());

  // Handle SSE task updates
  const handleSseTaskUpdate = useCallback(async (status: PdfTaskStatus) => {
    const taskInfo = pendingTasksRef.current.get(status.task_id);
    if (!taskInfo) return;

    const { uiTaskId, fileName, projectId } = taskInfo;

    if (status.status === 'processing') {
      // Still parsing - update progress (estimate based on time or just show indeterminate)
      updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 50 });
    } else if (status.status === 'completed') {
      // Parsing completed - fetch project data via GET /api/projects/{project_id}
      updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 80 });

      try {
        // 使用 project_id（来自 bps 上传接口返回）获取项目提取的数据
        const extractedInfo = await getProjectIntakeDraft(projectId);
        
        // Map extracted info to ProjectItem fields (根据实际返回数据结构)
        const projectUpdates: Partial<ProjectItem> = {
          name: extractedInfo.project_name || fileName.replace(/\.[^.]+$/, ''),
          description: extractedInfo.description,
          companyName: extractedInfo.company_name,
          companyAddress: extractedInfo.company_address,
          industry: extractedInfo.industry,
          projectContact: extractedInfo.project_contact,
          contactInfo: extractedInfo.contact_info,
          uploader: extractedInfo.uploaded_by,
          coreTeam: extractedInfo.core_team, // 数组类型
          coreProduct: extractedInfo.core_product,
          coreTechnology: extractedInfo.core_technology,
          competitionAnalysis: extractedInfo.competition_analysis,
          marketSize: extractedInfo.market_size,
          financialStatus: extractedInfo.financial_status, // { current, future }
          financingHistory: extractedInfo.financing_history, // { completed_rounds, current_funding_need, funding_use }
          keywords: extractedInfo.keywords || [],
          updatedAt: extractedInfo.updated_at,
        };

        // Update the project with extracted info
        updateProject(projectId, projectUpdates);

        // Mark task as completed
        updateUploadTask(uiTaskId, {
          status: 'completed',
          parseProgress: 100,
          completedAt: new Date().toISOString(),
          projectId,
        });
      } catch (err) {
        console.error('[SSE] Failed to fetch project data:', err);
        updateUploadTask(uiTaskId, {
          status: 'completed',
          parseProgress: 100,
          completedAt: new Date().toISOString(),
          projectId,
        });
      }

      // Remove from pending tasks
      pendingTasksRef.current.delete(status.task_id);

      // Close SSE if no more pending tasks
      if (pendingTasksRef.current.size === 0) {
        sseConnectionRef.current?.close();
        sseConnectionRef.current = null;
      }
    } else if (status.status === 'failed' || status.status === 'error') {
      updateUploadTask(uiTaskId, {
        status: 'error',
        error: '解析失败',
      });
      pendingTasksRef.current.delete(status.task_id);
    }
  }, [updateUploadTask, updateProject]);

  // Upload files via real API and track with SSE
  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Create UI tasks for each file
    const fileTaskMap = new Map<string, { uiTaskId: string; file: File }>();
    for (const file of files) {
      const uiTaskId = addUploadTask(file.name, file.size);
      fileTaskMap.set(file.name, { uiTaskId, file });
    }

    try {
      // Call the real upload API
      const results = await uploadBpFiles(files);

      // Process results and start SSE tracking
      const pdfTaskIds: string[] = [];

      for (const result of results) {
        // Find matching file by name (from oss_key or original order)
        const fileName = result.oss_key?.split('/').pop() || '';
        const matchedEntry = Array.from(fileTaskMap.entries()).find(
          ([name]) => fileName.includes(name) || name.includes(fileName.replace(/\.[^.]+$/, ''))
        );
        
        // If no match by name, use first unprocessed entry
        const [matchedFileName, taskInfo] = matchedEntry || fileTaskMap.entries().next().value || [];
        
        if (!taskInfo) continue;

        const { uiTaskId, file } = taskInfo;
        fileTaskMap.delete(matchedFileName!);

        // Update upload progress to 100%
        updateUploadTask(uiTaskId, { uploadProgress: 100 });

        // Create a pending project
        const projectId = String(result.project_id || crypto.randomUUID());
        const newProject: ProjectItem = {
          id: projectId,
          name: file.name.replace(/\.[^.]+$/, ''),
          description: undefined,
          status: 'pending',
          tags: [],
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
        };

        // Add to store
        useAppStore.setState(state => ({
          projects: [newProject, ...state.projects],
          uploadedFiles: [
            {
              id: String(result.file_id || crypto.randomUUID()),
              name: file.name,
              size: result.size || file.size,
              type: file.type,
              createdAt: new Date().toISOString(),
            },
            ...state.uploadedFiles,
          ],
        }));

        // If we have a pdf_task_id, track it for SSE
        if (result.pdf_task_id) {
          const pdfTaskId = String(result.pdf_task_id);
          pdfTaskIds.push(pdfTaskId);
          pendingTasksRef.current.set(pdfTaskId, {
            uiTaskId,
            fileName: file.name,
            fileSize: result.size || file.size,
            projectId,
          });

          // Transition to parsing state
          updateUploadTask(uiTaskId, { status: 'parsing', parseProgress: 0 });
        } else {
          // No pdf_task_id means upload only, mark as completed
          updateUploadTask(uiTaskId, {
            status: 'completed',
            parseProgress: 100,
            completedAt: new Date().toISOString(),
            projectId,
          });
        }
      }

      // Start SSE connection if we have tasks to track
      if (pdfTaskIds.length > 0) {
        // Close existing connection if any
        sseConnectionRef.current?.close();

        sseConnectionRef.current = openPdfTasksSse(pdfTaskIds, {
          onTaskUpdate: handleSseTaskUpdate,
          onError: (err) => {
            console.error('[SSE] Connection error:', err);
            // Mark all pending tasks as error
            for (const [, info] of pendingTasksRef.current.entries()) {
              updateUploadTask(info.uiTaskId, {
                status: 'error',
                error: 'SSE 连接失败',
              });
            }
            pendingTasksRef.current.clear();
          },
        });
      }
    } catch (error) {
      // Mark all tasks as error
      for (const [, { uiTaskId }] of fileTaskMap.entries()) {
        updateUploadTask(uiTaskId, {
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败',
        });
      }
    }
  }, [addUploadTask, updateUploadTask, updateProject, handleSseTaskUpdate]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    setUploadDialogOpen(true);
    await processFiles(files);
    
    // Reset input value so the same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCardClick = (project: ProjectItem) => {
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const handleSaveProject = (updated: ProjectItem) => {
    updateProject(updated.id, updated);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      setUploadDialogOpen(true);
      await processFiles(files);
    }
  }, [processFiles]);

  // Filter projects by search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.companyName?.toLowerCase().includes(query) ||
      project.industry?.toLowerCase().includes(query) ||
      project.projectContact?.toLowerCase().includes(query) ||
      project.keywords?.some(k => k.toLowerCase().includes(query))
    );
  });

  // Sort: established first, then accepted, then pending/pending_acceptance, then by createdAt desc
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const statusPriority: Record<string, number> = { established: 0, accepted: 1, pending: 2, pending_acceptance: 2 };
    const priorityA = statusPriority[a.status] ?? 3;
    const priorityB = statusPriority[b.status] ?? 3;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const isUploading = hasActiveUploads();
  const activeTaskCount = uploadTasks.filter(t => t.status === 'uploading' || t.status === 'parsing').length;

  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'files')} className="h-full flex flex-col">
      <div className="px-6 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <TabsList>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger 
                  value="cards" 
                  className="cursor-pointer"
                >
                  <LayoutGrid className="size-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                项目展示
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger 
                  value="files" 
                  className="cursor-pointer"
                >
                  <FileText className="size-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                文件展示
              </TooltipContent>
            </Tooltip>
          </TabsList>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".csv,.json,.txt,.md,.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
              onChange={handleFilesSelected}
            />
            <Button 
              variant={isUploading ? "default" : "ghost"} 
              size="sm" 
              onClick={handleClickUpload} 
              className="flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  任务追踪 ({activeTaskCount})
                </>
              ) : (
                  <>
                    <FolderPlus className="size-4" />
                    新建项目
                  </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'cards' ? '搜索项目名称、公司、行业、关键词...' : '搜索文件名...'}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div 
        ref={dropZoneRef}
        className={cn(
          "px-6 pb-6 overflow-auto flex-1 relative transition-colors",
          isDragging && "bg-primary/5"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg m-6 pointer-events-none">
            <div className="text-center">
              <Upload className="size-12 mx-auto mb-3 text-primary" />
              <p className="text-lg font-semibold text-primary">拖放文件到此处上传</p>
              <p className="text-sm text-muted-foreground mt-1">支持多文件/多格式并发上传</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === 'cards' ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-3"
            >
              {sortedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="size-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-sm mb-2">
                    还没有项目卡片
                  </p>
                  <p className="text-xs text-muted-foreground">
                    点击右上角的"上传文件"按钮，或拖拽文件到此处
                  </p>
                </div>
              ) : (
                sortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    variant="compact"
                    onDelete={removeProject}
                    onClick={handleCardClick}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <FileList searchQuery={searchQuery} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProjectDetailSheet
        project={selectedProject}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveProject}
      />

      <EnhancedUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onProcessFiles={processFiles}
      />
    </Tabs>
  );
}
