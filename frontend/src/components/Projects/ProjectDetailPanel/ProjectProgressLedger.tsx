import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ProjectItem } from '@/store/useAppStore';
import { CheckCircle2, FileText, FolderPlus, Download, Trash2, Loader2, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { deleteProjectFile, getProjectFileDownloadUrl, getProjectFiles, uploadProjectFiles } from '@/lib/projectApi';
import { toast } from 'sonner';
import { useAudioTranscribeTasks } from './hooks/useAudioTranscribeTasks';

interface ProjectProgressLedgerProps {
  project: ProjectItem;
}

export function ProjectProgressLedger({ project }: ProjectProgressLedgerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [files, setFiles] = useState<Array<{ id: string; name: string; size: number; type: string; createdAt: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [hasUserSelectedStatus, setHasUserSelectedStatus] = useState(false);
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(new Set());
  const [downloadingFileIds, setDownloadingFileIds] = useState<Set<string>>(new Set());

  // 当项目状态变化时，重置筛选规则：不点击状态按钮时 status=all
  useEffect(() => {
    setHasUserSelectedStatus(false);
    setSelectedStatus(undefined);
  }, [project.status]);

  const refreshFiles = useCallback(async (opts?: { status?: string }) => {
    setIsLoadingFiles(true);
    try {
      const list = await getProjectFiles(String(project.id), { status: opts?.status });
      setFiles(list.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        createdAt: f.createdAt,
      })));
    } finally {
      setIsLoadingFiles(false);
    }
  }, [project.id]);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    const projId = String(project.id);
    setDeletingFileIds(prev => new Set(prev).add(fileId));
    try {
      await deleteProjectFile(projId, fileId);
      toast.success(<div className="text-sm text-emerald-600 whitespace-nowrap">文件已删除</div>, { duration: 3000 });
      const statusToUse = hasUserSelectedStatus ? selectedStatus : 'all';
      await refreshFiles({ status: statusToUse });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败';
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    } finally {
      setDeletingFileIds(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, [hasUserSelectedStatus, project.id, refreshFiles, selectedStatus]);

  const handleDownloadFile = useCallback(async (file: { id: string; name: string }) => {
    const projId = String(project.id);
    setDownloadingFileIds(prev => new Set(prev).add(file.id));
    try {
      const { preview_url } = await getProjectFileDownloadUrl(projId, file.id);
      // 触发下载（新标签打开/或直接下载，取决于 OSS 的响应头）
      const a = document.createElement('a');
      a.href = preview_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '下载失败';
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    } finally {
      setDownloadingFileIds(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  }, [project.id]);

  // 初始加载：不传 status（后端默认按当前项目状态返回）
  useEffect(() => {
    void refreshFiles({ status: 'all' });
  }, [refreshFiles]);

  const audioTasks = useAudioTranscribeTasks({
    onAnyTaskSucceeded: () => {
      const statusToUse = hasUserSelectedStatus ? selectedStatus : 'all';
      void refreshFiles({ status: statusToUse });
    },
    pollIntervalMs: 5000,
  });

  const isAudioFileName = useCallback((name: string) => {
    const lower = (name || '').toLowerCase();
    return ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus'].some(ext => lower.endsWith(ext));
  }, []);

  const fileHasTranscribeTask = useCallback((fileId: string) => {
    return audioTasks.tasks.some(t => t.fileId === fileId && (t.status === 'queued' || t.status === 'processing'));
  }, [audioTasks.tasks]);

  const getActiveTranscribeTaskForFile = useCallback((fileId: string) => {
    // 最新任务优先（tasks 里是 unshift）
    return audioTasks.tasks.find(t => t.fileId === fileId) || null;
  }, [audioTasks.tasks]);

  const handleStartTranscribe = useCallback(async (file: { id: string; name: string }) => {
    try {
      const taskId = await audioTasks.startTaskForFile({ fileId: file.id, fileName: file.name });
      console.log('[ProjectProgressLedger][audio] manual task submitted ->', { fileId: file.id, taskId, fileName: file.name });
      toast.success(
        <div className="text-sm text-emerald-600 whitespace-nowrap">已提交音频转写任务</div>,
        { duration: 3000 },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交音频转写任务失败';
      console.error('[ProjectProgressLedger][audio] manual submit error', err);
      toast.error(<div className="text-sm text-red-600 whitespace-nowrap">{msg}</div>, { duration: 3000 });
    }
  }, [audioTasks]);

  // 根据选择的阶段过滤文件：本组件以接口返回为准
  const stageFiles = useMemo(() => files, [files]);

  // 搜索过滤
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return stageFiles;
    const query = searchQuery.toLowerCase();
    return stageFiles.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    );
  }, [stageFiles, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // 调用上传 API
      const result = await uploadProjectFiles(project.id, files);
      
      // 处理上传结果
      if (Array.isArray(result)) {
        // 多个文件上传（207 Multi-Status）
        const successCount = result.filter((item: any) => !item.error).length;
        const errorCount = result.filter((item: any) => item.error).length;

        if (errorCount > 0) {
          toast.error(
            <div className="text-sm text-red-600 leading-snug whitespace-nowrap">
              上传完成：{successCount}成功，{errorCount}失败
            </div>,
            { duration: 3000 },
          );
        } else {
          toast.success(
            <div className="text-sm text-emerald-600 leading-snug whitespace-nowrap">
              成功上传 {successCount} 个文件
            </div>,
            { duration: 3000 },
          );
        }
      } else {
        // 单个文件上传（201）
        toast.success(
          <div className="text-sm text-emerald-600 leading-snug whitespace-nowrap">
            文件上传成功
          </div>,
          { duration: 3000 },
        );
      }
      
      // TODO: 重新获取项目文件列表以更新显示
      // 上传后按当前筛选刷新
      const statusToUse = hasUserSelectedStatus ? selectedStatus : 'all';
      await refreshFiles({ status: statusToUse });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败';
      toast.error(
        <div className="text-sm text-red-600 leading-snug whitespace-nowrap">
          {message}
        </div>,
        { duration: 3000 },
      );
    } finally {
      setIsUploading(false);
      // 重置input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 根据项目状态确定每个步骤的状态
  const getStepStatus = (stepIndex: number) => {
    const status = project.status;
    
    if (status === 'rejected') {
      // 不受理：接收完成，受理显示"不受理"（红色），立项未到达
      return {
        0: 'completed', // 接收
        1: 'rejected',   // 不受理（特殊状态）
        2: 'pending'     // 立项
      }[stepIndex] || 'pending';
    }
    
    // 正常流程
    switch (status) {
      case 'received':
        return stepIndex === 0 ? 'active' : 'pending';
      case 'accepted':
        return stepIndex <= 1 ? 'completed' : 'pending';
      case 'initiated':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const steps = [
    { id: 'received', label: '接收' },
    { id: 'accepted', label: '受理' },
    { id: 'initiated', label: '立项' }
  ];

  // 如果是不受理，第二个步骤显示"不受理"
  const getStepLabel = (stepIndex: number) => {
    if (project.status === 'rejected' && stepIndex === 1) {
      return '不受理';
    }
    return steps[stepIndex].label;
  };

  const getStepColor = (stepIndex: number) => {
    const stepStatus = getStepStatus(stepIndex);
    const stepId = steps[stepIndex].id;
    
    // 不受理状态：红色
    if (stepStatus === 'rejected') {
      return 'bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    }
    
    // 未激活状态：灰色
    if (stepStatus === 'pending') {
      return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
    
    // 激活或完成状态：根据步骤 ID 使用对应的颜色
    // 使用更深的颜色版本以在进度条上更明显
    switch (stepId) {
      case 'received':
        // 接收：琥珀色
        return 'bg-amber-200 text-amber-700 dark:bg-amber-900/80 dark:text-amber-400';
      case 'accepted':
        // 已受理：绿色
        return 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'initiated':
        // 已立项：蓝色
        return 'bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const handleStepClick = (stepIndex: number) => {
    const stepId = steps[stepIndex].id;

    // 点击状态按钮才传 status
    setHasUserSelectedStatus(true);
    const status =
      project.status === 'rejected' && stepIndex === 1 ? 'rejected' : stepId;
    setSelectedStatus(status);
    void refreshFiles({ status });
  };

  // 全局“空白点击”重置：点任意非交互区域 → 回到 all
  useEffect(() => {
    if (!hasUserSelectedStatus) return;

    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      // 点在状态条的可点击 segment 上不重置（保持筛选）
      if (target.closest('[data-status-segment="true"]')) return;

      // 点在交互控件/表格行上不重置（避免误触）
      if (
        target.closest(
          'button,a,input,textarea,select,[role="button"],[role="link"],tr,td,th',
        )
      ) {
        return;
      }

      // 其余区域视为“空白处”：重置为 all
      setHasUserSelectedStatus(false);
      setSelectedStatus(undefined);
      void refreshFiles({ status: 'all' });
    };

    // capture：确保能抓到更外层区域（例如项目标题旁边空白）
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [hasUserSelectedStatus, refreshFiles]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Chevron Progress Bar */}
      <div className="px-8 py-3 bg-muted/20 flex-shrink-0">
        <div className="flex items-center w-full">
          <div className="flex items-center flex-1">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(index);
              const isCompleted = stepStatus === 'completed' || stepStatus === 'active';
              const isRejected = stepStatus === 'rejected';
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Chevron Segment */}
                  <div
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "relative flex items-center justify-center py-2 cursor-pointer transition-all w-full",
                      getStepColor(index),
                      "hover:opacity-90",
                      // 第一个：左圆角
                      index === 0 && "rounded-l-lg",
                      // 最后一个：右圆角
                      index === steps.length - 1 && "rounded-r-lg",
                      // Chevron 形状
                      index < steps.length - 1 && "mr-[-1px]",
                      index > 0 && "ml-[-1px]"
                    )}
                    data-status-segment="true"
                    style={{
                      clipPath: index === 0 
                        ? 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)'
                        : index === steps.length - 1
                        ? 'polygon(20px 0, 100% 0, 100% 100%, 20px 100%, 0 50%)'
                        : 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 z-10">
                      {isCompleted && !isRejected && (
                        <CheckCircle2 className="size-4" />
                      )}
                      <span className="font-medium text-xs whitespace-nowrap">
                        {getStepLabel(index)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Search and Actions */}
        <div className="px-8 py-4 border-b border-border/50 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件名..."
              className="max-w-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                const statusToUse = hasUserSelectedStatus ? selectedStatus : 'all';
                void refreshFiles({ status: statusToUse });
              }}
              disabled={isLoadingFiles}
            >
              {isLoadingFiles ? '刷新中...' : '刷新'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
            <Button 
              variant="default" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 cursor-pointer"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <FolderPlus className="size-4" />
                  子文件上传
                </>
              )}
            </Button>
          </div>
        </div>

        {/* File Table */}
        <ScrollArea className="flex-1">
          <div className="px-8 py-4">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm mb-2">
                  {isLoadingFiles ? '加载中...' : '该阶段暂无文件'}
                </p>
                <p className="text-xs text-muted-foreground">
                  点击"子文件上传"按钮上传文件
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">文件名</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">类型</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">大小</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">上传时间</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            <span>{file.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {file.type || '未知'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(file.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAudioFileName(file.name) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleStartTranscribe({ id: file.id, name: file.name })}
                                      disabled={fileHasTranscribeTask(file.id) || isUploading}
                                    >
                                      {(() => {
                                        const t = getActiveTranscribeTaskForFile(file.id);
                                        const isActive = t?.status === 'queued' || t?.status === 'processing';
                                        if (isActive) return <Loader2 className="size-4 animate-spin" />;
                                        return <FileAudio className="size-4" />;
                                      })()}
                                    </Button>
                                    {(() => {
                                      const t = getActiveTranscribeTaskForFile(file.id);
                                      const isActive = t?.status === 'queued' || t?.status === 'processing';
                                      if (!isActive) return null;
                                      const pct = Math.max(0, Math.min(99, Number(t?.progress ?? 0)));
                                      return (
                                        <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
                                          {pct}%
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {(() => {
                                    const t = getActiveTranscribeTaskForFile(file.id);
                                    const isActive = t?.status === 'queued' || t?.status === 'processing';
                                    if (isActive) return `转写中 ${Math.max(0, Math.min(99, Number(t?.progress ?? 0)))}%`;
                                    return '转文字';
                                  })()}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDownloadFile({ id: file.id, name: file.name })}
                                  disabled={downloadingFileIds.has(file.id)}
                                >
                                  {downloadingFileIds.has(file.id)
                                    ? <Loader2 className="size-4 animate-spin" />
                                    : <Download className="size-4" />
                                  }
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>下载</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteFile(file.id)}
                                  disabled={deletingFileIds.has(file.id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>删除</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
