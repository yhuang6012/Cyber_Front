import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProjectStatusDialogProps {
  open: boolean;
  message: string;
  status?: 'accepted' | 'rejected' | 'initiated' | 'received';
  onConfirm: (rejectionReason?: string) => void;
  onCancel: () => void;
}

export function ProjectStatusDialog({ 
  open, 
  message, 
  status,
  onConfirm, 
  onCancel 
}: ProjectStatusDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  
  // 缓存 status 和 message，用于关闭动画期间保持内容不变
  const [cachedStatus, setCachedStatus] = useState(status);
  const [cachedMessage, setCachedMessage] = useState(message);
  
  // 只在对话框打开且有有效值时更新缓存
  useEffect(() => {
    if (open && status !== undefined) {
      setCachedStatus(status);
      setCachedMessage(message);
    }
  }, [open, status, message]);

  // 当对话框关闭时重置拒绝理由和错误（延迟执行，等动画结束）
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setRejectionReason('');
        setError('');
      }, 200); // 等待关闭动画结束
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // 打开时用最新的 props 值，关闭时用缓存值（避免关闭动画期间内容突变）
  const displayStatus = open ? status : cachedStatus;
  const displayMessage = open ? message : cachedMessage;

  const handleConfirm = () => {
    // 验证拒绝理由
    if (displayStatus === 'rejected') {
      if (!rejectionReason.trim()) {
        // 按钮已禁用时理论上不会触发到这里，但为了安全再做一层保护
        setError('请输入拒绝理由');
        return;
      }
      setError('');
    }
    
    // 验证通过，调用确认回调
    onConfirm(displayStatus === 'rejected' ? rejectionReason : undefined);
  };

  const handleRejectionReasonChange = (value: string) => {
    setRejectionReason(value);
    // 清除错误提示
    if (error && value.trim()) {
      setError('');
    }
  };

  const isConfirmDisabled =
    displayStatus === 'rejected' && !rejectionReason.trim();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>状态确认</AlertDialogTitle>
          <AlertDialogDescription>
            {displayMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {displayStatus === 'rejected' && (
          <div className="space-y-2 py-4">
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              拒绝理由 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => handleRejectionReasonChange(e.target.value)}
              placeholder="请输入拒绝理由..."
              className={`min-h-[100px] resize-none ${error ? 'border-destructive' : ''}`}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
          >
            确认
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
