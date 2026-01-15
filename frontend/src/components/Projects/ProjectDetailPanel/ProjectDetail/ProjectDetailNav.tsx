import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Briefcase, 
  User, 
  Building2, 
  Users, 
  Cpu, 
  TrendingUp, 
  Wallet, 
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'ai-summary', label: 'AI 摘要', icon: Sparkles },
  { id: 'project-role', label: '项目角色', icon: Briefcase },
  { id: 'contact-info', label: '对接信息', icon: User },
  { id: 'company-info', label: '公司信息', icon: Building2 },
  { id: 'core-team', label: '核心团队', icon: Users },
  { id: 'product', label: '产品', icon: Cpu },
  { id: 'technology', label: '技术', icon: Cpu },
  { id: 'market', label: '市场', icon: TrendingUp },
  { id: 'competition', label: '竞争', icon: TrendingUp },
  { id: 'financial', label: '财务', icon: Wallet },
  { id: 'financing', label: '融资', icon: Wallet },
  { id: 'comments', label: '评论', icon: MessageSquare },
];

interface ProjectDetailNavProps {
  isCompact: boolean; // true when chat panel is expanded
}

export function ProjectDetailNav({ isCompact }: ProjectDetailNavProps) {
  const [activeSection, setActiveSection] = useState<string>('ai-summary');

  useEffect(() => {
    const handleScroll = () => {
      const scrollAreaWrapper = document.querySelector('[data-detail-scroll]');
      const scrollContainer = scrollAreaWrapper?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (!scrollContainer) return;

      const sections = NAV_SECTIONS.map(section => {
        const element = document.getElementById(section.id);
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        return {
          id: section.id,
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
        };
      }).filter(Boolean);

      // Find the first section that's in view
      const inViewSection = sections.find(section => 
        section && section.top <= 100 && section.bottom > 0
      );

      if (inViewSection) {
        setActiveSection(inViewSection.id);
      }
    };

    const scrollAreaWrapper = document.querySelector('[data-detail-scroll]');
    const scrollContainer = scrollAreaWrapper?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    // ScrollArea 内部实际滚动的是 [data-radix-scroll-area-viewport] 元素
    const scrollAreaWrapper = document.querySelector('[data-detail-scroll]');
    const scrollContainer = scrollAreaWrapper?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    
    if (element && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const targetScroll = scrollTop + elementRect.top - containerRect.top - 20;
      
      scrollContainer.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isCompact ? 'compact' : 'full'}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg',
          isCompact ? 'px-2 py-3' : 'px-4 py-3'
        )}
      >
        <nav className="space-y-1">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => handleNavClick(section.id)}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg transition-all',
                  'hover:bg-primary/10',
                  isCompact ? 'px-2 py-1.5' : 'px-3 py-2',
                  isActive 
                    ? 'bg-primary/15 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'flex-shrink-0',
                  isCompact ? 'size-3.5' : 'size-4'
                )} />
                
                {!isCompact && (
                  <span className="text-xs font-medium">{section.label}</span>
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="ml-auto"
                  >
                    <ChevronRight className="size-3 text-primary" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </nav>
      </motion.div>
    </AnimatePresence>
  );
}
