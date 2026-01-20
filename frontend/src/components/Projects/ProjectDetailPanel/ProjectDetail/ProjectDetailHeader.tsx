import { ProjectItem } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, X, Save, Building2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusDisplay } from './projectDetailUtils';

interface ProjectDetailHeaderProps {
  editedProject: ProjectItem;
  isEditing: boolean;
  displayStatus: ReturnType<typeof getStatusDisplay>;
  keywords: string;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
  onKeywordsChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onMarkNotAccepted: () => void;
  onStartAcceptance: () => void;
  onMarkEstablished: () => void;
  onClose: () => void;
  onMatchCompany: () => void;
  isMatching: boolean;
}

export function ProjectDetailHeader({
  editedProject,
  isEditing,
  displayStatus,
  keywords,
  onFieldChange,
  onKeywordsChange,
  onStartEdit,
  onSave,
  onCancel,
  onMarkNotAccepted,
  onStartAcceptance,
  onMarkEstablished,
  onMatchCompany,
  isMatching,
}: ProjectDetailHeaderProps) {
  return (
    <div className="px-8 pb-3 pt-2 bg-gradient-to-r from-background via-background to-muted/20">
      <div className="space-y-3">
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
            
            {/* 匹配工商信息按钮 - 放在标题旁边 */}
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onMatchCompany}
                disabled={isMatching || !editedProject.companyName}
                className="cursor-pointer gap-1.5 h-7 text-xs px-2.5 flex-shrink-0"
              >
                {isMatching ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Building2 className="size-3.5" />
                )}
                {isMatching ? '匹配中...' : '匹配工商'}
              </Button>
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

        {/* Keywords - Below title */}
        {isEditing ? (
          <Input
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder="添加关键词，用逗号分隔..."
            className="text-xs h-8 bg-muted/30 border-dashed"
          />
        ) : editedProject.keywords && editedProject.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {editedProject.keywords.map((kw, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-[10px] px-2 py-0.5 bg-primary/5 hover:bg-primary/10 text-primary border-0 font-normal rounded-full"
              >
                {kw}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
