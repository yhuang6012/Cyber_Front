/**
 * Agent API - 对接后端 Chat API
 * 
 * 基于文档：CHAT_BACKEND_API.md
 * Base URL: /agent
 */

import { useAppStore } from '@/store/useAppStore';

// ==================== Types ====================

export interface ChatRequest {
  thread_id: string; // 必填：会话线程 ID（前端生成并持久化）
  user_id?: string; // 可选：用户 ID（用于记忆命名空间隔离）
  message: string; // 必填：用户输入
  chat_model?: string; // 可选：模型名（如未传使用后端默认）
  enable_websearch?: boolean; // 可选，默认 false：是否启用 web search
  enable_retrieval?: boolean; // 可选：是否启用知识库向量检索工具
  documents?: DocumentMetadata[]; // 可选：上传文档内容
}

export interface DocumentMetadata {
  filename: string;
  format: string;
  markdown_content: string;
}

export interface StreamStartResponse {
  thread_id: string;
  user_id: string | null;
  ws_channel: string; // 历史遗留字段，前端通常不需要
  status: string; // 固定为 "streaming"
}

export interface WebSocketMessage {
  message_id?: string; // Redis Stream 的消息 ID（用于前端保存与续订）
  is_history?: boolean; // 仅历史回放消息携带
  node_name?: string; // 节点名（例如 query_or_respond / tools / custom / workflow）
  message_type: 'token' | 'output' | 'custom' | 'complete' | 'error'; // 事件类型
  status?: string; // 事件状态（例如 streaming / completed / info / failed）
  timestamp?: string; // 时间戳（注意：在 Stream fields 中通常是字符串）
  data?: string; // JSON 字符串（前端需要 JSON.parse）
  execution_time_ms?: string; // 执行耗时（通常是字符串）
  thread_id?: string; // Pub/Sub 模式可能包含
}

export interface HistoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number | null;
  type: string; // 原始消息类型标记（human/ai/tool/system/…）
  artifact?: any; // 某些工具可能附带
}

export interface ThreadHistory {
  thread_id: string;
  messages: HistoryMessage[];
  total_messages: number;
}

export interface ThreadHistoryWithTrace extends ThreadHistory {
  trace_runs?: any[]; // 扁平列表（按 start_time 正序）
  trace_tree?: any; // 树形结构（仅根节点数组，子节点在 children）
  root_run_id?: string; // 根 run id
  total_latency_ms?: number; // 总耗时
  total_tokens?: number; // 总 token
}

export interface MarkItDownResult {
  filename: string;
  status: 'success' | 'error';
  markdown_content?: string;
  error?: string;
}

export interface EmbedResult {
  status: 'embedded' | 'skipped' | 'error';
  chunks_created?: number;
  file_hash?: string;
  message?: string;
  error?: string;
}

export interface EmbedResponse {
  collection_name: string;
  total_chunks_embedded: number;
  results: EmbedResult[];
}

// ==================== Helper Functions ====================

/**
 * 获取统一的 API Base URL
 */
function getApiBase(): string {
  return (import.meta as any).env?.VITE_API_BASE_URL || 
         (import.meta as any).env?.VITE_AGENT_BASE || 
         'https://www.gravaity-cybernaut.top/agent';
}

// ==================== Chat API ====================

/**
 * 启动一次流式对话
 * POST /agent/chat/stream
 */
export async function startChatStream(request: ChatRequest): Promise<StreamStartResponse> {
  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/chat/stream`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 如果已经登录，则在 Header 中附带 Token
  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const token = useAppStore.getState().authToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Chat stream start failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

// ==================== WebSocket ====================

/**
 * 连接 WebSocket 并处理消息
 * /agent/ws/{thread_id}?last_id={last_id}
 */
export function connectWebSocket(
  threadId: string,
  options: {
    lastId?: string; // 断线续订：从该 last_id 之后开始读取新消息
    onMessage: (msg: WebSocketMessage) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
  }
): WebSocket {
  const base = getApiBase();
  
  // 解析 WebSocket base URL
  function resolveWsBase(apiBase: string): string {
    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      return apiBase.replace(/^http/, "ws"); // https -> wss, http -> ws
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const basePath = apiBase.startsWith("/") ? apiBase : `/${apiBase}`;
    return `${protocol}//${window.location.host}${basePath}`;
  }
  
  const wsBase = resolveWsBase(base);
  
  // 获取 token（从 localStorage 或 store）
  const token = localStorage.getItem("access_token") || useAppStore.getState().authToken;
  
  // 构建 WebSocket URL
  let wsUrl = `${wsBase}/ws/${encodeURIComponent(threadId)}`;
  
  // 添加 URL 参数
  const params = new URLSearchParams();
  if (options.lastId) params.append("last_id", options.lastId);
  if (token) params.append("token", token);
  
  if (params.toString()) wsUrl += `?${params.toString()}`;
  
  console.log('[agentApi] WebSocket URL:', wsUrl.replace(token || '', '[TOKEN]'));

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[agentApi] WebSocket connected:', wsUrl.replace(token || '', '[TOKEN]'));
  };

  ws.onmessage = (event) => {
    console.log('[agentApi] WebSocket raw message:', event.data);
    try {
      const msg: WebSocketMessage = JSON.parse(event.data);
      
      // 处理 data 字段：如果是字符串则 parse
      if (msg.data && typeof msg.data === 'string') {
        try {
          const parsed = JSON.parse(msg.data);
          msg.data = parsed;
          console.log('[agentApi] Parsed data field:', parsed);
        } catch {
          // 如果 parse 失败，保持原字符串
          console.log('[agentApi] data field is string (not JSON):', msg.data);
        }
      }
      
      options.onMessage(msg);
    } catch (error) {
      console.error('[agentApi] WebSocket message parse error:', error, event.data);
    }
  };

  ws.onerror = (error) => {
    console.error('[agentApi] WebSocket error:', error);
    if (options.onError) {
      options.onError(error);
    }
  };

  ws.onclose = () => {
    if (options.onClose) {
      options.onClose();
    }
  };

  return ws;
}

