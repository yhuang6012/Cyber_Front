import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLongAudioTranscriptionStatus, submitLongAudioTranscription } from '@/lib/projectApi';

export type AudioTranscribeTaskStatus =
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed';

export type AudioTranscribeTask = {
  taskId: string;
  fileId: string;
  fileName: string;
  status: AudioTranscribeTaskStatus;
  progress: number; // 0-100（轮询估算/后端返回）
  updatedAt: string;
  raw?: any;
};

function clampProgress(v: any): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function computeNextProgress(prev: number, status: AudioTranscribeTaskStatus): number {
  if (status === 'succeeded') return 100;
  if (status === 'failed') return prev;
  if (status === 'queued') return Math.max(prev, 10);
  // processing
  return Math.min(95, Math.max(prev, 20) + 8);
}

function normalizeTaskStatus(resp: any): AudioTranscribeTaskStatus {
  const ok = resp?.success;
  const s = String(resp?.data?.task_status ?? resp?.data?.status ?? resp?.status ?? '').toUpperCase();

  if (ok === true && s === 'SUCCEEDED') return 'succeeded';
  if (s === 'FAILED' || s === 'FAILURE' || s === 'ERROR') return 'failed';
  if (s === 'PROCESSING' || s === 'RUNNING' || s === 'STARTED') return 'processing';
  return 'queued';
}

export function useAudioTranscribeTasks(options: {
  onAnyTaskSucceeded?: () => void;
  pollIntervalMs?: number;
}) {
  const pollIntervalMs = Math.max(1500, Number(options.pollIntervalMs ?? 5000));

  const [tasks, setTasks] = useState<AudioTranscribeTask[]>([]);
  const tasksRef = useRef<AudioTranscribeTask[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const hasActive = useMemo(
    () => tasks.some(t => t.status === 'queued' || t.status === 'processing'),
    [tasks],
  );

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    const current = tasksRef.current;
    const active = current.filter(t => t.status === 'queued' || t.status === 'processing');
    if (active.length === 0) return;

    console.log('[audio_transcribe] pollOnce active=', active.map(a => ({ taskId: a.taskId, status: a.status, fileName: a.fileName })));

    const updates = await Promise.all(
      active.map(async (t) => {
        try {
          const resp = await getLongAudioTranscriptionStatus(t.taskId, { force_sync: true });
          const status = normalizeTaskStatus(resp);
          const serverProgress =
            clampProgress(resp?.data?.progress) ??
            clampProgress(resp?.data?.percent) ??
            clampProgress(resp?.progress) ??
            clampProgress(resp?.percent);
          const nextProgress =
            serverProgress != null ? serverProgress : computeNextProgress(t.progress ?? 0, status);
          console.log('[audio_transcribe] status <-', { taskId: t.taskId, prev: t.status, next: status }, resp);
          return {
            ...t,
            status,
            progress: nextProgress,
            updatedAt: new Date().toISOString(),
            raw: resp,
          } as AudioTranscribeTask;
        } catch (e) {
          console.warn('[audio_transcribe] poll error', t.taskId, e);
          // 单次失败不改变状态
          return t;
        }
      })
    );

    let anySucceeded = false;
    setTasks(prev => {
      const map = new Map(prev.map(p => [p.taskId, p] as const));
      for (const u of updates) {
        const old = map.get(u.taskId);
        if (!old) continue;
        map.set(u.taskId, u);
        if (old.status !== 'succeeded' && u.status === 'succeeded') anySucceeded = true;
      }
      return Array.from(map.values());
    });

    if (anySucceeded) {
      options.onAnyTaskSucceeded?.();
    }
  }, [options]);

  const ensurePolling = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      void pollOnce();
    }, pollIntervalMs);
  }, [pollIntervalMs, pollOnce]);

  useEffect(() => {
    if (hasActive) ensurePolling();
    else stopPolling();
  }, [ensurePolling, hasActive, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const startTaskForFile = useCallback(async (file: { fileId: string; fileName: string; customPrompt?: string }) => {
    console.log('[audio_transcribe] submit ->', file);
    const resp = await submitLongAudioTranscription({
      file_id: file.fileId,
      model: 'paraformer-v2',
      language_hints: ['zh'],
      ...(file.customPrompt ? { custom_prompt: file.customPrompt } : {}),
    });

    const taskId = String(resp?.task_id ?? resp?.data?.task_id ?? resp?.id ?? '');
    if (!taskId) throw new Error('转写任务提交成功但未返回 task_id');
    console.log('[audio_transcribe] submit response <-', { taskId, fileId: file.fileId, fileName: file.fileName }, resp);

    const task: AudioTranscribeTask = {
      taskId,
      fileId: file.fileId,
      fileName: file.fileName,
      status: 'queued',
      progress: 0,
      updatedAt: new Date().toISOString(),
      raw: resp,
    };

    setTasks(prev => [task, ...prev]);
    ensurePolling();
    return taskId;
  }, [ensurePolling]);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status === 'queued' || t.status === 'processing'));
  }, []);

  return {
    tasks,
    hasActive,
    startTaskForFile,
    clearCompleted,
  };
}
