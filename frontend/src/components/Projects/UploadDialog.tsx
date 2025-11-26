import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, ProjectItem, UploadedFileMeta } from '@/store/useAppStore';
import {
  Upload,
  FileText,
  FolderOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessFiles: (files: File[]) => Promise<void>;
}

export function EnhancedUploadDialog({
  open,
  onOpenChange,
  onProcessFiles,
}: EnhancedUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const {
    uploadTasks,
    removeUploadTask,
    clearCompletedTasks,
    projects,
    updateProject,
    uploadedFiles,
    removeUploadedFiles,
  } = useAppStore();

  // === 上传入口 ===
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
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
        await onProcessFiles(files);
      }
    },
    [onProcessFiles],
  );

  const handleClickSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      await onProcessFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // === 上传任务进度（来自全局 store） ===
  const activeCount = uploadTasks.filter(
    task => task.status === 'uploading' || task.status === 'parsing',
  ).length;
  const completedCount = uploadTasks.filter(task => task.status === 'completed').length;
  const errorCount = uploadTasks.filter(task => task.status === 'error').length;

  const getTaskStatusIcon = (task: typeof uploadTasks[number]) => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'error':
        return <XCircle className="size-5 text-red-600" />;
      case 'uploading':
      case 'parsing':
        return <Loader2 className="size-5 text-blue-600 animate-spin" />;
    }
  };

  const getTaskStatusText = (task: typeof uploadTasks[number]) => {
    switch (task.status) {
      case 'uploading':
        return '上传中...';
      case 'parsing':
        return '解析中...';
      case 'completed':
        return '已完成';
      case 'error':
        return task.error || '上传失败';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // === 待受理项目（所有 status === 'pending' 且来源于上传） ===
  const pendingProjects: ProjectItem[] = projects.filter(
    p => p.status === 'pending' && p.sourceFileName,
  );

  const handleAcceptProject = (project: ProjectItem) => {
    updateProject(project.id, { status: 'accepted' });
  };

  const handleRejectProject = (project: ProjectItem) => {
    // 简化：不在这里收集原因，只保留为 pending，可根据需要扩展为弹出备注输入
    updateProject(project.id, {
      status: 'pending',
    });
  };

  const handleBatchAcceptProjects = () => {
    pendingProjects.forEach(p => {
      updateProject(p.id, { status: 'accepted' });
    });
  };

  // === 已上传文件批量管理 ===
  const toggleSelectFile = (fileId: string, checked: boolean) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(fileId);
      } else {
        next.delete(fileId);
      }
      return next;
    });
  };

  const handleSelectAllFiles = () => {
    if (selectedFileIds.size === uploadedFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(uploadedFiles.map(f => f.id)));
    }
  };

  const handleDeleteSelectedFiles = () => {
    if (selectedFileIds.size === 0) return;
    if (
      !window.confirm(
        `确定要删除选中的 ${selectedFileIds.size} 个文件吗？此操作不会删除已生成的项目卡片。`,
      )
    ) {
      return;
    }
    removeUploadedFiles(Array.from(selectedFileIds));
    setSelectedFileIds(new Set());
  };

  const isAllSelected =
    uploadedFiles.length > 0 && selectedFileIds.size === uploadedFiles.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>上传与任务管理</DialogTitle>
          <DialogDescription>
            一个窗口完成：文件上传、任务进度追踪、项目受理决策，以及已上传文件的批量管理。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* 左侧：上传入口 + 任务进度 */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* 上传入口 */}
            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-6 transition-all',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:bg-muted/50',
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload
                  className={cn(
                    'size-12 mx-auto mb-3 transition-colors',
                    isDragging ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <h3 className="text-base font-semibold mb-1">
                  {isDragging ? '释放文件开始上传' : '拖拽文件到此处'}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  支持拖拽文件 / 文件夹，或点击下方按钮选择文件
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".csv,.json,.txt,.md,.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
                  onChange={handleFileInputChange}
                />

                <Button type="button" variant="default" onClick={handleClickSelect} className="gap-2">
                  <FolderOpen className="size-4" />
                  或点击选择文件
                </Button>
              </div>
            </div>

            {/* 任务进度（使用全局 uploadTasks） */}
            <div className="flex-1 min-h-0 border rounded-lg p-3 bg-muted/30 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="space-x-3 text-xs text-muted-foreground">
                  <span>进行中: {activeCount}</span>
                  <span>已完成: {completedCount}</span>
                  {errorCount > 0 && <span className="text-red-600">失败: {errorCount}</span>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompletedTasks}
                  disabled={completedCount === 0 && errorCount === 0}
                >
                  清除已完成
                </Button>
              </div>

              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-3">
                  {uploadTasks.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-6">
                      暂无上传任务。上传文件后，这里会显示任务进度。
                    </div>
                  ) : (
                    uploadTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          'border rounded-lg p-3 space-y-2 bg-background',
                          task.status === 'error' &&
                            'border-red-300 bg-red-50/50 dark:bg-red-950/20',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {getTaskStatusIcon(task)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium truncate">{task.fileName}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-1">
                                {formatFileSize(task.fileSize)} · {getTaskStatusText(task)}
                              </div>
                            </div>
                          </div>
                          {(task.status === 'completed' || task.status === 'error') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeUploadTask(task.id)}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          )}
                        </div>

                        {task.status === 'uploading' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">上传进度</span>
                              <span className="font-medium">{task.uploadProgress}%</span>
                            </div>
                            <Progress value={task.uploadProgress} className="h-1.5" />
                          </div>
                        )}

                        {task.status === 'parsing' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">解析进度</span>
                              <span className="font-medium">{task.parseProgress}%</span>
                            </div>
                            <Progress value={task.parseProgress} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* 右侧：待受理项目 + 已上传文件批量管理 */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* 待受理项目 */}
            <div className="border rounded-lg p-3 bg-muted/30 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">待受理项目</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    共 {pendingProjects.length} 个
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchAcceptProjects}
                    disabled={pendingProjects.length === 0}
                  >
                    一键全部受理
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-2">
                  {pendingProjects.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-4">
                      暂无待受理项目。上传并解析完成后，这里会显示新的项目。
                    </div>
                  ) : (
                    pendingProjects.map(project => (
                      <div
                        key={project.id}
                        className="border rounded-md px-3 py-2 bg-background flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{project.name}</div>
                            {project.sourceFileName && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                来源文件: {project.sourceFileName}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectProject(project)}
                            >
                              不受理
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptProject(project)}
                            >
                              受理
                            </Button>
                          </div>
                        </div>
                        {project.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-2">
                            {project.description}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* 已上传文件批量管理 */}
            <div className="border rounded-lg p-3 bg-muted/30 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">已上传文件批量管理</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFiles}
                    disabled={uploadedFiles.length === 0}
                  >
                    {isAllSelected ? '取消全选' : '全选'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={handleDeleteSelectedFiles}
                    disabled={selectedFileIds.size === 0}
                  >
                    <Trash2 className="size-3.5" />
                    删除选中 ({selectedFileIds.size})
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-1">
                  {uploadedFiles.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-4">
                      暂无已上传文件。
                    </div>
                  ) : (
                    uploadedFiles.map((file: UploadedFileMeta) => {
                      const checked = selectedFileIds.has(file.id);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-background"
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border border-input"
                            checked={checked}
                            onChange={e => toggleSelectFile(file.id, e.target.checked)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {formatFileSize(file.size)} ·{' '}
                              {new Date(file.createdAt).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

