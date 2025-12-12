import { useState } from 'react';
import { History, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuSubButton } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

const menuItems = [
  { 
    icon: History, 
    label: '历史对话', 
    id: 'history',
    subItems: [
      { label: 'Today', id: 'today' },
      { label: 'Yesterday', id: 'yesterday' },
      { label: 'Last Week', id: 'lastWeek' }
    ]
  }
];

export function SidebarHistory() {
  const { state } = useSidebar();
  const isExpanded = state === 'expanded';
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <SidebarGroup className="p-3">
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                className={`w-full flex items-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors gap-3 px-1 py-2 border border-transparent bg-transparent cursor-pointer font-medium text-sm`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 whitespace-nowrap overflow-hidden text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isExpanded && (
                  <motion.div
                    animate={{
                      rotate: expandedItem === item.id ? 90 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>
              
              <AnimatePresence>
                {isExpanded && expandedItem === item.id && item.subItems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-8"
                  >
                    <div className="space-y-1 py-1">
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubButton
                          key={subItem.id}
                          className="w-full text-sm flex items-center gap-2 py-2 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left border border-transparent bg-transparent cursor-pointer font-medium"
                        >
                          {subItem.label}
                        </SidebarMenuSubButton>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
