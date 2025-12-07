import { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectItem, useAppStore } from '@/store/useAppStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Circle, ArrowRight, FileText, FolderPlus, Download, Trash2, FileCheck, Edit, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getStatusDisplay } from './projectDetailUtils';

interface ProjectProgressLedgerProps {
  project: ProjectItem;
}

interface ProjectEvent {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'pending';
  icon?: React.ElementType;
}

interface ProgressStage {
  id: 'received' | 'accepted' | 'rejected' | 'initiated';
  name: string;
  status: 'completed' | 'active' | 'pending';
  events: ProjectEvent[];
}

// 根据项目数据和状态判断事件是否存在
function getProjectEvents(project: ProjectItem, stageId: string): ProjectEvent[] {
  const events: ProjectEvent[] = [];

  // 项目创建 - 总是存在（因为项目已经存在）
  if (stageId === 'received') {
    events.push({
      id: 'project_created',
      name: '项目创建',
      status: 'completed',
      icon: FileText,
    });
  }

  // BP文件上传 - 如果有 sourceFileName 或 uploadedFiles，说明已上传
  if (stageId === 'received' && (project.sourceFileName || project.createdAt)) {
    events.push({
      id: 'bp_uploaded',
      name: 'BP文件上传',
      status: 'completed',
      icon: FileText,
    });
  }

  // BP解析完成 - 如果项目有详细信息（如公司名称、产品等），说明解析完成
  if (stageId === 'received' && (project.companyName || project.coreProduct || project.description)) {
    events.push({
      id: 'bp_extraction_completed',
      name: 'BP解析完成',
      status: 'completed',
      icon: FileCheck,
    });
  }

  // 项目信息更新 - 如果项目有 updatedAt 且与 createdAt 不同，说明有更新
  if ((stageId === 'accepted' || stageId === 'rejected' || stageId === 'initiated') && 
      project.updatedAt && project.updatedAt !== project.createdAt) {
    events.push({
      id: 'project_updated',
      name: '项目信息更新',
      status: 'completed',
      icon: Edit,
    });
  }

  // 项目状态变更 - 如果当前状态不是 received，说明状态已变更
  if ((stageId === 'accepted' || stageId === 'rejected' || stageId === 'initiated') && 
      project.status !== 'received') {
    events.push({
      id: 'status_changed',
      name: '项目状态变更',
      status: 'completed',
      icon: FileCheck,
    });
  }

  // 投资经理添加笔记 - 如果有 managerNote
  if ((stageId === 'accepted' || stageId === 'rejected' || stageId === 'initiated') && 
      project.managerNote) {
    events.push({
      id: 'note_added',
      name: '投资经理添加笔记',
      status: 'completed',
      icon: MessageSquare,
    });
  }

  // 音频文件上传和转写 - 暂时不显示（需要额外的数据字段）
  // audio_uploaded, audios_transcribe

  // 文件删除 - 暂时不显示（需要事件历史记录）
  // file_deleted

  return events;
}

// 根据项目状态生成进度阶段
function getProgressStages(project: ProjectItem): ProgressStage[] {
  const stages: ProgressStage[] = [];
  
  // 第一阶段：待受理（总是显示）
  const receivedEvents = getProjectEvents(project, 'received');
  stages.push({
    id: 'received',
    name: '待受理',
    status: project.status === 'received' ? 'active' : 'completed',
    events: receivedEvents,
  });

  // 第二阶段：根据状态显示"不受理"或"已受理"
  if (project.status === 'rejected') {
    // 不受理
    const rejectedEvents = getProjectEvents(project, 'rejected');
    stages.push({
      id: 'rejected',
      name: '不受理',
      status: 'active',
      events: rejectedEvents,
    });
  } else if (project.status === 'accepted' || project.status === 'initiated') {
    // 已受理
    const acceptedEvents = getProjectEvents(project, 'accepted');
    stages.push({
      id: 'accepted',
      name: '已受理',
      status: project.status === 'accepted' ? 'active' : 'completed',
      events: acceptedEvents,
    });
  }

  // 第三阶段：已立项（只有已立项状态才显示）
  if (project.status === 'initiated') {
    const initiatedEvents = getProjectEvents(project, 'initiated');
    stages.push({
      id: 'initiated',
      name: '已立项',
      status: 'active',
      events: initiatedEvents,
    });
  }

  return stages;
}

