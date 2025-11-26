import { useState } from 'react';
import { ChatMessage } from '@/components/ChatPanel/ChatMessage';
import { ChatInput } from '@/components/ChatPanel/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
// import { DEFAULT_AI_RESPONSE } from '@/mocks/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function ChatPanel() {
  const { messages, addDraftAttachment, chatDraftAttachments, removeDraftAttachment } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const raw = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!raw) return;
      if (raw.kind === 'company' || raw.kind === 'research' || raw.kind === 'news') {
        addDraftAttachment({ id: raw.id, type: raw.kind, title: raw.title, content: raw.content });
      } else if (raw.title && raw.content) {
        // backward compatibility for old payloads (assume news)
        addDraftAttachment({ id: raw.id ?? crypto.randomUUID(), type: 'news', title: raw.title, content: raw.content });
      }
    } catch (error) {
      console.error('Failed to parse dropped news:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set isDragOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-background relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drop Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-10 flex items-center justify-center"
          >
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-primary">拖拽文章到此处以开始讨论</p>
              <p className="text-muted-foreground">松开即可发起会话</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {messages.length > 0 ? (
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((message: any) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <h3 className="text-lg font-medium mb-2">开始对话</h3>
                <p className="text-center max-w-md">从左侧拖拽一条资讯到这里，或在下方输入消息开始聊天。</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input - Fixed */}
      <div className="flex-shrink-0">
        {/* draft attachments accordion */}
        <Accordion type="single" collapsible>
          <AccordionItem value="draft-attachments">
            <AccordionContent className="px-4 pb-1">
              {chatDraftAttachments.length === 0 ? (
                <div className="text-xs text-muted-foreground pl-2">暂无引用，拖拽左侧内容到此处</div>
              ) : (
                <div className="space-y-1">
                  {chatDraftAttachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between text-sm border rounded-md px-2 py-1">
                      <div className="truncate mr-2">{att.title}</div>
                      <button aria-label="删除" className="text-muted-foreground hover:text-foreground" onClick={() => removeDraftAttachment(att.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
            <AccordionTrigger className="w-full text-left pl-6 pr-2 py-2.5 text-xs flex items-center justify-between">
              <span className="inline-flex items-center gap-2">
                <span>引用内容</span>
                <span
                  className="inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-foreground text-background text-[12px] leading-none px-1"
                >
                  {chatDraftAttachments.length}
                </span>
              </span>
            </AccordionTrigger>
          </AccordionItem>
        </Accordion>
        <ChatInput className="pt-0 px-4 pb-4" />
      </div>
    </div>
  );
} 