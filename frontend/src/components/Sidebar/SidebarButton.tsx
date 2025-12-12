import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

export function SidebarButton({ icon: Icon, label, onClick, isActive = false }: SidebarButtonProps) {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';

  return (
    <SidebarMenuItem>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors gap-3 px-1 py-2 border border-transparent bg-transparent cursor-pointer font-medium text-sm ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 whitespace-nowrap overflow-hidden text-left"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </SidebarMenuItem>
  );
}
