import { ProjectItem } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusDisplay } from './projectDetailUtils';

interface ProjectDetailHeaderProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  displayStatus: ReturnType<typeof getStatusDisplay>;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onMarkNotAccepted: () => void;
  onStartAcceptance: () => void;
  onMarkEstablished: () => void;
  onClose: () => void;
}

export function ProjectDetailHeader({
  editedProject,
  isEditing,
  displayStatus,
  onFieldChange,
  onStartEdit,
  onSave,
  onCancel,
  onMarkNotAccepted,
  onStartAcceptance,
  onMarkEstablished,
}: ProjectDetailHeaderProps) {
  return (
    <div className="px-8 pb-3 pt-2 bg-gradient-to-r from-background via-background to-muted/20">
      <div className="space-y-2">
        {/* First Row: Project Name, Status Badge (view mode), and Edit Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Project Name */}
            {isEditing ? (
              <Input
                value={editedProject.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
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
              <Badge className={`${displayStatus.color} ${displayStatus.hoverColor} border-0 gap-1.5 px-3 py-1 flex-shrink-0 transition-colors [&_svg]:transition-colors`}>
                {displayStatus.icon}
                {displayStatus.label}
              </Badge>
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
                    onClick={onSave}
                    className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <Save className="size-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={onCancel}
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
                  {/* 编辑按钮 */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onStartEdit}
                    className="cursor-pointer"
                  >
                    <Pencil className="size-4 mr-1" />
                    编辑
                  </Button>
                  
                  {/* 状态操作按钮 */}
                  {editedProject.status === 'received' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onMarkNotAccepted}
                        className="cursor-pointer"
                      >
                        不受理
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={onStartAcceptance}
                        className="cursor-pointer"
                      >
                        受理
                      </Button>
                    </>
                  )}
                  {editedProject.status === 'accepted' && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={onMarkEstablished}
                      className="cursor-pointer"
                    >
                      立项
                    </Button>
                  )}
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
