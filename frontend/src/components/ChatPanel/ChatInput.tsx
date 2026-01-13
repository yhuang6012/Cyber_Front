import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/useAppStore';
import { Paperclip, Brain, Globe } from 'lucide-react';
// backend streaming replaces local mocks
// import { DEFAULT_AI_RESPONSE, buildResearchReportMessage } from '@/mocks/chat';
import { startChatStream, ChatRequest, DocumentMetadata, processMarkItDown } from '@/lib/agentApi';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ChatInputProps {
  className?: string;
}

export function ChatInput({ className }: ChatInputProps) {
  const [input, setInput] = useState('');
  // Fake toggle for UI only. Backend always uses chat mode.
  const [deepResearch, setDeepResearch] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { 
    addMessage, 
    threadId,
    setThreadId,
    addChatThread,
    chatDraftAttachments, 
    clearDraftAttachments, 
    setChatExpanded,
    addDraftAttachment,
    updateDraftAttachment
  } = useAppStore();

  // 支持的文件格式白名单
  const SUPPORTED_EXTS = [
    'csv', 'docx', 'epub', 'gif', 'htm', 'html', 'jpeg', 'jpg', 'json', 
    'm4a', 'mp3', 'pdf', 'png', 'pptx', 'txt', 'wav', 'webp', 'xls', 'xlsx', 'xml', 'zip'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const id = crypto.randomUUID();
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isSupported = SUPPORTED_EXTS.includes(ext);
      
      console.log('[ChatInput] 📁 处理文件:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        extension: ext,
        isSupported,
        fileId: id
      });
      
      addDraftAttachment({
        id,
        type: 'file',
        title: file.name,
        file_format: ext,
        is_processing: isSupported
      });

      if (isSupported) {
        console.log('[ChatInput] 🔄 开始调用 MarkItDown API:', file.name);
        processMarkItDown([file], (result) => {
          console.log('[ChatInput] 📥 MarkItDown API 返回结果:', {
            fileName: file.name,
            status: result.status,
            hasContent: !!result.markdown_content,
            contentLength: result.markdown_content?.length || 0,
            error: result.error
          });
          
          if (result.status === 'success' && result.markdown_content) {
            console.log('[ChatInput] ✅ 文件处理成功:', file.name);
            updateDraftAttachment(id, { content: result.markdown_content, is_processing: false });
          } else {
            console.error('[ChatInput] ❌ 文件处理失败:', file.name, result.error || '解析失败');
            updateDraftAttachment(id, { is_processing: false, error: result.error || '解析失败' });
          }
        }).catch(err => {
          console.error('[ChatInput] 💥 MarkItDown API 调用异常:', {
            fileName: file.name,
            error: err.message,
            stack: err.stack
          });
          updateDraftAttachment(id, { is_processing: false, error: err.message || '网络错误' });
        });
      } else {
        console.log('[ChatInput] ⚠️ 文件格式不支持 MarkItDown:', file.name, ext);
        if (ext === 'md' || ext === 'txt') {
          console.log('[ChatInput] 📖 使用本地读取:', file.name);
          const reader = new FileReader();
          reader.onload = (ev) => {
            console.log('[ChatInput] ✅ 本地文件读取成功:', file.name);
            updateDraftAttachment(id, { content: ev.target?.result as string, is_processing: false });
          };
          reader.onerror = () => {
            console.error('[ChatInput] ❌ 本地文件读取失败:', file.name);
          };
          reader.readAsText(file);
        } else {
          console.log('[ChatInput] ⏭️ 跳过不支持的文件类型:', file.name, ext);
          updateDraftAttachment(id, { is_processing: false });
        }
      }
    });

    // 清空 input 方便下次选择同名文件
    e.target.value = '';
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const text = (ce?.detail ?? '').toString();
      if (!text) return;
      setInput(text);
      // focus caret to end
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          const len = text.length;
          try { el.setSelectionRange(len, len); } catch {}
        }
      });
    };
    window.addEventListener('chat:insertText' as any, handler);
    return () => window.removeEventListener('chat:insertText' as any, handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      // Take a snapshot of current draft attachments BEFORE clearing
      const draftAttachments = chatDraftAttachments.slice();

      // prepend draft attachments as context above message
      const prefix = draftAttachments.length > 0
        ? draftAttachments.map(a => `【引用】${a.title}`).join('\n') + '\n\n'
        : '';
      addMessage(prefix + trimmed, true);
      clearDraftAttachments();
      // auto open chat panel on first send
      setChatExpanded(true);
      setInput('');
      
      // 获取当前 thread_id 或生成新的（只有在没有活跃会话时才生成）
      const isNewThread = !threadId;
      const currentThreadId = threadId || crypto.randomUUID();
      
      // 生成对话标题（仅在新会话的第一条消息时生成）
      const threadTitle = trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed;
      
      // 收集待发送的文档
      const documents: DocumentMetadata[] = draftAttachments
        .filter(a => a.type === 'file' && a.content && !a.is_processing)
        .map(a => ({
          filename: a.title,
          format: a.file_format || 'txt',
          markdown_content: a.content || ''
        }));

      // 构建请求
      const request: ChatRequest = {
        thread_id: currentThreadId,
        message: trimmed,
        enable_websearch: webSearchEnabled, // 使用新添加的联网搜索开关
        enable_retrieval: true, // 默认启用检索
        documents: documents.length > 0 ? documents : undefined
      };

      // 如果有公司列表引用，添加到消息中（根据之前逻辑保留）
      const companyLists = draftAttachments
        .filter(a => a.type === 'company')
        .map(a => a.title.trim())
        .filter(Boolean);
      
      if (companyLists.length > 0) {
        request.message = `${trimmed}\n\n【公司列表】${companyLists.join('、')}`;
      }

      // 先发起请求，成功后再设置 threadId
      console.log('[ChatInput] Starting chat stream with request:', request);
      startChatStream(request)
        .then(response => {
          console.log('[ChatInput] Chat stream started successfully:', response);
          
          if (isNewThread) {
            // 只有是新会话时才添加到侧边栏历史记录
            addChatThread(currentThreadId, threadTitle);
            // 设置 threadId 触发 WebSocket 连接
            setThreadId(currentThreadId);
          }
        })
        .catch(err => {
          console.error('[ChatInput] startChatStream failed:', err);
          addMessage(`[错误] 发起对话失败: ${err.message}`, false);
        });
    }
  };

  // deep research toggle handled inline

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn('bg-background pb-4 pt-0', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Textarea
            ref={textareaRef as any}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] max-h-32 resize-none pr-24 rounded-xl shadow-[0_6px_16px_-12px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={2}
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  style={{
                    backgroundColor: webSearchEnabled ? 'var(--primary)' : undefined,
                    color: webSearchEnabled ? 'white' : undefined
                  }}
                  className={`h-8 w-8 rounded-full ${webSearchEnabled ? '!text-white hover:!text-white' : 'text-muted-foreground hover:bg-accent'}`}
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  aria-label={webSearchEnabled ? '联网搜索：开' : '联网搜索：关'}
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{webSearchEnabled ? '联网搜索：开' : '联网搜索：关'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  style={{
                    backgroundColor: deepResearch ? 'var(--primary)' : undefined,
                    color: deepResearch ? 'white' : undefined
                  }}
                  className={`h-8 w-8 rounded-full ${deepResearch ? '!text-white hover:!text-white' : 'text-muted-foreground hover:bg-accent'}`}
                  onClick={() => setDeepResearch(!deepResearch)}
                  aria-label={deepResearch ? '智研：开' : '智研：关'}
                >
                  <Brain className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>{deepResearch ? '智研：开' : '智研：关'}</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 
