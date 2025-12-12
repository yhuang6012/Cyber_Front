import { motion, AnimatePresence } from 'framer-motion';
import { SidebarHeader } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarHeaderComponent() {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';

  return (
    <SidebarHeader className="p-2 pt-2">
      <div className={`flex items-center gap-3 pl-1 ml-1 h-12`}>
        <div className="flex aspect-square size-5 items-center justify-center rounded bg-primary text-primary-foreground">
          <span className="font-bold text-xs">S</span>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="font-bold whitespace-nowrap">Siwisdom</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarHeader>
  );
}
