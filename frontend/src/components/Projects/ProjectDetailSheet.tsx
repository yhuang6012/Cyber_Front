import { useState } from 'react';
import { ProjectItem } from '@/store/useAppStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Rocket } from 'lucide-react';

interface ProjectDetailSheetProps {
  project: ProjectItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: ProjectItem) => void;
}

export function ProjectDetailSheet({ project, open, onOpenChange, onSave }: ProjectDetailSheetProps) {
  const [editedProject, setEditedProject] = useState<ProjectItem | null>(project);
  const [keywords, setKeywords] = useState<string>('');

  // Sync when project changes
  if (project && project.id !== editedProject?.id) {
    setEditedProject(project);
    setKeywords(project.keywords?.join(', ') || '');
  }

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
    onOpenChange(false);
  };

  const getStatusDisplay = (status: 'pending' | 'accepted' | 'established') => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="size-4" />, label: '未受理', color: 'text-muted-foreground' };
      case 'accepted':
        return { icon: <CheckCircle2 className="size-4" />, label: '已受理', color: 'text-green-600' };
      case 'established':
        return { icon: <Rocket className="size-4" />, label: '已立项', color: 'text-blue-600' };
    }
  };

  const currentStatus = getStatusDisplay(editedProject.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex items-center gap-1.5">
              <Select
                value={editedProject.status}
                onValueChange={(value) => handleChange('status', value as 'pending' | 'accepted' | 'established')}
              >
                <SelectTrigger className={`w-fit gap-1.5 h-8 rounded-full border-0 text-xs font-medium bg-muted ${currentStatus.color}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-0">
                  <SelectItem value="pending" className="border-0">
                    <Clock className="size-4 mr-2" />
                    未受理
                  </SelectItem>
                  <SelectItem value="accepted" className="border-0">
                    <CheckCircle2 className="size-4 text-green-600 mr-2" />
                    已受理
                  </SelectItem>
                  <SelectItem value="established" className="border-0">
                    <Rocket className="size-4 text-blue-600 mr-2" />
                    已立项
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetTitle className="text-xl flex-1 truncate">{editedProject.name}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                value={editedProject.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={editedProject.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">联系信息</h3>
            
            <div>
              <Label htmlFor="uploader">项目来源/上传人</Label>
              <Input
                id="uploader"
                value={editedProject.uploader || ''}
                onChange={(e) => handleChange('uploader', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="founderName">项目联系人（创始人）</Label>
                <Input
                  id="founderName"
                  value={editedProject.founderName || ''}
                  onChange={(e) => handleChange('founderName', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="founderContact">联系方式</Label>
                <Input
                  id="founderContact"
                  value={editedProject.founderContact || ''}
                  onChange={(e) => handleChange('founderContact', e.target.value)}
                  className="mt-1.5"
                  placeholder="电话 / 邮箱"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="projectLead">项目负责人</Label>
              <Input
                id="projectLead"
                value={editedProject.projectLead || ''}
                onChange={(e) => handleChange('projectLead', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Company Info */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">公司信息</h3>
            
            <div>
              <Label htmlFor="companyName">公司名称</Label>
              <Input
                id="companyName"
                value={editedProject.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="companyAddress">公司地址</Label>
              <Input
                id="companyAddress"
                value={editedProject.companyAddress || ''}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="industry">公司领域/所属行业</Label>
              <Input
                id="industry"
                value={editedProject.industry || ''}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="mt-1.5"
                placeholder="例如：人工智能 / 工业自动化"
              />
            </div>
          </div>

          {/* Team & Product */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">团队与产品</h3>
            
            <div>
              <Label htmlFor="coreTeam">核心团队</Label>
              <Textarea
                id="coreTeam"
                value={editedProject.coreTeam || ''}
                onChange={(e) => handleChange('coreTeam', e.target.value)}
                className="mt-1.5 min-h-[80px]"
                placeholder="团队成员背景、经验等"
              />
            </div>

            <div>
              <Label htmlFor="coreProduct">核心产品</Label>
              <Textarea
                id="coreProduct"
                value={editedProject.coreProduct || ''}
                onChange={(e) => handleChange('coreProduct', e.target.value)}
                className="mt-1.5 min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="coreTechnology">核心技术</Label>
              <Textarea
                id="coreTechnology"
                value={editedProject.coreTechnology || ''}
                onChange={(e) => handleChange('coreTechnology', e.target.value)}
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>

          {/* Market & Competition */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">市场与竞争</h3>
            
            <div>
              <Label htmlFor="competition">竞争情况</Label>
              <Textarea
                id="competition"
                value={editedProject.competition || ''}
                onChange={(e) => handleChange('competition', e.target.value)}
                className="mt-1.5 min-h-[80px]"
                placeholder="竞品分析、竞争优势等"
              />
            </div>

            <div>
              <Label htmlFor="marketSize">市场空间</Label>
              <Textarea
                id="marketSize"
                value={editedProject.marketSize || ''}
                onChange={(e) => handleChange('marketSize', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Finance */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">财务与融资</h3>
            
            <div>
              <Label htmlFor="financialStatus">财务情况</Label>
              <Textarea
                id="financialStatus"
                value={editedProject.financialStatus || ''}
                onChange={(e) => handleChange('financialStatus', e.target.value)}
                className="mt-1.5"
                placeholder="当前财务状况、未来财务计划等"
              />
            </div>

            <div>
              <Label htmlFor="fundingStatus">融资情况</Label>
              <Textarea
                id="fundingStatus"
                value={editedProject.fundingStatus || ''}
                onChange={(e) => handleChange('fundingStatus', e.target.value)}
                className="mt-1.5 min-h-[80px]"
                placeholder="融资轮次、金额、投资方等"
              />
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">关键词</h3>
            
            <div>
              <Label htmlFor="keywords">关键词（用逗号分隔）</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="mt-1.5"
                placeholder="例如：深度学习, 红杉资本, Pre-A轮"
              />
              {keywords && (
                <div className="flex flex-wrap gap-1.5 mt-2">
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border sticky bottom-0 bg-background pb-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存修改
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

