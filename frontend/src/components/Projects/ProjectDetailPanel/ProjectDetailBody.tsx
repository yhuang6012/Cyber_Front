import { ProjectItem } from '@/store/useAppStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
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
import { motion } from 'framer-motion';

interface ProjectDetailBodyProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  keywords: string;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
  onKeywordsChange: (value: string) => void;
}

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
    <div className="flex items-center gap-2.5 text-foreground/80">
      <Icon className="size-4 text-primary" />
      <h3 className="font-bold text-lg tracking-wide uppercase">{title}</h3>
    </div>
    <div className="pl-1">
      {children}
    </div>
  </motion.div>
);

export function ProjectDetailBody({
  editedProject,
  isEditing,
  keywords,
  onFieldChange,
  onKeywordsChange,
}: ProjectDetailBodyProps) {
  return (
    <div className="px-8 py-8 space-y-10">
      {/* Manager Note */}
      <Section icon={FileText} title="投资经理笔记">
        {isEditing ? (
          <Textarea
            value={editedProject.managerNote || ''}
            onChange={(e) => onFieldChange('managerNote', e.target.value)}
            className="min-h-[120px] resize-none"
            placeholder="记录受理判断、尽调要点、沟通反馈等..."
          />
        ) : (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {editedProject.managerNote?.trim() ? editedProject.managerNote : <span className="text-muted-foreground/60 italic">暂无笔记</span>}
            </p>
          </div>
        )}
      </Section>

      {/* Contact Info */}
      <Section icon={User} title="联系信息">
        {isEditing ? (
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">投资经理</Label>
              <Input
                value={editedProject.uploader || ''}
                onChange={(e) => onFieldChange('uploader', e.target.value)}
                placeholder="输入上传人..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">项目联系人</Label>
                <Input
                  value={editedProject.projectContact || ''}
                  onChange={(e) => onFieldChange('projectContact', e.target.value)}
                  placeholder="输入联系人..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">联系方式</Label>
                <Input
                  value={editedProject.contactInfo || ''}
                  onChange={(e) => onFieldChange('contactInfo', e.target.value)}
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
                onChange={(e) => onFieldChange('companyName', e.target.value)}
                placeholder="输入公司名称..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">公司地址</Label>
              <Input
                value={editedProject.companyAddress || ''}
                onChange={(e) => onFieldChange('companyAddress', e.target.value)}
                placeholder="输入公司地址..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">所属行业</Label>
              <Input
                value={editedProject.industry || ''}
                onChange={(e) => onFieldChange('industry', e.target.value)}
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
                onChange={(e) => onFieldChange('coreProduct', e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="描述核心产品..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">核心技术</Label>
              <Textarea
                value={editedProject.coreTechnology || ''}
                onChange={(e) => onFieldChange('coreTechnology', e.target.value)}
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
                onChange={(e) => onFieldChange('competitionAnalysis', e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="描述竞争分析..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">市场空间</Label>
              <Textarea
                value={editedProject.marketSize || ''}
                onChange={(e) => onFieldChange('marketSize', e.target.value)}
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
              onChange={(e) => onKeywordsChange(e.target.value)}
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
  );
}
