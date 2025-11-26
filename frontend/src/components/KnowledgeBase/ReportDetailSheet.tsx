import { useState, useEffect } from 'react';
import { KnowledgeReport, useAppStore } from '@/store/useAppStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar, User, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportDetailSheetProps {
  report: KnowledgeReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailSheet({ report, open, onOpenChange }: ReportDetailSheetProps) {
  const { updateKnowledgeReport } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState<KnowledgeReport | null>(null);

  useEffect(() => {
    if (report) {
      setEditedReport(report);
      setIsEditing(false);
    }
  }, [report]);

  if (!report || !editedReport) return null;

  const handleSave = () => {
    if (editedReport) {
      updateKnowledgeReport(editedReport.id, editedReport);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedReport(report);
    setIsEditing(false);
  };

  const handleTagsChange = (tagsStr: string) => {
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
    setEditedReport({ ...editedReport, tags });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto px-8">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2 pr-8">
            <Badge variant="outline">{report.category}</Badge>
            {!isEditing ? (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                编辑
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="size-4 mr-1" />
                  取消
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="size-4 mr-1" />
                  保存
                </Button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <Input
              value={editedReport.title}
              onChange={(e) => setEditedReport({ ...editedReport, title: e.target.value })}
              className="text-xl font-bold"
            />
          ) : (
            <SheetTitle className="text-xl">{report.title}</SheetTitle>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="size-3" />
                作者
              </Label>
              {isEditing ? (
                <Input
                  value={editedReport.author}
                  onChange={(e) => setEditedReport({ ...editedReport, author: e.target.value })}
                  className="h-8"
                />
              ) : (
                <p className="text-sm font-medium">{report.author}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                创建时间
              </Label>
              <p className="text-sm font-medium">
                {new Date(report.createdAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="space-y-1 col-span-2">
              <Label className="text-xs text-muted-foreground">分类</Label>
              {isEditing ? (
                <Input
                  value={editedReport.category}
                  onChange={(e) => setEditedReport({ ...editedReport, category: e.target.value })}
                  className="h-8"
                />
              ) : (
                <p className="text-sm font-medium">{report.category}</p>
              )}
            </div>

            <div className="space-y-1 col-span-2">
              <Label className="text-xs text-muted-foreground">标签</Label>
              {isEditing ? (
                <Input
                  value={editedReport.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="用逗号分隔多个标签"
                  className="h-8"
                />
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {report.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1 col-span-2">
              <Label className="text-xs text-muted-foreground">字数统计</Label>
              <p className="text-sm font-medium">{report.wordCount.toLocaleString()} 字</p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">摘要</Label>
            {isEditing ? (
              <Textarea
                value={editedReport.summary}
                onChange={(e) => setEditedReport({ ...editedReport, summary: e.target.value })}
                rows={3}
                className="resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.summary}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2 pb-8">
            <Label className="text-sm font-semibold">报告正文</Label>
            {isEditing ? (
              <Textarea
                value={editedReport.content}
                onChange={(e) => setEditedReport({ ...editedReport, content: e.target.value })}
                rows={20}
                className="resize-none font-mono text-xs"
              />
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{report.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

