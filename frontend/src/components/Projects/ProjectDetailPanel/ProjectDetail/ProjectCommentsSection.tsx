import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
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

interface ProjectCommentsSectionProps {
  projectId: string;
}

export function ProjectCommentsSection({ projectId }: ProjectCommentsSectionProps) {
  const { getProjectById, addProjectComment, deleteProjectComment, currentUser } = useAppStore();
  const project = getProjectById(projectId);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error('评论内容不能为空');
      return;
    }

    if (!currentUser) {
      toast.error('请先登录');
      return;
    }

    setIsSubmitting(true);
    try {
      await addProjectComment(projectId, commentText.trim());
      setCommentText('');
      toast.success('评论已添加');
    } catch (error: any) {
      toast.error('添加评论失败', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteProjectComment(projectId, commentId);
      toast.success('评论已删除');
    } catch (error: any) {
      toast.error('删除评论失败', {
        description: error.message,
      });
    }
    setDeleteCommentId(null);
  };

  const comments = project?.comments || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 text-foreground/80">
        <MessageSquare className="size-4 text-primary" />
        <h3 className="font-bold text-lg tracking-wide uppercase">项目评论</h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {/* Comment Input */}
      <div className="space-y-3 pl-1">
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0 mt-1">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="添加评论... (记录受理判断、尽调要点、沟通反馈等)"
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !commentText.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="size-4" />
                {isSubmitting ? '发送中...' : '发送评论'}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 mt-6">
          {comments.length === 0 ? (
            <div className="p-8 rounded-xl bg-muted/40 border border-border/50 border-dashed flex items-center justify-center">
              <p className="text-sm text-muted-foreground/60 italic text-center">
                暂无评论，快来添加第一条评论吧！
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {comment.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    {currentUser === comment.author && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => setDeleteCommentId(comment.id)}
                        title="删除评论"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条评论吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
