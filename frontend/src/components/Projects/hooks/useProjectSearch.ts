import { useState, useCallback, useRef, useEffect } from 'react';
import { searchProjects } from '@/lib/projectApi';
import { ProjectItem } from '@/store/useAppStore';

interface UseProjectSearchOptions {
  /** 防抖延迟（ms），默认 300 */
  debounceMs?: number;
  /** 每页数量，默认 20 */
  limit?: number;
  /** 最小搜索字符数，默认 1 */
  minQueryLength?: number;
}

interface UseProjectSearchReturn {
  /** 搜索关键词 */
  searchQuery: string;
  /** 设置搜索关键词 */
  setSearchQuery: (query: string) => void;
  /** 搜索结果 */
  searchResults: ProjectItem[];
  /** 是否正在搜索 */
  isSearching: boolean;
  /** 搜索错误 */
  searchError: string | null;
  /** 是否有搜索结果（用于判断是否显示搜索结果） */
  hasSearchResults: boolean;
  /** 结果总数 */
  totalResults: number;
  /** 清空搜索 */
  clearSearch: () => void;
}

export function useProjectSearch(options: UseProjectSearchOptions = {}): UseProjectSearchReturn {
  const {
    debounceMs = 300,
    limit = 20,
    minQueryLength = 1,
  } = options;

  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<ProjectItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 执行搜索
  const performSearch = useCallback(async (query: string) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 空查询时清空结果
    if (!query.trim() || query.trim().length < minQueryLength) {
      setSearchResults([]);
      setTotalResults(0);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const { projects, total } = await searchProjects(query.trim(), { limit });
      setSearchResults(projects);
      setTotalResults(total);
    } catch (err) {
      // 忽略 abort 错误
      if (err instanceof Error && err.name === 'AbortError') return;
      
      const message = err instanceof Error ? err.message : '搜索失败';
      console.error('[useProjectSearch] search error:', err);
      setSearchError(message);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [limit, minQueryLength]);

  // 设置搜索关键词（带防抖）
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);

    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = window.setTimeout(() => {
      void performSearch(query);
    }, debounceMs);
  }, [debounceMs, performSearch]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setSearchResults([]);
    setTotalResults(0);
    setSearchError(null);
    setIsSearching(false);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const hasSearchResults = searchQuery.trim().length >= minQueryLength;

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    hasSearchResults,
    totalResults,
    clearSearch,
  };
}
