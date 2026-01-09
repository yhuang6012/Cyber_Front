import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import {
  Upload,
  FolderOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  X,
  StopCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cancelPdfTask } from '@/lib/projectApi';
import { toast } from 'sonner';

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

  const {
    uploadTasks,
    removeUploadTask,
    clearCompletedTasks,
    updateUploadTask,
  } = useAppStore();

  // 取消 PDF 任务
  const handleCancelTask = async (task: any) => {
    if (!task.taskId) {
      console.warn('[CreateProject] 无法取消任务：缺少 taskId', task);
      return;
    }

    try {
      console.log('[CreateProject] 🛑 尝试取消任务:', task.taskId, task.fileName);
      await cancelPdfTask(task.taskId);
      
      // 更新任务状态为已取消
      updateUploadTask(task.id, {
        status: 'error',
        error: '任务已取消',
      });
      
      toast.success(`已取消任务: ${task.fileName}`);
    } catch (error: any) {
      console.error('[CreateProject] ❌ 取消任务失败:', error);
      toast.error(`取消任务失败: ${error.message}`);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-4 overflow-y-auto" showCloseButton={false}>
        <DialogHeader className="relative">
          <DialogTitle>BP 上传与受理</DialogTitle>
          <DialogDescription className="sr-only">
            上传BP文件、查看解析与受理进度。
          </DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute rounded-full -top-2 right-0 h-8 w-8 cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* 布局改为列表式：一行一个板块，由 DialogContent 整体滚动承载 */}
        <div className="flex flex-col gap-4">
          {/* 上传入口 + 任务进度 */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* 新建项目：上传 BP 文件入口 */}
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
                  {isDragging ? '释放文件开始上传 BP' : '拖拽 BP 文件到此处'}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  支持拖拽 BP 文件，或点击下方按钮选择文件创建项目
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".csv,.json,.txt,.md,.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
                  onChange={handleFileInputChange}
                />

                <Button type="button" variant="default" onClick={handleClickSelect} className="gap-2 cursor-pointer">
                  <FolderOpen className="size-4" />
                  或点击选择文件
                </Button>
              </div>
            </div>

            {/* BP 上传与解析进度（使用全局 uploadTasks） */}
            <div className="flex-1 min-h-0 rounded-lg p-3 bg-muted/30 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="space-x-3 text-xs text-muted-foreground">
                  <span>进行中: {activeCount}</span>
                  <span>已完成: {completedCount}</span>
                  {errorCount > 0 && <span className="text-red-600">失败: {errorCount}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompletedTasks}
                  disabled={completedCount === 0 && errorCount === 0}
                  className="gap-1.5 cursor-pointer"
                >
                  <Trash2 className="size-4" />
                  清除已完成
                </Button>
              </div>

              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-1">
                  {uploadTasks.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-6">
                      暂无上传任务。上传文件后，这里会显示任务进度。
                    </div>
                  ) : (
                    uploadTasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          'rounded-2xl px-3 py-2 space-y-1',
                          task.status === 'error'
                            ? 'bg-red-50/50 dark:bg-red-950/20'
                            : 'bg-gray-100 dark:bg-gray-800/50',
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center">
                              {getTaskStatusIcon(task)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* <FileText className="size-4 text-muted-foreground flex-shrink-0" /> */}
                                <span className="font-medium truncate">{task.fileName}</span>
                                <span
                                  className={[
                                    'text-[11px] text-muted-foreground whitespace-nowrap',
                                    task.status === 'error' ? 'ml-0' : 'ml-3',
                                  ].join(' ')}
                                >
                                  {formatFileSize(task.fileSize)} · {getTaskStatusText(task)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* 进行中的任务显示取消按钮 */}
                          {(task.status === 'uploading' || task.status === 'parsing') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer text-orange-600 hover:text-orange-700"
                              onClick={() => handleCancelTask(task)}
                              title="取消任务"
                            >
                              <StopCircle className="size-4" />
                            </Button>
                          )}
                          
                          {/* 已完成或失败的任务显示移除按钮 */}
                          {(task.status === 'completed' || task.status === 'error') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer"
                              onClick={() => removeUploadTask(task.id)}
                              title="移除任务"
                            >
                              <XCircle className="size-4" />
                            </Button>
                          )}
                        </div>

                        {task.status === 'uploading' && (
                          <div className="flex items-center">
                            <Progress value={task.uploadProgress} className="h-1.5 flex-1" />
                            <div className="w-7 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-medium text-muted-foreground tabular-nums ml-1">
                                {task.uploadProgress}%
                              </span>
                            </div>
                          </div>
                        )}

                        {task.status === 'parsing' && (
                          <div className="flex items-center">
                            <Progress value={task.parseProgress} className="h-1.5 flex-1" />
                            <div className="w-7 flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-medium text-muted-foreground tabular-nums ml-1">
                                {task.parseProgress}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
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
