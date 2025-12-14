import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileAudio, Loader2 } from 'lucide-react';

interface AudioTranscribeDialogProps {
  open: boolean;
  fileName: string;
  onCancel: () => void;
  onConfirm: (customPrompt: string) => void;
  isSubmitting?: boolean;
}

export function AudioTranscribeDialog({
  open,
  fileName,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: AudioTranscribeDialogProps) {
  const [customPrompt, setCustomPrompt] = useState('');

  const handleConfirm = () => {
    onConfirm(customPrompt.trim());
  };

  const handleOpenChange = (v: boolean) => {
    if (!v && !isSubmitting) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-blue-500" />
            音频转写
          </DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">文件名</Label>
            <div className="text-sm font-medium truncate bg-muted/50 px-3 py-2 rounded-md">
              {fileName}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt">自定义提示词（可选）</Label>
            <Textarea
              id="custom-prompt"
              placeholder="例如：请额外关注财务数据和风险点"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              提示词将用于会议纪要生成，帮助 AI 更好地理解您的需求
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '开始转写'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
