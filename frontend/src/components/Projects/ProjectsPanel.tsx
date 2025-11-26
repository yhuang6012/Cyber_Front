import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore, ProjectItem } from '@/store/useAppStore';
import { Upload, Search, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailSheet } from './ProjectDetailSheet';
import { FileList } from './FileList';
import { EnhancedUploadDialog } from './UploadDialog';
import { cn } from '@/lib/utils';

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

  // Simulate file upload and parsing with progress
  const processFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const taskId = addUploadTask(file.name, file.size);
      
      try {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateUploadTask(taskId, { uploadProgress: i });
        }
        
        // Transition to parsing
        updateUploadTask(taskId, { status: 'parsing', parseProgress: 0 });
        
        // Parse the file (reuse existing logic)
        await parseFile(file);
        
        // Simulate parsing progress
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 150));
          updateUploadTask(taskId, { parseProgress: i });
        }
        
        // Mark as completed
        updateUploadTask(taskId, { 
          status: 'completed', 
          parseProgress: 100,
          completedAt: new Date().toISOString(),
        });
      } catch (error) {
        updateUploadTask(taskId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : '上传失败',
        });
      }
    }
    
  }, [addUploadTask, updateUploadTask]);

  const parseFile = async (file: File): Promise<string> => {
    // Reuse the existing parsing logic from addProjectsFromFiles
    const parseCsv = async (file: File): Promise<ProjectItem[]> => {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) return [];
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const nameIdx =
        headers.findIndex(h => ['name', 'project', 'title', '项目', '项目名称'].includes(h.toLowerCase())) >= 0
          ? headers.findIndex(h => ['name', 'project', 'title', '项目', '项目名称'].includes(h.toLowerCase()))
          : 0;
      const descIdx =
        headers.findIndex(h => ['description', 'desc', '摘要', '简介'].includes(h.toLowerCase()));
      const now = new Date().toISOString();
      const rows: ProjectItem[] = dataLines.map((line) => {
        const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = (cells[nameIdx] ?? '').trim() || file.name;
        const description = descIdx >= 0 ? (cells[descIdx] ?? '').trim() : undefined;
        return {
          id: crypto.randomUUID(),
          name,
          description,
          status: 'pending',
          tags: [],
          sourceFileName: file.name,
          createdAt: now,
        };
      });
      return rows;
    };
    
    const toTextSummary = (text: string, max = 160) =>
      text.replace(/\s+/g, ' ').slice(0, max).trim();

    const newFileMeta = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size ?? 0,
      type: file.type ?? '',
      createdAt: new Date().toISOString(),
    };
    
    useAppStore.setState(state => ({
      uploadedFiles: [newFileMeta, ...state.uploadedFiles],
    }));

    let newProject: ProjectItem;
    
    try {
      if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
        const rows = await parseCsv(file);
        if (rows.length > 0) {
          newProject = rows[0];
        } else {
          throw new Error('CSV文件为空');
        }
      } else if (file.type.includes('json') || file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        const item = Array.isArray(data) ? data[0] : data;
        const name = String(item?.name ?? item?.title ?? item?.project ?? file.name);
        const description = item?.description ?? item?.desc ?? '';
        newProject = {
          id: crypto.randomUUID(),
          name,
          description,
          status: 'pending',
          tags: Array.isArray(item?.tags) ? item.tags : [],
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
        };
      } else {
        // Fallback: treat as text
        const text = await file.text().catch(() => '');
        newProject = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, ''),
          description: text ? toTextSummary(text) : undefined,
          status: 'pending',
          tags: [],
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
        };
      }
    } catch {
      newProject = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''),
        description: undefined,
        status: 'pending',
        tags: [],
        sourceFileName: file.name,
        createdAt: new Date().toISOString(),
      };
    }
    
    useAppStore.setState(state => ({
      projects: [newProject, ...state.projects],
    }));
    
    return newProject.id;
  };

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
      project.founderName?.toLowerCase().includes(query) ||
      project.keywords?.some(k => k.toLowerCase().includes(query))
    );
  });

  // Sort: established first, then accepted, then pending, then by createdAt desc
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const statusPriority = { established: 0, accepted: 1, pending: 2 };
    const priorityA = statusPriority[a.status];
    const priorityB = statusPriority[b.status];
    
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
            <TabsTrigger value="cards">项目展示</TabsTrigger>
            <TabsTrigger value="files">文件展示</TabsTrigger>
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
              variant={isUploading ? "default" : "secondary"} 
              size="sm" 
              onClick={handleClickUpload} 
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  任务追踪 ({activeTaskCount})
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  上传文件
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
