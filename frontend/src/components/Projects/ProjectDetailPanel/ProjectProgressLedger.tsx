import { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectItem, useAppStore } from '@/store/useAppStore';
import { CheckCircle2, Circle, FileText, FolderPlus, Download, Trash2, FileCheck, Edit, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

  // 投资经理添加笔记 - 如果有 description
  if ((stageId === 'accepted' || stageId === 'rejected' || stageId === 'initiated') && 
      project.description) {
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

  // 根据项目状态确定每个步骤的状态
  const getStepStatus = (stepIndex: number) => {
    const status = project.status;
    
    if (status === 'rejected') {
      // 不受理：待受理完成，受理显示"不受理"（红色），立项未到达
      return {
        0: 'completed', // 待受理
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
    { id: 'received', label: '待受理' },
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
        // 待受理：琥珀色
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
    const stage = progressStages.find(s => s.id === stepId);
    if (stage) {
      setActiveStage(stage.id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Chevron Progress Bar */}
      <div className="px-8 py-3 border-b border-border/50 bg-muted/20 flex-shrink-0">
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
        
        {/* Stage Events - 显示当前选中阶段的事件 */}
        <div className="w-full mt-3 pt-2">
          {activeStageData && (
            activeStageData.events.length === 0 ? (
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
            )
          )}
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