// ==================== History API ====================

/**
 * 获取用户可见历史（推荐）
 * GET /agent/chat/threads/{thread_id}/history
 */
export async function getThreadHistory(threadId: string): Promise<ThreadHistory> {
  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/chat/threads/${threadId}/history`;

  const headers: Record<string, string> = {};

  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const token = useAppStore.getState().authToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const resp = await fetch(url, { headers });

  if (resp.status === 404) {
    throw new Error('Thread not found');
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Get thread history failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

/**
 * 获取历史 + Trace（调试用）
 * GET /agent/chat/threads/{thread_id}/history-with-trace
 */
export async function getThreadHistoryWithTrace(threadId: string): Promise<ThreadHistoryWithTrace> {
  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/chat/threads/${threadId}/history-with-trace`;

  const headers: Record<string, string> = {};

  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const token = useAppStore.getState().authToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const resp = await fetch(url, { headers });

  if (resp.status === 404) {
    throw new Error('Thread not found');
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Get thread history with trace failed: ${resp.status} ${text}`);
  }

  return resp.json();
}

/**
 * 删除线程（清空 checkpoint）
 * DELETE /agent/chat/threads/{thread_id}
 */
export async function deleteThread(threadId: string): Promise<void> {
  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/chat/threads/${threadId}`;

  const headers: Record<string, string> = {};

  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const token = useAppStore.getState().authToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const resp = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (resp.status === 204) {
    return; // 成功
  }

  const text = await resp.text().catch(() => '');
  throw new Error(`Delete thread failed: ${resp.status} ${text}`);
}

// ==================== Documents API ====================

/**
 * MarkItDown：上传并转换为 Markdown（流式返回）
 * POST /agent/documents/process-markitdown
 * Content-Type: multipart/form-data
 * Form 字段：files（可重复，最多 2 个文件）
 * 
 * 返回：text/event-stream，每段是一行 data: <json>\n\n
 */
export async function processMarkItDown(
  files: File[],
  onResult: (result: MarkItDownResult) => void
): Promise<void> {
  if (files.length === 0 || files.length > 2) {
    throw new Error('Files count must be between 1 and 2');
  }

  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/documents/process-markitdown`;

  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const headers: Record<string, string> = {};

  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const token = useAppStore.getState().authToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => '');
    throw new Error(`MarkItDown process failed: ${resp.status} ${text}`);
  }

  // 读取流式响应
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 处理 SSE 格式：data: <json>\n\n
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      if (chunk.startsWith('data: ')) {
        const jsonStr = chunk.slice(6).trim();
        try {
          const result: MarkItDownResult = JSON.parse(jsonStr);
          onResult(result);
        } catch (error) {
          console.error('[agentApi] MarkItDown result parse error:', error, jsonStr);
        }
      }
    }
  }

  // 处理剩余数据
  if (buffer.trim()) {
    if (buffer.startsWith('data: ')) {
      const jsonStr = buffer.slice(6).trim();
      try {
        const result: MarkItDownResult = JSON.parse(jsonStr);
        onResult(result);
      } catch (error) {
        console.error('[agentApi] MarkItDown result parse error:', error, jsonStr);
      }
    }
  }
}

/**
 * Embed：上传并写入向量知识库（一次性 JSON 返回）
 * POST /agent/documents/embed
 * Content-Type: multipart/form-data
 * Form 字段：
 *   - files（可重复，最多 4 个文件）
 *   - collection_name（string，可选）：指定向量库 collection
 */
export async function embedDocuments(
  files: File[],
  collectionName?: string
): Promise<EmbedResponse> {
  if (files.length === 0 || files.length > 4) {
    throw new Error('Files count must be between 1 and 4');
  }

  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/documents/embed`;

  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  if (collectionName) {
    formData.append('collection_name', collectionName);
  }

  const headers: Record<string, string> = {};

  try {
    const { useAppStore } = await import('@/store/useAppStore');
    const token = useAppStore.getState().authToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Embed documents failed: ${resp.status} ${text}`);
  }

  return resp.json();
}
