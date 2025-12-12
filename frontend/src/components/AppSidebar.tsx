import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarHeaderComponent } from './Sidebar/SidebarHeader';
import { SidebarMainActions } from './Sidebar/SidebarMainActions';
import { SidebarNavigation } from './Sidebar/SidebarNavigation';
import { SidebarHistory } from './Sidebar/SidebarHistory';
import { SidebarUser } from './Sidebar/SidebarUser';
import { SidebarSearchModal } from './Sidebar/SidebarSearchModal';

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const isExpanded = state === 'expanded';

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
  };

  return (
    <motion.div
      id="app-sidebar"
      initial={false}
      animate={{
        width: isExpanded ? 240 : 50,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="h-screen"
    >
      <Sidebar collapsible="none" className="border-r border-border w-full h-screen bg-sidebar">
        <SidebarHeaderComponent />

        <SidebarContent className="pt-0">
          <SidebarMainActions onSearchOpen={handleSearchOpen} />
          <SidebarNavigation />
          <SidebarHistory />
        </SidebarContent>

        <SidebarUser />
      </Sidebar>

      <SidebarSearchModal open={searchOpen} onClose={handleSearchClose} />
    </motion.div>
  );
} 
