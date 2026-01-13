import { ProjectItem } from '@/store/useAppStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Users,
  Cpu,
  TrendingUp,
  Wallet,
  User,
  Phone,
  MapPin,
  Briefcase,
  UserCircle,
  Link,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AiSummarySection } from './AiSummarySection';
import { ProjectCommentsSection } from './ProjectCommentsSection';

interface ProjectDetailBodyProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
}

// Section component for consistent styling
const Section = ({ 
  icon: Icon, 
  title, 
  children,
  hideTitle = false
}: { 
  icon: React.ElementType | null; 
  title: string; 
  children: React.ReactNode;
  hideTitle?: boolean;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4"
  >
    {!hideTitle && (
      <div className="flex items-center gap-2.5 text-foreground/80">
        {Icon && <Icon className="size-4 text-primary" />}
        <h3 className="font-bold text-lg tracking-wide uppercase">{title}</h3>
      </div>
    )}
    <div className={hideTitle ? "" : "pl-1"}>
      {children}
    </div>
  </motion.div>
);

export function ProjectDetailBody({
  editedProject,
  isEditing,
  onFieldChange,
}: ProjectDetailBodyProps) {
  return (
    <div className="px-6 py-6 space-y-8">
      {/* AI Summary */}
      <Section icon={null} title="" hideTitle>
        <AiSummarySection project={editedProject} />
      </Section>

      {/* Project Role & Contact Info - Single Row */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Project Role */}
        <Section icon={Briefcase} title="项目角色">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">投资经理</Label>
                <Input
                  value={editedProject.uploader || ''}
                  onChange={(e) => onFieldChange('uploader', e.target.value)}
                  placeholder="输入投资经理..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">项目来源</Label>
                <Input
                  value={editedProject.projectSource || ''}
                  onChange={(e) => onFieldChange('projectSource', e.target.value)}
                  placeholder="输入项目来源..."
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <UserCircle className="size-3" /> 投资经理
                </span>
                <p className="text-base ml-1">{editedProject.uploader || <span className="text-muted-foreground/60 italic">暂无</span>}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Link className="size-3" /> 项目来源
                </span>
                <p className="text-base ml-1">{editedProject.projectSource || <span className="text-muted-foreground/60 italic">暂无</span>}</p>
              </div>
            </div>
          )}
        </Section>

        {/* Contact Info */}
        <Section icon={User} title="对接信息">
          {isEditing ? (
            <div className="grid gap-5">
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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3" /> 项目联系人
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
      </div>

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
              <Label className="text-xs text-muted-foreground">所属行业（一级）</Label>
              <Input
                value={editedProject.industry || ''}
                onChange={(e) => onFieldChange('industry', e.target.value)}
                placeholder="例如：人工智能"
              />
            </div>
            {editedProject.industry_secondary && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">行业（二级）</Label>
                <Input
                  value={editedProject.industry_secondary || ''}
                  onChange={(e) => onFieldChange('industry_secondary', e.target.value)}
                  placeholder="二级行业分类"
                />
              </div>
            )}
            {editedProject.industry_tertiary && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">行业（三级）</Label>
                <Input
                  value={editedProject.industry_tertiary || ''}
                  onChange={(e) => onFieldChange('industry_tertiary', e.target.value)}
                  placeholder="三级行业分类"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <h4 className="font-medium text-base mb-1">
                {editedProject.companyName || <span className="text-muted-foreground/60 italic">公司名称未填写</span>}
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {editedProject.industry && (
                  <Badge variant="outline" className="text-xs">
                    <Briefcase className="size-3 mr-1" />
                    {editedProject.industry}
                  </Badge>
                )}
                {editedProject.industry_secondary && (
                  <Badge variant="outline" className="text-xs">
                    {editedProject.industry_secondary}
                  </Badge>
                )}
                {editedProject.industry_tertiary && (
                  <Badge variant="outline" className="text-xs">
                    {editedProject.industry_tertiary}
                  </Badge>
                )}
              </div>
              {editedProject.one_liner && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {editedProject.one_liner}
                </p>
              )}
            </div>
            {editedProject.companyAddress && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                <span>{editedProject.companyAddress}</span>
              </div>
            )}
            {(editedProject.project_stage || editedProject.region) && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {editedProject.project_stage && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">项目阶段</span>
                    <p>{editedProject.project_stage}</p>
                  </div>
                )}
                {editedProject.region && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">区域</span>
                    <p>{editedProject.region}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Team */}
      <Section icon={Users} title="核心团队">
        {editedProject.core_team ? (
          <div className="space-y-4">
            {/* 团队描述 */}
            {editedProject.core_team.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.core_team.description}</p>
              </div>
            )}
            
            {/* AI 分析 */}
            {editedProject.core_team.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-medium text-primary uppercase tracking-wider">AI 分析</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {editedProject.core_team.ai_analysis}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic py-4">暂无核心团队信息</p>
        )}
      </Section>

      {/* Product */}
      {editedProject.product && (
        <Section icon={Cpu} title="产品">
          <div className="space-y-4">
            {editedProject.product.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.product.description}</p>
              </div>
            )}
            {editedProject.product.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-medium text-primary uppercase tracking-wider">AI 分析</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {editedProject.product.ai_analysis}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Technology */}
      {editedProject.technology && (
        <Section icon={Cpu} title="技术">
          <div className="space-y-4">
            {editedProject.technology.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.technology.description}</p>
              </div>
            )}
            {editedProject.technology.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-medium text-primary uppercase tracking-wider">AI 分析</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {editedProject.technology.ai_analysis}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Market */}
      {editedProject.market && (
        <Section icon={TrendingUp} title="市场">
          <div className="space-y-4">
            {editedProject.market.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.market.description}</p>
              </div>
            )}
            {editedProject.market.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-medium text-primary uppercase tracking-wider">AI 分析</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {editedProject.market.ai_analysis}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Competition */}
      {editedProject.competition && (
        <Section icon={TrendingUp} title="竞争">
          <div className="space-y-4">
            {editedProject.competition.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.competition.description}</p>
              </div>
            )}
            {editedProject.competition.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-medium text-primary uppercase tracking-wider">AI 分析</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {editedProject.competition.ai_analysis}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Financial Status */}
      {editedProject.financial_status && (
        <Section icon={Wallet} title="财务情况">
          <div className="space-y-4">
            {editedProject.financial_status.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.financial_status.description}</p>
              </div>
            )}
            {editedProject.financial_status.ai_analysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-xs font-medium text-primary uppercase tracking-wider">AI 分析</h4>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {editedProject.financial_status.ai_analysis}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Financing History */}
      {editedProject.financing_history && editedProject.financing_history.description && (
        <Section icon={Wallet} title="融资历史">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.financing_history.description}</p>
          </div>
        </Section>
      )}

      {/* Highlights */}
      {editedProject.highlights && (
        <Section icon={TrendingUp} title="项目亮点">
          <div className="grid md:grid-cols-2 gap-4">
            {editedProject.highlights.talent && editedProject.highlights.talent.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">人才亮点</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {editedProject.highlights.talent.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {editedProject.highlights.technology && editedProject.highlights.technology.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">技术亮点</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {editedProject.highlights.technology.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {editedProject.highlights.industry && editedProject.highlights.industry.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <h4 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">行业亮点</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {editedProject.highlights.industry.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {editedProject.highlights.financing && editedProject.highlights.financing.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <h4 className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">融资亮点</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {editedProject.highlights.financing.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Awards */}
      {editedProject.awards && editedProject.awards.length > 0 && (
        <Section icon={TrendingUp} title="奖项">
          <div className="grid md:grid-cols-2 gap-3">
            {editedProject.awards.map((award, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                {typeof award === 'string' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-medium">{award}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm font-medium">{award.award_name}</span>
                    </div>
                    {(award.issuer || award.year) && (
                      <div className="text-xs text-muted-foreground ml-7">
                        {award.issuer}
                        {award.issuer && award.year && ' · '}
                        {award.year}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Project Comments - At the bottom */}
      <Section icon={null} title="" hideTitle>
        <ProjectCommentsSection projectId={editedProject.id} />
      </Section>
    </div>
  );
}
