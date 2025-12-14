import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from '@/components/AppSidebar';
import { Toaster } from '@/components/ui/sonner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <>
        <div className="flex h-screen w-full overflow-hidden">
          {/* Fixed Sidebar */}
          <div className="flex-shrink-0">
            <AppSidebar />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
        <Toaster duration={3000} />
      </>
    </SidebarProvider>
  );
} 