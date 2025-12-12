import { Folder, Layers } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar';
import { SidebarButton } from './SidebarButton';
import { useAppStore } from '@/store/useAppStore';

export function SidebarNavigation() {
  const { activePanel, setActivePanel } = useAppStore();

  return (
    <SidebarGroup className="p-3">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarButton
            icon={Folder}
            label="项目库"
            onClick={() => setActivePanel('projects')}
            isActive={activePanel === 'projects'}
          />
          <SidebarButton
            icon={Layers}
            label="知识库"
            onClick={() => setActivePanel('knowledge')}
            isActive={activePanel === 'knowledge'}
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
