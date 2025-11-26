import { useState } from 'react';
import { useAppStore, KnowledgeReport } from '@/store/useAppStore';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Search, Calendar, User, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportListProps {
  onReportClick: (report: KnowledgeReport) => void;
}

export function ReportList({ onReportClick }: ReportListProps) {
  const { knowledgeReports, removeKnowledgeReport } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(new Set(knowledgeReports.map(r => r.category)));

  // Filter reports
  const filteredReports = knowledgeReports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这份报告吗？')) {
      removeKnowledgeReport(reportId);
    }
  };

  const handleDragStart = (e: React.DragEvent, report: KnowledgeReport) => {
    e.stopPropagation();
    const dragData = {
      id: report.id,
      type: 'knowledge',
      title: report.title,
      content: JSON.stringify({
        title: report.title,
        summary: report.summary,
        author: report.author,
        category: report.category,
        tags: report.tags,
        wordCount: report.wordCount,
      }, null, 2),
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索报告标题、摘要或标签..."
            className="pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        
        <div className="flex items-center gap-2 py-2">
          <span className="text-sm text-muted-foreground">分类：</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border rounded-md px-3 py-2 bg-background"
          >
            <option value="all">所有分类</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="size-12 mx-auto mb-3 opacity-50" />
          <p>暂无匹配的报告</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <motion.div
              key={report.id}
              draggable
              onDragStart={(e: any) => handleDragStart(e, report)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow cursor-pointer hover:cursor-grab active:cursor-grabbing group"
              onClick={() => onReportClick(report)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Icon and Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="size-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                      {report.summary}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="size-3" />
                        <span>{report.author}</span>
                      </div>
                      <div className="w-px h-3 bg-border" />
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{new Date(report.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="w-px h-3 bg-border" />
                      <Badge variant="secondary" className="text-xs">
                        {report.category}
                      </Badge>
                      {report.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs border-border/95">
                          {tag}
                        </Badge>
                      ))}
                      {report.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{report.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Word count and Delete button */}
                <div className="flex items-start gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                    {report.wordCount.toLocaleString()} 字
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, report.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

