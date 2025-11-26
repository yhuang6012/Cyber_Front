import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/useAppStore';
import { Paperclip, Brain } from 'lucide-react';
// backend streaming replaces local mocks
// import { DEFAULT_AI_RESPONSE, buildResearchReportMessage } from '@/mocks/chat';
import { streamAgent } from '@/lib/agentApi';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ChatInputProps {
  variant?: 'default' | 'glass';
  className?: string;
}

export function ChatInput({ variant = 'default', className }: ChatInputProps) {
  const [input, setInput] = useState('');
  // Fake toggle for UI only. Backend always uses chat mode.
  const [deepResearch, setDeepResearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { addMessage, openCombinedResults, chatDraftAttachments, clearDraftAttachments, setChatExpanded, startAssistantMessage, appendAssistantMessage, setAgentCompanies } = useAppStore();

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
      // keep previous agent structured results until new results arrive
      // clearAgentCompanies();

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
      
      // Stream assistant response
      const aiId = startAssistantMessage();
      // build backend params: ONLY company names
      const companyLists = draftAttachments
        .filter(a => a.type === 'company')
        .map(a => a.title.trim())
        .filter(Boolean);
      const effectiveUserText = companyLists.length > 0
        ? `${trimmed}\n\n【公司列表】${companyLists.join('、')}`
        : trimmed;

      // Debug: explicit log of input and what we will send
      try {
        console.group('[chat] agent request');
        console.log('userText:', effectiveUserText);
        console.log('company_lists:', companyLists);
        console.log('document_data (omitted): true');
        console.groupEnd();
      } catch {}

      // Send WITHOUT attachments/document_data; ONLY company_lists
      streamAgent({
        userText: effectiveUserText,
        // force chat mode: do not send deepresearch options
        mode: undefined,
        company_lists: companyLists.length > 0 ? companyLists : undefined,
      }, (chunk) => {
        if (typeof chunk === 'string' && chunk.trim()) {
          console.log('[chat] token', chunk.slice(0, 80));
        }
        appendAssistantMessage(aiId, chunk);
      }, (payload) => {
        console.log('[chat] structured_data', payload?.type, Array.isArray(payload?.data) ? `items=${payload.data.length}` : '');
        if (payload && payload.type === 'company_list' && Array.isArray(payload.data)) {
          // enter combined results and feed agent companies
          openCombinedResults(trimmed);
          setAgentCompanies(payload.data);
        }
      }).catch(err => {
        console.error('[chat] stream error', err);
        appendAssistantMessage(aiId, `\n[error] ${err.message}`);
      });

      // Heuristic: if user asks to learn about a field, open combined results
      const lower = trimmed.toLowerCase();
      const triggerPatterns = [
        '了解', '介绍', '是什么', '科普', '入门',
        'about ', 'what is ', 'overview', 'learn about'
      ];
      if (triggerPatterns.some(p => lower.includes(p))) {
        openCombinedResults(trimmed);
      }
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
    <div
      className={cn(
        variant === 'glass'
          ? 'bg-background/35 supports-[backdrop-filter]:bg-background/25 backdrop-blur-md border border-border/50 shadow-lg rounded-xl p-3 md:p-4'
          : 'bg-background p-4',
        className
      )}
    >
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Textarea
            ref={textareaRef as any}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] max-h-32 resize-none pr-24"
            rows={2}
          />
          <div className="absolute right-2 top-2 flex gap-1">
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
              className="h-8 w-8"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 