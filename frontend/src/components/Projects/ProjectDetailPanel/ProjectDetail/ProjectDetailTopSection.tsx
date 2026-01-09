import { ProjectItem } from '@/store/useAppStore';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { AiSummarySection } from './AiSummarySection';

interface ProjectDetailTopSectionProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
}

export function ProjectDetailTopSection({
  editedProject,
  isEditing,
  onFieldChange,
}: ProjectDetailTopSectionProps) {
  return (
    <div className="px-6 py-3 bg-background">
      <div className="grid grid-cols-2 gap-4">
        {/* Left: AI Summary */}
        <Card className="p-3 border-border shadow-none">
          <AiSummarySection project={editedProject} />
        </Card>

        {/* Right: Manager Note */}
        <Card className="p-3 border-border shadow-none">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-foreground/80">
              <FileText className="size-3 text-primary" />
              <h3 className="font-semibold text-sm tracking-wide uppercase">投资经理笔记</h3>
            </div>
            <div>
              {isEditing ? (
                <Textarea
                  value={editedProject.description || ''}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  className="min-h-[80px] resize-none text-xs leading-relaxed"
                  placeholder="记录受理判断、尽调要点、沟通反馈等..."
                />
              ) : (
                <div className="p-2.5 rounded-md bg-muted/40 border border-border/50 min-h-[80px]">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {editedProject.description?.trim() ? editedProject.description : <span className="text-muted-foreground/60 italic">暂无笔记</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
