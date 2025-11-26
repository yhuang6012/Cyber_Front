export type AgentAttachment = {
  id: string;
  type: 'news' | 'research' | 'company';
  title: string;
  content?: string;
};

export type StreamAgentParams = {
  userText: string;
  attachments?: AgentAttachment[];
  threadId?: string;
  mode?: string; // 'deepresearch' when 智研 is on; undefined means chat
  max_research_loops?: number;
  initial_search_query_count?: number;
  company_lists?: string[];
};

export async function streamAgent(
  params: StreamAgentParams,
  onToken: (chunk: string) => void,
  onStructuredData?: (payload: any) => void,
): Promise<void> {
  const base = (import.meta as any).env?.VITE_AGENT_BASE || 'http://54.206.68.240:8001';
  const url = `${base.replace(/\/$/, '')}/agent/stream`;

  const body: any = {
    messages: [
      { role: 'user', content: params.userText },
    ],
    thread_id: params.threadId,
    mode: params.mode,
  };

  if (params.attachments && params.attachments.length > 0) {
    body.document_data = { attachments: params.attachments };
  }

  // pass optional knobs if provided
  if (params.max_research_loops != null) body.max_research_loops = params.max_research_loops;
  if (params.initial_search_query_count != null) body.initial_search_query_count = params.initial_search_query_count;
  if (params.company_lists && params.company_lists.length) body.company_lists = params.company_lists;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Agent stream failed: ${resp.status} ${text}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventData: string[] = [];

  const flushEvent = () => {
    if (eventData.length === 0) return;
    const dataStr = eventData.join('\n');
    eventData = [];
    if (!dataStr || dataStr === '[DONE]') return;
    try {
      const json = JSON.parse(dataStr);
      if (json && json.type === 'structured_data') {
        if (onStructuredData) onStructuredData(json.data);
        return;
      }
      let chunk = '';
      if (json.type === 'token') {
        // In chat mode (no deepresearch), restrict to chat node tokens if provided
        if (!params.mode && json.metadata.langgraph_node && json.metadata.langgraph_node !== 'chat') {
          chunk = '';
        } else {
          chunk = json.content ?? '';
        }
      } else if (json.type === 'error') {
        chunk = `\n[error] ${json.message ?? ''}`;
      } else if (json.type === 'update') {
        chunk = '';
      } else {
        chunk = json.delta ?? json.content ?? json.token ?? json.text ?? '';
      }
      if (typeof chunk === 'string' && chunk.length > 0) {
        onToken(chunk);
      }
    } catch {
      // if not JSON, treat as plain text token
      onToken(dataStr);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const lineRaw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      const line = lineRaw.replace(/\r$/, '');

      if (line === '') {
        // end of one SSE event
        flushEvent();
        continue;
      }

      if (line.startsWith('data:')) {
        const part = line.slice(5).trimStart();
        // multiple data: lines join with \n per SSE spec
        eventData.push(part);
      }
      // ignore other fields (id:, event:, retry:)
    }
  }

  // flush remaining partial event
  flushEvent();
}


