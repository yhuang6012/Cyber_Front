import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { MyProjects } from './MyProjects';

export function WorkspacePanel() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-border">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">聚焦工作台</h2>
          </div>

          {/* Tabs - 仅保留“我的项目”，其余模块已下线 */}
          <div className="flex items-center gap-2 border-b"> 
            <div className="px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 border-primary text-foreground">
              <Briefcase className="size-4" />
              我的项目
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="px-8">
              <motion.div 
                className="grid gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <MyProjects />
              </motion.div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}


