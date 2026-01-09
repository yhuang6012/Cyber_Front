import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/components/ChatPanel/ChatMessage';
import { ChatInput } from '@/components/ChatPanel/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
// import { DEFAULT_AI_RESPONSE } from '@/mocks/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, Loader2, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { connectWebSocket, WebSocketMessage, processMarkItDown } from '@/lib/agentApi';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function ChatPanel() {
  const { 
    messages, 
    threadId, 
    addDraftAttachment, 
    chatDraftAttachments, 
    removeDraftAttachment,
    updateDraftAttachment,
    startAssistantMessage,
    updateAssistantMessage,
    appendAssistantMessage,
    toggleChat
  } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);
  
  const currentAssistantMsgIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 建立 WebSocket 连接
  useEffect(() => {
    if (!threadId) {
      console.log('[ChatPanel] No threadId, skipping WebSocket connection');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    console.log('[ChatPanel] 🔌 Attempting to connect WebSocket for thread:', threadId);

    // 添加一个小延迟确保后端已准备好
    const timeoutId = setTimeout(() => {
      console.log('[ChatPanel] Starting WebSocket connection after delay...');
    }, 100);

    const ws = connectWebSocket(threadId, {
      onMessage: (msg: WebSocketMessage) => {
        console.log('[ChatPanel] WebSocket message:', {
          message_type: msg.message_type,
          node_name: msg.node_name,
          is_history: msg.is_history,
          data_type: typeof msg.data,
          data_preview: typeof msg.data === 'string' ? msg.data.substring(0, 100) : msg.data
        });

        switch (msg.message_type) {
          case 'token':
            // 流式 token
            // data 已经在 agentApi 中被 parse，可能是 string 或 object
            if (msg.data) {
              const tokenText = typeof msg.data === 'string' 
                ? msg.data 
                : (msg.data as any).content || (msg.data as any).token || JSON.stringify(msg.data);
              
              if (tokenText && typeof tokenText === 'string') {
                if (!currentAssistantMsgIdRef.current) {
                  currentAssistantMsgIdRef.current = startAssistantMessage();
                }
                appendAssistantMessage(currentAssistantMsgIdRef.current, tokenText);
              }
            }
            break;

          case 'output':
            // 节点输出
            // data 已经在 agentApi 中被 parse，可能是 string 或 object
            if (msg.data) {
              const data = typeof msg.data === 'object' ? msg.data : {};
              
              // 检查是否有 assistant 角色且没有 tool_calls (表示最终回答)
              if ((data as any).messages && Array.isArray((data as any).messages)) {
                const lastMsg = (data as any).messages[(data as any).messages.length - 1];
                if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.tool_calls && lastMsg.content) {
                  if (!currentAssistantMsgIdRef.current) {
                    currentAssistantMsgIdRef.current = startAssistantMessage();
                  }
                  updateAssistantMessage(currentAssistantMsgIdRef.current, lastMsg.content);
                }
              }
            }
            break;

          case 'complete':
            // 工作流完成
            console.log('[ChatPanel] Workflow complete');
            currentAssistantMsgIdRef.current = null;
            break;

          case 'error':
            // 发生错误
            console.error('[ChatPanel] Workflow error:', msg.data);
            if (currentAssistantMsgIdRef.current) {
              appendAssistantMessage(currentAssistantMsgIdRef.current, `\n[错误] ${typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data)}`);
            }
            currentAssistantMsgIdRef.current = null;
            break;
        }
      },
      onError: (err) => {
        console.error('[ChatPanel] WebSocket error:', err);
      },
      onClose: () => {
        console.log('[ChatPanel] WebSocket closed');
      }
    });

    wsRef.current = ws;

    return () => {
      clearTimeout(timeoutId);
      if (wsRef.current) {
        console.log('[ChatPanel] Cleaning up WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [threadId, startAssistantMessage, updateAssistantMessage, appendAssistantMessage]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // 后端支持的 MarkItDown 格式列表 (根据报错信息)
    const SUPPORTED_EXTS = [
      'csv', 'docx', 'epub', 'gif', 'htm', 'html', 'jpeg', 'jpg', 'json', 
      'm4a', 'mp3', 'pdf', 'png', 'pptx', 'txt', 'wav', 'webp', 'xls', 'xlsx', 'xml', 'zip'
    ];

    // 1. 处理文件拖拽
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      files.forEach(file => {
        const id = crypto.randomUUID();
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isSupported = SUPPORTED_EXTS.includes(ext);
        
        // 添加到草稿列表
        addDraftAttachment({
          id,
          type: 'file',
          title: file.name,
          file_format: ext,
          is_processing: isSupported // 只有支持的格式才显示正在处理
        });

        if (isSupported) {
          // 调用 API 处理支持的文件格式
          processMarkItDown([file], (result) => {
            if (result.status === 'success' && result.markdown_content) {
              updateDraftAttachment(id, {
                content: result.markdown_content,
                is_processing: false
              });
            } else {
              updateDraftAttachment(id, {
                is_processing: false,
                error: result.error || '解析失败'
              });
            }
          }).catch(err => {
            console.error('[ChatPanel] File process error:', err);
            updateDraftAttachment(id, {
              is_processing: false,
              error: err.message || '网络错误'
            });
          });
        } else {
          // 不在支持范围内的格式，如果是文本类文件(如 .md)，尝试在前端读取内容
          if (ext === 'md' || ext === 'txt') {
            const reader = new FileReader();
            reader.onload = (event) => {
              updateDraftAttachment(id, {
                content: event.target?.result as string,
                is_processing: false
              });
            };
            reader.onerror = () => {
              updateDraftAttachment(id, {
                is_processing: false,
                error: '读取本地文件失败'
              });
            };
            reader.readAsText(file);
          } else {
            // 其他完全不支持的格式，仅标记为完成（不带 content，发送时会自动过滤）
            updateDraftAttachment(id, {
              is_processing: false
            });
          }
        }
      });
      return;
    }

    // 2. 处理应用内内容拖拽
    try {
      const rawStr = e.dataTransfer.getData('application/json');
      if (!rawStr) return;
      const raw = JSON.parse(rawStr);
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
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-white h-10 flex items-center px-3 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={toggleChat}
            >
              <ArrowRight className="size-5" strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">收起聊天面板</TooltipContent>
        </Tooltip>
      </div>

      {/* Drop Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 left-0 right-0 bottom-0 bg-primary/10 border-2 border-dashed border-primary z-10 flex items-center justify-center"
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
                <div ref={messagesEndRef} />
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
        <Accordion type="single" collapsible className='mr-4'>
          <AccordionItem value="draft-attachments">
            <AccordionContent className="px-4 pb-1">
              {chatDraftAttachments.length === 0 ? (
                <div className="text-xs text-muted-foreground pl-2">暂无引用，拖拽左侧内容到此处</div>
              ) : (
                <div className="space-y-1">
                  {chatDraftAttachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between text-sm border rounded-md px-2 py-1 bg-muted/20">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {att.type === 'file' ? (
                          <FileText className="size-3.5 text-muted-foreground flex-shrink-0" />
                        ) : null}
                        <div className="truncate font-medium">{att.title}</div>
                        {att.is_processing && (
                          <Loader2 className="size-3 animate-spin text-muted-foreground" />
                        )}
                        {att.error && (
                          <span title={att.error}>
                            <AlertCircle className="size-3 text-destructive" />
                          </span>
                        )}
                      </div>
                      <button 
                        aria-label="删除" 
                        className="text-muted-foreground hover:text-foreground ml-2 p-0.5" 
                        onClick={() => removeDraftAttachment(att.id)}
                      >
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