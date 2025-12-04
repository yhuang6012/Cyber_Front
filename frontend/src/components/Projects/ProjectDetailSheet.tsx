import { useState, useEffect } from 'react';
import { ProjectItem } from '@/store/useAppStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  Rocket, 
  Hourglass, 
  Pencil, 
  X, 
  Save,
  Building2,
  Users,
  Cpu,
  TrendingUp,
  Wallet,
  Tag,
  User,
  Phone,
  MapPin,
  Briefcase,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Sync when project changes
  useEffect(() => {
    if (project) {
      setEditedProject(project);
      setKeywords(project.keywords?.join(', ') || '');
      setIsEditing(false);
    }
  }, [project]);

  if (!editedProject) return null;

  const handleChange = (field: keyof ProjectItem, value: any) => {
    setEditedProject({ ...editedProject, [field]: value });
  };

  const handleSave = () => {
    const updated = {
      ...editedProject,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    };
    onSave(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setKeywords(project?.keywords?.join(', ') || '');
    setIsEditing(false);
  };

  const getStatusDisplay = (status: ProjectItem['status']) => {
    switch (status) {
      case 'pending':
        return { 
          icon: <Clock className="size-4" />, 
          label: '未受理', 
          color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
          hoverColor: 'hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200'
        };
      case 'pending_acceptance':
        return { 
          icon: <Hourglass className="size-4" />, 
          label: '待受理', 
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-400',
          hoverColor: 'hover:bg-amber-200 hover:text-amber-800 dark:hover:bg-amber-900 dark:hover:text-amber-300'
        };
      case 'accepted':
        return { 
          icon: <CheckCircle2 className="size-4" />, 
          label: '已受理', 
          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          hoverColor: 'hover:bg-emerald-200 hover:text-emerald-800 dark:hover:bg-emerald-900 dark:hover:text-emerald-300'
        };
      case 'established':
        return { 
          icon: <Rocket className="size-4" />, 
          label: '已立项', 
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          hoverColor: 'hover:bg-blue-200 hover:text-blue-800 dark:hover:bg-blue-900 dark:hover:text-blue-300'
        };
    }
  };

  const currentStatus = getStatusDisplay(editedProject.status);

  // Section component for consistent styling
  const Section = ({ 
    icon: Icon, 
    title, 
    children 
  }: { 
    icon: React.ElementType; 
    title: string; 
    children: React.ReactNode;
  }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2.5 text-foreground/80 ml-0.5">
        <Icon className="size-4 text-primary" />
        <h3 className="font-bold text-lg tracking-wide uppercase">{title}</h3>
      </div>
      <div className="pl-1">
        {children}
      </div>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-7xl sm:!max-w-7xl w-[98vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/50 bg-gradient-to-r from-background via-background to-muted/20">
          <div className="space-y-4">
            {/* First Row: Project Name, Status Badge (view mode), and Edit Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Project Name */}
                {isEditing ? (
                  <Input
                    value={editedProject.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="text-2xl font-bold h-auto py-2 px-3 border-dashed flex-1"
                    placeholder="项目名称"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {editedProject.name}
                  </h1>
                )}
                
                {/* Status Badge - only show in view mode, next to project name */}
                {!isEditing && (
                  <Badge className={`${currentStatus.color} ${currentStatus.hoverColor} border-0 gap-1.5 px-3 py-1 flex-shrink-0 transition-colors [&_svg]:transition-colors`}>
                    {currentStatus.icon}
                    {currentStatus.label}
                  </Badge>
                )}
                
                {/* Status Select - only show in edit mode */}
                {isEditing && (
                  <Select
                    value={editedProject.status}
                    onValueChange={(value) => handleChange('status', value as ProjectItem['status'])}
                  >
                    <SelectTrigger className={`w-fit gap-2 h-8 rounded-full border-none text-xs font-medium ${currentStatus.color} flex-shrink-0 cursor-pointer`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-none">
                      <SelectItem value="pending" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4" />
                          未受理
                        </div>
                      </SelectItem>
                      <SelectItem value="pending_acceptance" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Hourglass className="size-4 text-amber-600" />
                          待受理
                        </div>
                      </SelectItem>
                      <SelectItem value="accepted" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-green-600" />
                          已受理
                        </div>
                      </SelectItem>
                      <SelectItem value="established" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Rocket className="size-4 text-blue-600" />
                          已立项
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div 
                      key="editing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2"
                    >
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={handleSave}
                        className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <Save className="size-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={handleCancel}
                        className="h-9 w-9 bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                      >
                        <X className="size-4" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="viewing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2"
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsEditing(true)}
                        className="h-9 w-9 rounded-full cursor-pointer"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onOpenChange(false)}
                        className="h-9 w-9 rounded-full cursor-pointer"
                      >
                        <X className="size-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Second Row: Description */}
            {isEditing ? (
              <Textarea
                value={editedProject.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="min-h-[60px] text-sm border-dashed resize-none"
                placeholder="项目简介..."
              />
            ) : (
              editedProject.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {editedProject.description}
                </p>
              )
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-8 py-8 space-y-10">
            {/* Contact Info */}
            <Section icon={User} title="联系信息">
              {isEditing ? (
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">投资经理</Label>
                    <Input
                      value={editedProject.uploader || ''}
                      onChange={(e) => handleChange('uploader', e.target.value)}
                      placeholder="输入上传人..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">项目联系人</Label>
                      <Input
                        value={editedProject.projectContact || ''}
                        onChange={(e) => handleChange('projectContact', e.target.value)}
                        placeholder="输入联系人..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">联系方式</Label>
                      <Input
                        value={editedProject.contactInfo || ''}
                        onChange={(e) => handleChange('contactInfo', e.target.value)}
                        placeholder="电话 / 邮箱"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3" /> 投资经理
                    </span>
                    <p className="text-base ml-1">{editedProject.uploader || <span className="text-muted-foreground/60 italic">暂无</span>}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <User className="size-3" /> 联系人
                    </span>
                    <p className="text-base ml-1">{editedProject.projectContact || <span className="text-muted-foreground/60 italic">暂无</span>}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Phone className="size-3" /> 联系方式
                    </span>
                    <p className="text-base ml-1">{editedProject.contactInfo || <span className="text-muted-foreground/60 italic">暂无</span>}</p>
                  </div>
                </div>
              )}
            </Section>

            {/* Company Info */}
            <Section icon={Building2} title="公司信息">
              {isEditing ? (
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">公司名称</Label>
                    <Input
                      value={editedProject.companyName || ''}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="输入公司名称..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">公司地址</Label>
                    <Input
                      value={editedProject.companyAddress || ''}
                      onChange={(e) => handleChange('companyAddress', e.target.value)}
                      placeholder="输入公司地址..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">所属行业</Label>
                    <Input
                      value={editedProject.industry || ''}
                      onChange={(e) => handleChange('industry', e.target.value)}
                      placeholder="例如：人工智能 / 工业自动化"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-medium text-base mb-1">
                      {editedProject.companyName || <span className="text-muted-foreground/60 italic">公司名称未填写</span>}
                    </h4>
                    {editedProject.industry && (
                      <Badge variant="outline" className="text-xs mt-2">
                        <Briefcase className="size-3 mr-1" />
                        {editedProject.industry}
                      </Badge>
                    )}
                  </div>
                  {editedProject.companyAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                      <span>{editedProject.companyAddress}</span>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Team */}
            <Section icon={Users} title="核心团队">
              {editedProject.coreTeam && Array.isArray(editedProject.coreTeam) && editedProject.coreTeam.length > 0 ? (
                <div className="grid gap-3">
                  {editedProject.coreTeam.map((member, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/20 border border-border/50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {member.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-sm">{member.name}</span>
                          {member.role && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {member.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {member.background && (
                        <p className="text-xs text-muted-foreground leading-relaxed pl-13">
                          {member.background}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic py-4">暂无核心团队信息</p>
              )}
            </Section>

            {/* Core Product & Technology */}
            <Section icon={Cpu} title="产品与技术">
              {isEditing ? (
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">核心产品</Label>
                    <Textarea
                      value={editedProject.coreProduct || ''}
                      onChange={(e) => handleChange('coreProduct', e.target.value)}
                      className="min-h-[100px] resize-none"
                      placeholder="描述核心产品..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">核心技术</Label>
                    <Textarea
                      value={editedProject.coreTechnology || ''}
                      onChange={(e) => handleChange('coreTechnology', e.target.value)}
                      className="min-h-[100px] resize-none"
                      placeholder="描述核心技术..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">核心产品</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {editedProject.coreProduct || <span className="text-muted-foreground/60 italic">暂无信息</span>}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">核心技术</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {editedProject.coreTechnology || <span className="text-muted-foreground/60 italic">暂无信息</span>}
                    </p>
                  </div>
                </div>
              )}
            </Section>

            {/* Market & Competition */}
            <Section icon={TrendingUp} title="市场与竞争">
              {isEditing ? (
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">竞争分析</Label>
                    <Textarea
                      value={editedProject.competitionAnalysis || ''}
                      onChange={(e) => handleChange('competitionAnalysis', e.target.value)}
                      className="min-h-[100px] resize-none"
                      placeholder="描述竞争分析..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">市场空间</Label>
                    <Textarea
                      value={editedProject.marketSize || ''}
                      onChange={(e) => handleChange('marketSize', e.target.value)}
                      className="min-h-[100px] resize-none"
                      placeholder="描述市场空间..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">竞争分析</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {editedProject.competitionAnalysis || <span className="text-muted-foreground/60 italic">暂无竞争分析信息</span>}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">市场空间</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {editedProject.marketSize || <span className="text-muted-foreground/60 italic">暂无市场空间信息</span>}
                    </p>
                  </div>
                </div>
              )}
            </Section>

            {/* Finance */}
            <Section icon={Wallet} title="财务与融资">
              <div className="space-y-6">
                {/* Financial Status */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">财务情况</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {editedProject.financialStatus?.current && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">当前状况</span>
                        <p className="text-sm mt-2 leading-relaxed">{editedProject.financialStatus.current}</p>
                      </div>
                    )}
                    {editedProject.financialStatus?.future && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">未来计划</span>
                        <p className="text-sm mt-2 leading-relaxed">{editedProject.financialStatus.future}</p>
                      </div>
                    )}
                    {!editedProject.financialStatus?.current && !editedProject.financialStatus?.future && (
                      <p className="text-sm text-muted-foreground/60 italic">暂无财务情况信息</p>
                    )}
                  </div>
                </div>

                {/* Financing History */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">融资历史</h4>
                  <div className="space-y-4">
                    {editedProject.financingHistory?.current_funding_need && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          本轮融资需求
                        </span>
                        <p className="text-lg font-bold mt-1 text-blue-700 dark:text-blue-300">
                          {editedProject.financingHistory.current_funding_need}
                        </p>
                      </div>
                    )}
                    
                    {editedProject.financingHistory?.funding_use && editedProject.financingHistory.funding_use.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">资金用途</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editedProject.financingHistory.funding_use.map((use, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {use}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {editedProject.financingHistory?.completed_rounds && editedProject.financingHistory.completed_rounds.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">已完成融资轮次</span>
                        <div className="mt-2 space-y-2">
                          {editedProject.financingHistory.completed_rounds.map((round, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                              {round.round && (
                                <Badge variant="secondary" className="text-xs font-semibold">
                                  {round.round}
                                </Badge>
                              )}
                              {round.amount && <span className="text-sm font-medium">{round.amount}</span>}
                              {round.date && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {round.date}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!editedProject.financingHistory?.current_funding_need && 
                     !editedProject.financingHistory?.funding_use?.length && 
                     !editedProject.financingHistory?.completed_rounds?.length && (
                      <p className="text-sm text-muted-foreground/60 italic">暂无融资历史信息</p>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* Keywords */}
            <Section icon={Tag} title="关键词">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="输入关键词，用逗号分隔..."
                    className="text-sm"
                  />
                  {keywords && (
                    <div className="flex flex-wrap gap-2">
                      {keywords.split(',').map((kw, idx) => {
                        const trimmed = kw.trim();
                        if (!trimmed) return null;
                        return (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {trimmed}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editedProject.keywords && editedProject.keywords.length > 0 ? (
                    editedProject.keywords.map((kw, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-xs px-3 py-1 bg-muted/30"
                      >
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">暂无关键词</p>
                  )}
                </div>
              )}
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
