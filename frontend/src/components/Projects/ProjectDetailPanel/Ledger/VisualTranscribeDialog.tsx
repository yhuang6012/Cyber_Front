import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Loader2 } from 'lucide-react';

interface VisualTranscribeDialogProps {
  open: boolean;
  fileName: string;
  onCancel: () => void;
  onConfirm: (customPrompt: string) => void;
  isSubmitting?: boolean;
}

export function VisualTranscribeDialog({
  open,
  fileName,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: VisualTranscribeDialogProps) {
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
            <Eye className="h-5 w-5 text-purple-500" />
            视觉转写
          </DialogTitle>
          <DialogDescription>
            支持对图片、视频和 PDF 进行视觉分析与内容提取
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
            <Label htmlFor="visual-custom-prompt">自定义提示词（可选）</Label>
            <Textarea
              id="visual-custom-prompt"
              placeholder="例如：请提取视频中的关键动作并总结核心内容"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              提示词将用于视觉内容分析，帮助 AI 更好地理解您的需求
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
