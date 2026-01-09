import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { NotebookPen, SquarePen } from 'lucide-react';
import { Button } from './ui/button';

export function SmartCanvas() {
  const { smartCanvasOpen, smartNotes, addSmartNote, removeSmartNote } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);
  if (!smartCanvasOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!raw) return;
      if (raw.kind === 'company' || raw.kind === 'research' || raw.kind === 'news') {
        addSmartNote({ id: crypto.randomUUID(), type: raw.kind, title: raw.title, content: raw.content });
      } else if (raw.title) {
        addSmartNote({ id: crypto.randomUUID(), type: 'news', title: raw.title, content: raw.content });
      }
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  return (
    <div className="h-full border-l border-border flex flex-col">
      <div className="px-3 pt-1 pb-2 text-base font-medium flex items-center justify-between">
        <span>智选</span>
        <div className="flex items-center gap-2">
          <Button className="px-2 py-1 rounded hover:bg-accent" 
            variant="ghost"
            size="sm"
            onClick={() => useAppStore.getState().sortSmartNotes()}
            disabled={smartNotes.length === 0}
          >
            <SquarePen className="size-4" />
            生成笔记
          </Button>
          {/* <Button className="px-2 py-1 rounded hover:bg-accent" 
            variant="ghost"
            size="sm"
            onClick={() => useAppStore.getState().sortSmartNotes()}
            disabled={smartNotes.length === 0}
          >
            <Binoculars className="size-4" />
            深度投研
          </Button> */}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2 relative" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-10 flex items-center justify-center"
            >
              <div className="text-center">
                <NotebookPen className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-primary">拖拽卡片到此处以添加到智选</p>
                <p className="text-muted-foreground">松开即可加入便签</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {smartNotes.length === 0 ? (
          <div className="text-sm text-muted-foreground mt-2">
            将卡片拖拽到此处，快速记为便签。
          </div>
        ) : (
          smartNotes.map(n => (
            <div key={n.id} className="border rounded p-2">
              <div className="text-xs uppercase text-muted-foreground mb-1">{n.type}</div>
              <div className="font-medium leading-snug break-words">{n.title}</div>
              {n.content && <div className="text-sm text-muted-foreground mt-1 line-clamp-4">{n.content}</div>}
              <button className="text-xs text-muted-foreground mt-1" onClick={() => removeSmartNote(n.id)}>删除</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
