import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessage as ChatMessageType } from '@/store/useAppStore';
import { format } from 'date-fns';
import { User, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatFilePreview } from './ChatFilePreview';

interface ChatMessageProps {
  message: ChatMessageType;
}

function extractGuides(text: string): { content: string; guides: string[] } {
  const guides: string[] = [];
  if (!text) return { content: text, guides };
  const regex = /<guide>([\s\S]*?)<\/guide>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const q = (m[1] || '').trim();
    if (q) guides.push(q);
  }
  const content = text.replace(regex, '').trim();
  return { content, guides };
}

export function ChatMessage({ message }: ChatMessageProps) {
  // Simple message display without special handling
  const { content: renderContent, guides } = extractGuides(message.content);

  const handleDragStart = (e: React.DragEvent) => {
    if (message.isUser) return;
    // build a simple payload compatible with SmartCanvas (treat as a generic note/news)
    const lines = (renderContent || message.content || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    const title = (lines[0] || '助手回复').slice(0, 80);
    const payload = { kind: 'news', id: message.id, title, content: renderContent || message.content } as any;
    try {
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
    } catch {}
  };

  const handleGuideClick = (q: string) => {
    try {
      window.dispatchEvent(new CustomEvent('chat:insertText', { detail: q }));
    } catch {}
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut"
      }}
      className={`flex gap-3 w-full min-w-0 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <Avatar className={cn("w-8 h-8 flex-shrink-0", message.isUser ? "mr-4" : "ml-4")}>
        <AvatarFallback className={message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground border border-border'}>
          {message.isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(`flex flex-col min-w-0 ${message.isUser ? 'items-end w-full' : 'items-start w-full'}`)}>
        {message.isUser ? (
          // User message
          <>
            <div className="inline-flex max-w-[80%] bg-gray-50 text-primary rounded-lg px-4 py-3 break-words">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
            <span className="text-xs text-muted-foreground mt-1 px-1">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
          </>
        ) : message.type === 'file-preview' && message.filePreview ? (
          // File preview message
          <div className="w-full space-y-3">
            <ChatFilePreview filePreview={message.filePreview} />
            {/* Timestamp */}
            <span className="text-xs text-muted-foreground px-2">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
          </div>
        ) : (
          // AI message - markdown
          <div className="w-full space-y-3 min-w-0" draggable onDragStart={handleDragStart}>
            <div className="inline-flex max-w-[95%] bg-gray-50 rounded-lg px-4 py-3" title="拖拽到右侧智选以保存此回复">
              <div className="max-w-full min-w-0 text-sm leading-relaxed markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-2xl md:text-3xl font-semibold mt-3 mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xl md:text-2xl font-semibold mt-3 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-lg md:text-xl font-semibold mt-2.5 mb-1.5" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                      <h4 className="text-base md:text-lg font-semibold mt-2 mb-1" {...props} />
                    ),
                    h5: ({ node, ...props }) => (
                      <h5 className="text-sm md:text-base font-semibold mt-2 mb-1" {...props} />
                    ),
                    h6: ({ node, ...props }) => (
                      <h6 className="text-xs md:text-sm font-semibold mt-2 mb-1 tracking-wide uppercase text-muted-foreground" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="w-full overflow-x-auto my-2 max-w-full">
                        <table className="min-w-full border-collapse table-auto text-sm" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="bg-muted/50" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr className="even:bg-muted/30" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-border px-2 py-1 text-left align-middle font-medium" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-border px-2 py-1 align-top" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-5 my-2 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="my-2 break-words" {...props} />
                    ),
                    code: (props) => {
                      const { inline, className, children, ...rest } = props as any;
                      return inline ? (
                        <code className="px-1 py-0.5 rounded bg-muted break-words" {...rest}>{children}</code>
                      ) : (
                        <pre className="bg-muted p-3 rounded overflow-x-auto max-w-full"><code className={className} {...rest}>{children}</code></pre>
                      );
                    },
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                      <em className="italic" {...props} />
                    ),
                  }}
                >
                  {renderContent}
                </ReactMarkdown>
              </div>
            </div>

            {guides.length > 0 && (
              <div className="px-2 space-y-2">
                <div className="text-xs text-muted-foreground">猜你想问：</div>
                <div className="flex flex-wrap gap-2">
                  {guides.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleGuideClick(q)}
                      className="text-xs md:text-sm border rounded-full px-2.5 py-1 hover:bg-accent hover:text-foreground transition-colors"
                      aria-label={`追问：${q}`}
                      title={q}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 px-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ThumbsDown className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground px-2">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
} 