// 获取阶段状态的颜色样式
function getStageColorClasses(stage: ProgressStage, isActive: boolean = false): string {
  const statusDisplay = getStatusDisplay(stage.id);
  
  if (!statusDisplay) {
    if (stage.status === 'completed') {
      return isActive 
        ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    } else if (stage.status === 'active') {
      return isActive
        ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-400';
    } else {
      return isActive
        ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  }
  
  // 根据状态类型返回对应的颜色，激活时更深
  switch (stage.id) {
    case 'received':
      return isActive
        ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
        : statusDisplay.color;
    case 'rejected':
      return isActive
        ? 'bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-300'
        : statusDisplay.color;
    case 'accepted':
      return isActive
        ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
        : statusDisplay.color;
    case 'initiated':
      return isActive
        ? 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
        : statusDisplay.color;
    default:
      return statusDisplay.color;
  }
}

// 获取任务状态的颜色样式
function getTaskColorClasses(taskStatus: 'completed' | 'active' | 'pending'): string {
  switch (taskStatus) {
    case 'completed':
      return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
    case 'active':
      return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700';
    case 'pending':
      return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}

export function ProjectProgressLedger({ project }: ProjectProgressLedgerProps) {
  const { uploadedFiles } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 根据项目状态生成进度阶段
  const progressStages = useMemo(() => getProgressStages(project), [project]);
  
  // 默认选中当前状态对应的阶段
  const defaultActiveStage = useMemo(() => {
    const currentStage = progressStages.find(s => s.status === 'active');
    return currentStage?.id || progressStages[0]?.id || 'received';
  }, [progressStages]);

  const [activeStage, setActiveStage] = useState<string>(defaultActiveStage);

  // 当项目状态变化时，更新选中的阶段
  useEffect(() => {
    const currentStage = progressStages.find(s => s.status === 'active');
    const newActiveStage = currentStage?.id || progressStages[0]?.id || 'received';
    setActiveStage(newActiveStage);
  }, [project.status, progressStages]);

  const activeStageData = progressStages.find(s => s.id === activeStage);

  // 根据选择的阶段过滤文件（这里简化处理，实际应该根据文件上传时间或阶段标记）
  const stageFiles = useMemo(() => {
    // 简化：根据阶段ID过滤，实际应该根据文件上传时的阶段标记
    // 暂时返回所有文件，实际应该根据文件所属阶段过滤
    return uploadedFiles;
  }, [uploadedFiles, activeStage]);

  // 搜索过滤
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return stageFiles;
    const query = searchQuery.toLowerCase();
    return stageFiles.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    );
  }, [stageFiles, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // TODO: 实现文件上传逻辑，标记文件所属阶段
    console.log('Upload files for stage:', activeStage, files);
    
    // 重置input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Progress Bar with Tabs */}
      <div className="px-8 py-6 border-b border-border/50 bg-muted/20 flex-shrink-0">
        <Tabs value={activeStage} onValueChange={setActiveStage} className="w-full">
          <TabsList className="w-full justify-start bg-transparent h-auto p-0 mb-4">
            <div className="flex items-center gap-0 overflow-x-auto w-full">
              {progressStages.map((stage, index) => {
                const statusDisplay = getStatusDisplay(stage.id);
                const baseColors = getStageColorClasses(stage, false);
                
                // 为激活状态创建样式类（更深的颜色）
                const getActiveStateClasses = () => {
                  switch (stage.id) {
                    case 'received':
                      return 'data-[state=active]:bg-amber-200 data-[state=active]:text-amber-800 data-[state=active]:dark:bg-amber-900 data-[state=active]:dark:text-amber-300';
                    case 'rejected':
                      return 'data-[state=active]:bg-red-200 data-[state=active]:text-red-800 data-[state=active]:dark:bg-red-900/60 data-[state=active]:dark:text-red-300';
                    case 'accepted':
                      return 'data-[state=active]:bg-emerald-200 data-[state=active]:text-emerald-800 data-[state=active]:dark:bg-emerald-900/50 data-[state=active]:dark:text-emerald-300';
                    case 'initiated':
                      return 'data-[state=active]:bg-blue-200 data-[state=active]:text-blue-800 data-[state=active]:dark:bg-blue-900/50 data-[state=active]:dark:text-blue-300';
                    default:
                      return '';
                  }
                };
                
                return (
                  <div key={stage.id} className="flex items-center flex-shrink-0">
                    <TabsTrigger
                      value={stage.id}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg transition-all border-0 min-w-[140px] justify-center",
                        // 基础颜色（非激活状态）
                        baseColors,
                        // 激活状态：使用更深的颜色，覆盖默认白色背景
                        getActiveStateClasses(),
                        // 确保激活状态不使用默认的白色背景
                        "data-[state=active]:shadow-none",
                        "data-[state=inactive]:opacity-70"
                      )}
                    >
                      {statusDisplay?.icon || (stage.status === 'completed' ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />)}
                      <span className="font-medium whitespace-nowrap">{stage.name}</span>
                    </TabsTrigger>
                    {index < progressStages.length - 1 && (
                      <div className="flex items-center px-4">
                        <div className="flex-1 h-0.5 bg-border/50 mx-2" />
                        <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 h-0.5 bg-border/50 mx-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsList>

          {/* Stage Events */}
          {activeStageData && (
            <TabsContent value={activeStageData.id} className="mt-4 m-0">
              {activeStageData.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">该阶段暂无事件</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {activeStageData.events.map((event) => {
                    const Icon = event.icon || Circle;
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          getTaskColorClasses(event.status)
                        )}
                      >
                        {event.status === 'completed' && <CheckCircle2 className="size-4" />}
                        {event.status === 'active' && <Icon className="size-4" />}
                        {event.status === 'pending' && <Circle className="size-4" />}
                        <span>{event.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
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
            <Button variant="outline" size="sm" className="cursor-pointer">
              刷新
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.csv"
              onChange={handleFileUpload}
            />
            <Button 
              variant="default" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 cursor-pointer"
            >
              <FolderPlus className="size-4" />
              子文件上传
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
                  该阶段暂无文件
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Download className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>下载</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
