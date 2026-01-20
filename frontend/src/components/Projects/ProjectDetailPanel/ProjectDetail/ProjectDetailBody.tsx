import { ProjectItem } from '@/store/useAppStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  Sparkles,
  CheckCircle2,
  Calendar,
  Hash,
  Scale
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AiSummarySection } from './AiSummarySection';
import { ProjectCommentsSection } from './ProjectCommentsSection';

interface ProjectDetailBodyProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
  hideComments?: boolean; // 是否隐藏评论区（用于受理单等场景）
}

// Section component for consistent styling
const Section = ({ 
  id,
  icon: Icon, 
  title, 
  children,
  hideTitle = false,
  pageIdx
}: { 
  id?: string;
  icon: React.ElementType | null; 
  title: string; 
  children: React.ReactNode;
  hideTitle?: boolean;
  pageIdx?: string;
}) => (
  <motion.div 
    id={id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4 scroll-mt-4"
  >
    {!hideTitle && (
      <div className="flex items-center gap-2.5 text-foreground/80">
        {Icon && <Icon className="size-4 text-primary" />}
        <h3 className="font-bold text-lg tracking-wide uppercase">{title}</h3>
        {pageIdx && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50 text-muted-foreground border-muted-foreground/20 font-mono">
            P.{pageIdx}
          </Badge>
        )}
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
  hideComments = false,
}: ProjectDetailBodyProps) {
  console.log('[ProjectDetailBody] 渲染中，editedProject:', editedProject);
  console.log('[ProjectDetailBody] company 数据:', editedProject.company);
  console.log('[ProjectDetailBody] company 是否存在:', !!editedProject.company);
  
  return (
    <div className="space-y-8">
      {/* AI Summary */}
      <Section id="ai-summary" icon={null} title="" hideTitle>
        <AiSummarySection project={editedProject} />
      </Section>

      {/* Project Role & Contact Info - Single Row */}
      <div id="project-role" className="grid md:grid-cols-2 gap-8 scroll-mt-4">
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
        <Section id="contact-info" icon={User} title="对接信息">
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
      <Section 
        id="company-info" 
        icon={Building2} 
        title="公司信息"
        pageIdx={editedProject.field_page_idx?.company_name}
      >
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
            
            {/* External Business Registration Basic Info */}
            {editedProject.company && (
              <Card className="p-5 bg-gradient-to-br from-emerald-50/50 to-green-50/50 border-emerald-200/50">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    工商注册信息
                  </h4>
                  
                  {/* Company Name Comparison */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">BP 中的公司名称</span>
                      </div>
                      <p className="text-sm pl-6">{editedProject.companyName || <span className="text-muted-foreground/60 italic">未填写</span>}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">工商注册名称</span>
                      </div>
                      <p className="text-sm pl-6 font-medium">{editedProject.company.company_name}</p>
                    </div>
                  </div>

                  {/* Legal Representative & Credit Code */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {editedProject.company.legal_representative && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Scale className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">法定代表人</span>
                        </div>
                        <p className="text-sm pl-5">{editedProject.company.legal_representative}</p>
                      </div>
                    )}
                    {editedProject.company.credit_code && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Hash className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">统一社会信用代码</span>
                        </div>
                        <p className="text-xs pl-5 font-mono text-muted-foreground">{editedProject.company.credit_code}</p>
                      </div>
                    )}
                  </div>

                  {/* Registered Capital & Establish Time */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {editedProject.company.registered_capital && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">注册资本</span>
                        </div>
                        <p className="text-sm pl-5">{editedProject.company.registered_capital}</p>
                      </div>
                    )}
                    {editedProject.company.establish_time && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">成立时间</span>
                        </div>
                        <p className="text-sm pl-5">{editedProject.company.establish_time}</p>
                      </div>
                    )}
                  </div>

                  {/* Industry & Region Comparison */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {(editedProject.industry || editedProject.company.industry) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">行业</span>
                        </div>
                        <div className="pl-5 space-y-1">
                          {editedProject.industry && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">BP:</span>
                              <Badge variant="outline" className="text-xs">{editedProject.industry}</Badge>
                            </div>
                          )}
                          {editedProject.company.industry && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-600 font-medium">工商:</span>
                              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">{editedProject.company.industry}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {(editedProject.region || editedProject.company.region) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">区域</span>
                        </div>
                        <div className="pl-5 space-y-1">
                          {editedProject.region && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">BP:</span>
                              <span className="text-sm">{editedProject.region}</span>
                            </div>
                          )}
                          {editedProject.company.region && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-600 font-medium">工商:</span>
                              <span className="text-sm font-medium">{editedProject.company.region}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </Section>

      {/* External Business Registration Info (if matched) */}
      {editedProject.company && editedProject.company.shareholders && editedProject.company.shareholders.length > 0 && (
        <Section id="external-company-info" icon={CheckCircle2} title="工商信息 - 补充数据">
          <div className="space-y-6">
            {/* Shareholders */}
            {editedProject.company.shareholders && editedProject.company.shareholders.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50">
                <h4 className="text-sm font-semibold text-amber-700 mb-3">股东信息</h4>
                <div className="space-y-2">
                  {editedProject.company.shareholders.map((shareholder: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/60 border border-amber-200/30">
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-amber-600 flex-shrink-0" />
                        <span className="font-medium text-sm">{shareholder.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-amber-700">{shareholder.share_percent}</div>
                        <div className="text-xs text-muted-foreground">{shareholder.capital}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </Section>
      )}

      {/* Team */}
      <Section 
        id="core-team" 
        icon={Users} 
        title="核心团队"
        pageIdx={editedProject.field_page_idx?.core_team}
      >
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
            
            {/* External Business Registration Core Team */}
            {editedProject.company && editedProject.company.core_team && editedProject.company.core_team.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-200/50">
                <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  工商数据源核心团队
                </h4>
                <div className="space-y-2">
                  {editedProject.company.core_team.map((member: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded bg-white/60">
                      <UserCircle className="size-5 text-purple-600 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-sm">{member.name}</span>
                        {member.positions && member.positions.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {member.positions.join('、')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic py-4">暂无核心团队信息</p>
        )}
      </Section>

      {/* Product */}
      {editedProject.product && (
        <Section 
          id="product" 
          icon={Cpu} 
          title="产品"
          pageIdx={editedProject.field_page_idx?.product}
        >
          <div className="space-y-4">
            {editedProject.product.core_product && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">核心产品</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.product.core_product}
                </p>
              </div>
            )}
            
            {editedProject.product.product_form && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">产品形态</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.product.product_form}
                </p>
              </div>
            )}
            
            {editedProject.product.key_specs && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">关键指标</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.product.key_specs}
                </p>
              </div>
            )}
            
            {editedProject.product.application_scenarios && editedProject.product.application_scenarios.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">应用场景</h4>
                <div className="flex flex-wrap gap-2">
                  {editedProject.product.application_scenarios.map((scenario, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {scenario}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
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
        <Section 
          id="technology" 
          icon={Cpu} 
          title="技术"
          pageIdx={editedProject.field_page_idx?.technology}
        >
          <div className="space-y-4">
            {editedProject.technology.technical_approach && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">技术路线</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.technology.technical_approach}
                </p>
              </div>
            )}
            
            {editedProject.technology.core_barriers && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">核心壁垒</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.technology.core_barriers}
                </p>
              </div>
            )}
            
            {editedProject.technology.ip_status && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">知识产权状态</h4>
                {typeof editedProject.technology.ip_status === 'string' ? (
                  <p className="text-sm pl-4">{editedProject.technology.ip_status}</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3 pl-4">
                    {editedProject.technology.ip_status.patents_cn && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50/50 to-blue-100/50 border border-blue-200/50">
                        <p className="text-xs font-medium text-blue-700 mb-1">🇨🇳 中国专利</p>
                        <p className="text-sm">{editedProject.technology.ip_status.patents_cn}</p>
                      </div>
                    )}
                    {editedProject.technology.ip_status.patents_us && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50/50 to-purple-100/50 border border-purple-200/50">
                        <p className="text-xs font-medium text-purple-700 mb-1">🇺🇸 美国专利</p>
                        <p className="text-sm">{editedProject.technology.ip_status.patents_us}</p>
                      </div>
                    )}
                    {editedProject.technology.ip_status.patents_pct && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-green-50/50 to-green-100/50 border border-green-200/50">
                        <p className="text-xs font-medium text-green-700 mb-1">🌍 PCT专利</p>
                        <p className="text-sm">{editedProject.technology.ip_status.patents_pct}</p>
                      </div>
                    )}
                    {editedProject.technology.ip_status.other && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50/50 to-gray-100/50 border border-gray-200/50">
                        <p className="text-xs font-medium text-gray-700 mb-1">📋 其他</p>
                        <p className="text-sm">{editedProject.technology.ip_status.other}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {editedProject.technology.papers && Array.isArray(editedProject.technology.papers) && editedProject.technology.papers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">学术论文</h4>
                <div className="space-y-2 pl-4">
                  {editedProject.technology.papers.map((paper, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-gradient-to-br from-indigo-50/50 to-indigo-100/50 border border-indigo-200/50">
                      {typeof paper === 'string' ? (
                        <p className="text-sm">{paper}</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{paper.title}</p>
                          {(paper.journal || paper.year) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {paper.journal}{paper.journal && paper.year ? ', ' : ''}{paper.year}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
        <Section 
          id="market" 
          icon={TrendingUp} 
          title="市场"
          pageIdx={editedProject.field_page_idx?.market}
        >
          <div className="space-y-4">
            {editedProject.market.target_market && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">目标市场</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.market.target_market}
                </p>
              </div>
            )}
            
            {editedProject.market.market_size && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">市场规模</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.market.market_size}
                </p>
              </div>
            )}
            
            {editedProject.market.key_drivers && editedProject.market.key_drivers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">关键驱动因素</h4>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {editedProject.market.key_drivers.map((driver, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
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
        <Section 
          id="competition" 
          icon={TrendingUp} 
          title="竞争"
          pageIdx={editedProject.field_page_idx?.competition}
        >
          <div className="space-y-4">
            {editedProject.competition.main_competitors && editedProject.competition.main_competitors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">主要竞争对手</h4>
                <div className="flex flex-wrap gap-2">
                  {editedProject.competition.main_competitors.map((competitor, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {competitor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {editedProject.competition.differentiation && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">差异化优势</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.competition.differentiation}
                </p>
              </div>
            )}
            
            {editedProject.competition.competitive_comparison && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">竞争对比</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.competition.competitive_comparison}
                </p>
              </div>
            )}
            
            {editedProject.competition.avoidance_strategy && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">规避策略</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.competition.avoidance_strategy}
                </p>
              </div>
            )}
            
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
        <Section 
          id="financial" 
          icon={Wallet} 
          title="财务情况"
          pageIdx={editedProject.field_page_idx?.financial_status}
        >
          <div className="space-y-4">
            {editedProject.financial_status.current_metrics && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">当前指标</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.financial_status.current_metrics}
                </p>
              </div>
            )}
            
            {editedProject.financial_status.future_projection && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">未来预测</h4>
                <p className="text-sm leading-relaxed pl-4 border-l-2 border-primary/50">
                  {editedProject.financial_status.future_projection}
                </p>
              </div>
            )}
            
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
      {editedProject.financing_history && (
        <Section 
          id="financing" 
          icon={Wallet} 
          title="融资历史"
          pageIdx={editedProject.field_page_idx?.financing_history}
        >
          <div className="space-y-4">
            {(editedProject.financing_history.current_round || editedProject.financing_history.funding_amount) && (
              <div className="grid md:grid-cols-2 gap-4">
                {editedProject.financing_history.current_round && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 border border-emerald-200/50">
                    <h4 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">当前轮次</h4>
                    <p className="text-sm font-semibold">{editedProject.financing_history.current_round}</p>
                  </div>
                )}
                {editedProject.financing_history.funding_amount && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/50 border border-blue-200/50">
                    <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">融资金额</h4>
                    <p className="text-sm font-semibold">{editedProject.financing_history.funding_amount}</p>
                  </div>
                )}
              </div>
            )}
            
            {editedProject.financing_history.funding_use && editedProject.financing_history.funding_use.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">资金用途</h4>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {editedProject.financing_history.funding_use.map((use, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {use}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {editedProject.financing_history.completed_rounds && editedProject.financing_history.completed_rounds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">历史轮次</h4>
                <div className="space-y-3 pl-4">
                  {editedProject.financing_history.completed_rounds.map((round, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{round.round}</span>
                        {round.date && <span className="text-xs text-muted-foreground">{round.date}</span>}
                      </div>
                      {round.amount && (
                        <p className="text-sm text-muted-foreground mb-1">{round.amount}</p>
                      )}
                      {round.investors && round.investors.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          投资方：{round.investors.join('、')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {editedProject.financing_history.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{editedProject.financing_history.description}</p>
              </div>
            )}
            
            {/* External Business Registration Financing History */}
            {editedProject.company && editedProject.company.financing_history && editedProject.company.financing_history.length > 0 && (
              <Card className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200/50">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  工商数据源融资历史
                </h4>
                <div className="space-y-3">
                  {editedProject.company.financing_history.map((round: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/60 border border-blue-200/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm">{round.round}</span>
                          {round.amount && <span className="text-sm text-muted-foreground ml-2">· {round.amount}</span>}
                        </div>
                        {round.pub_time && (
                          <span className="text-xs text-muted-foreground">{round.pub_time}</span>
                        )}
                      </div>
                      {round.investors && round.investors.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          投资方：{round.investors.join('、')}
                        </div>
                      )}
                      {round.source && (
                        <div className="text-xs text-muted-foreground/60 mt-1">
                          数据来源：{round.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
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
      {!hideComments && (
        <Section id="comments" icon={null} title="" hideTitle>
          <ProjectCommentsSection projectId={editedProject.id} />
        </Section>
      )}
    </div>
  );
}
