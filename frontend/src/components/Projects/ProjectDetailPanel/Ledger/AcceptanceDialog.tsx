import { ProjectItem } from '@/store/useAppStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ProjectDetailBody } from '../ProjectDetail/ProjectDetailBody';

interface AcceptanceDialogProps {
  open: boolean;
  draft: ProjectItem | null;
  keywords: string;
  onFieldChange: (field: keyof ProjectItem, value: any) => void;
  onKeywordsChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AcceptanceDialog({
  open,
  draft,
  keywords,
  onFieldChange,
  onKeywordsChange,
  onCancel,
  onConfirm,
}: AcceptanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent 
        className="!max-w-[95vw] w-[70vw] sm:!max-w-[70vw] p-0 overflow-hidden"
        style={{ maxWidth: '95vw', width: '95vw' }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>受理单</DialogTitle>
          <DialogDescription>填写并确认受理项目信息</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-2">
          {draft && (
            <ProjectDetailBody
              editedProject={draft}
              isEditing
              keywords={keywords}
              onFieldChange={onFieldChange}
              onKeywordsChange={onKeywordsChange}
            />
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border/60">
          <Button variant="ghost" onClick={onCancel} className="cursor-pointer">
            取消
          </Button>
          <Button onClick={onConfirm} className="cursor-pointer">
            确认受理
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
