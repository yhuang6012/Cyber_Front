import { ProjectItem } from '@/store/useAppStore';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { AiSummarySection } from './AiSummarySection';

interface ProjectDetailTopSectionProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
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

export function ProjectDetailTopSection({
  editedProject,
  isEditing,
  onFieldChange,
}: ProjectDetailTopSectionProps) {
  return (
    <div className="px-8 py-6 space-y-8 bg-background border-b border-border">
      {/* AI Summary */}
      <AiSummarySection project={editedProject} />

      {/* Manager Note */}
      <Section icon={FileText} title="投资经理笔记">
        {isEditing ? (
          <Textarea
            value={editedProject.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            className="min-h-[120px] resize-none"
            placeholder="记录受理判断、尽调要点、沟通反馈等..."
          />
        ) : (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {editedProject.description?.trim() ? editedProject.description : <span className="text-muted-foreground/60 italic">暂无笔记</span>}
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}
