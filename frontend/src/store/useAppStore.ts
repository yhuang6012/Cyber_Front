import { create } from 'zustand';
import { mockKnowledgeReports, mockFolders, mockFiles, mockProjects, mockPersons } from '@/mocks';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  source?: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  abstract: string;
  date: string;
  authors?: string[];
  source?: string;
}

export interface CompanyItem {
  id: string;
  name: string;
  ticker?: string;
  sector?: string;
  description: string;
  headquarters?: string;
  founded?: string;
}

export interface PersonItem {
  id: string;
  name: string;
  englishName?: string;
  currentCompany?: string;
  currentPosition?: string;
  // 技术标签
  techTags?: string[];
  // 学历标签
  educationTags?: string[];
  // 工作标签
  workTags?: string[];
  // 赛道标签
  industryTags?: string[];
  // 重要人员关联
  relatedPersons?: string[];
  // 主要机构
  institutions?: string[];
  // 技术介绍
  description?: string;
}

export type FavoriteType = 'news' | 'research' | 'company' | 'person';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  summary?: string;
  date?: string;
  source?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isUser?: boolean;
}

export interface ResearchReport {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface KnowledgeReport {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string; // 行业、技术、市场等分类
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  wordCount: number;
}

export interface AgentCompany {
  company_id: number;
  company_name: string;
  team_cell?: string[];
  financing_round?: Array<{ date: string | null; round: string; amount: string }>;
  patent_3m_count?: number;
  news_emotion_sum?: number;
  news_latest3?: Array<{ url: string; date: string; title: string }>;
  tags?: string[];
  establish_time?: string;
  social_staff_num?: number;
  province?: string | null;
  short_intro?: string;
  latest_round?: string | null;
  latest_amount?: string | null;
  latest_finance_date?: string | null;
}

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  sourceFileName?: string;
  createdAt: string;
  // Status
  status: 'accepted' | 'pending' | 'established'; // 已受理 / 未受理 / 已立项
  // Contact & Source
  uploader?: string; // 项目来源（上传人）
  founderName?: string; // 项目联系人（创始人）
  founderContact?: string; // 联系方式
  projectLead?: string; // 项目负责人
  // Company Info
  companyName?: string;
  companyAddress?: string;
  industry?: string; // 公司领域/所属行业
  // Team & Product
  coreTeam?: string; // 核心团队描述
  coreProduct?: string; // 核心产品
  coreTechnology?: string; // 核心技术
  // Market & Competition
  competition?: string; // 竞争情况
  marketSize?: string; // 市场空间
  // Finance
  financialStatus?: string; // 财务情况
  fundingStatus?: string; // 融资情况
  // Keywords
  keywords?: string[]; // 关键词（技术、团队背景、人才、融资相关）
}

export interface UploadedFileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  folderId?: string; // Optional folder assignment
}

export interface FileFolder {
  id: string;
  name: string;
  parentId?: string; // For nested folders (future)
  createdAt: string;
  color?: string; // Optional color tag
}

// Upload task for tracking file uploads
export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'parsing' | 'completed' | 'error';
  uploadProgress: number; // 0-100
  parseProgress: number; // 0-100
  error?: string;
  createdAt: string;
  completedAt?: string;
  projectId?: string; // The generated project ID after parsing
}

// Notes used in Smart Canvas
export interface SmartNoteItem {
  id: string;
  type: FavoriteType;
  title: string;
  content?: string;
}

interface AppState {
  // Current User
  currentUser: string;
  setCurrentUser: (name: string) => void;
  
  // News state
  newsItems: NewsItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setNewsItems: (items: NewsItem[]) => void;
  filteredNews: () => NewsItem[];
  
  // Research state
  researchItems: ResearchItem[];
  setResearchItems: (items: ResearchItem[]) => void;
  filteredResearch: () => ResearchItem[];
  
  // Company state
  companyItems: CompanyItem[];
  setCompanyItems: (items: CompanyItem[]) => void;
  filteredCompanies: () => CompanyItem[];
  
  // Person state
  personItems: PersonItem[];
  setPersonItems: (items: PersonItem[]) => void;
  filteredPersons: () => PersonItem[];
  
  // Chat state
  messages: ChatMessage[];
  addMessage: (content: string, isUser?: boolean) => void;
  clearMessages: () => void;
  startAssistantMessage: () => string; // returns id
  appendAssistantMessage: (id: string, delta: string) => void;
  // Chat draft attachments (e.g., dropped items before sending)
  chatDraftAttachments: { id: string; type: FavoriteType; title: string; content?: string }[];
  addDraftAttachment: (att: { id: string; type: FavoriteType; title: string; content?: string }) => void;
  removeDraftAttachment: (id: string) => void;
  clearDraftAttachments: () => void;
  
  // Research reports
  researchReports: ResearchReport[];
  addResearchReport: (report: Omit<ResearchReport, 'id' | 'createdAt'> & Partial<Pick<ResearchReport, 'id' | 'createdAt'>>) => void;
  removeResearchReport: (id: string) => void;
  setResearchReports: (reports: ResearchReport[]) => void;
  
  // UI state
  isChatExpanded: boolean;
  toggleChat: () => void;
  setChatExpanded: (expanded: boolean) => void;
  
  // Panel state
  activePanel: 'news' | 'workspace' | 'projects' | 'knowledge';
  setActivePanel: (panel: 'news' | 'workspace' | 'projects' | 'knowledge') => void;

  // Knowledge Base
  knowledgeReports: KnowledgeReport[];
  addKnowledgeReport: (report: Omit<KnowledgeReport, 'id' | 'createdAt' | 'wordCount'> & Partial<Pick<KnowledgeReport, 'id' | 'createdAt'>>) => void;
  removeKnowledgeReport: (id: string) => void;
  updateKnowledgeReport: (id: string, updates: Partial<KnowledgeReport>) => void;

  // Projects
  projects: ProjectItem[];
  addProject: (p: Omit<ProjectItem, 'id' | 'createdAt'> & Partial<Pick<ProjectItem, 'id' | 'createdAt'>>) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  setProjects: (list: ProjectItem[]) => void;
  addProjectsFromFiles: (files: File[]) => Promise<void>;
  uploadedFiles: UploadedFileMeta[];
  removeUploadedFiles: (ids: string[]) => void;
  
  // File Folders
  folders: FileFolder[];
  addFolder: (name: string, color?: string) => void;
  removeFolder: (id: string) => void;
  updateFolder: (id: string, updates: Partial<FileFolder>) => void;
  moveFileToFolder: (fileId: string, folderId?: string) => void;

  // Upload Tasks
  uploadTasks: UploadTask[];
  addUploadTask: (fileName: string, fileSize: number) => string; // returns task id
  updateUploadTask: (id: string, updates: Partial<UploadTask>) => void;
  removeUploadTask: (id: string) => void;
  clearCompletedTasks: () => void;
  hasActiveUploads: () => boolean;

  // Smart Canvas (right of chat)
  smartCanvasOpen: boolean;
  setSmartCanvasOpen: (open: boolean) => void;
  toggleSmartCanvas: () => void;
  smartNotes: SmartNoteItem[];
  addSmartNote: (item: SmartNoteItem) => void;
  removeSmartNote: (id: string) => void;
  clearSmartNotes: () => void;
  sortSmartNotes: () => void;

  // Combined results mode (triggered from chat domain queries)
  combinedResultsEnabled: boolean;
  combinedQuery: string;
  openCombinedResults: (query: string) => void;
  closeCombinedResults: () => void;
  resetToInitialNews: () => void;

  // Agent structured companies for combined mode
  agentCompanies: AgentCompany[];
  setAgentCompanies: (list: AgentCompany[]) => void;
  clearAgentCompanies: () => void;

  // Favorites
  favorites: FavoriteItem[];
  favoriteFilters: FavoriteType[]; // empty means all
  setFavoriteFilters: (types: FavoriteType[]) => void;
  clearFavoriteFilters: () => void;
  filteredFavorites: () => FavoriteItem[];
  isFavorite: (type: FavoriteType, id: string) => boolean;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (type: FavoriteType, id: string) => void;
  toggleFavoriteNews: (item: NewsItem) => void;
  toggleFavoriteResearch: (item: ResearchItem) => void;
  toggleFavoriteCompany: (item: CompanyItem) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Current User
  currentUser: '王芳', // 默认当前用户
  setCurrentUser: (name: string) => set({ currentUser: name }),
  
  // News state
  newsItems: [],
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setNewsItems: (items: NewsItem[]) => set({ newsItems: items }),
  filteredNews: () => {
    const { newsItems, searchQuery } = get();
    if (!searchQuery.trim()) return newsItems;
    const lowerQuery = searchQuery.toLowerCase();
    return newsItems.filter(
      item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.content.toLowerCase().includes(lowerQuery) ||
        item.source?.toLowerCase().includes(lowerQuery)
    );
  },
  
  // Research state
  researchItems: [],
  setResearchItems: (items: ResearchItem[]) => set({ researchItems: items }),
  filteredResearch: () => {
    const { researchItems, searchQuery } = get();
    if (!searchQuery.trim()) return researchItems;
    const lowerQuery = searchQuery.toLowerCase();
    return researchItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.abstract.toLowerCase().includes(lowerQuery) ||
      item.source?.toLowerCase().includes(lowerQuery) ||
      (item.authors ?? []).some(a => a.toLowerCase().includes(lowerQuery))
    );
  },
  
  // Company state
  companyItems: [],
  setCompanyItems: (items: CompanyItem[]) => set({ companyItems: items }),
  filteredCompanies: () => {
    const { companyItems, searchQuery } = get();
    if (!searchQuery.trim()) return companyItems;
    const lowerQuery = searchQuery.toLowerCase();
    return companyItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.ticker ?? '').toLowerCase().includes(lowerQuery) ||
      (item.sector ?? '').toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      (item.headquarters ?? '').toLowerCase().includes(lowerQuery)
    );
  },
  
  // Person state
  personItems: mockPersons,
  setPersonItems: (items: PersonItem[]) => set({ personItems: items }),
  filteredPersons: () => {
    const { personItems, searchQuery } = get();
    if (!searchQuery.trim()) return personItems;
    const lowerQuery = searchQuery.toLowerCase();
    return personItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.englishName ?? '').toLowerCase().includes(lowerQuery) ||
      (item.currentCompany ?? '').toLowerCase().includes(lowerQuery) ||
      (item.currentPosition ?? '').toLowerCase().includes(lowerQuery) ||
      (item.description ?? '').toLowerCase().includes(lowerQuery) ||
      (item.techTags ?? []).some(t => t.toLowerCase().includes(lowerQuery)) ||
      (item.educationTags ?? []).some(t => t.toLowerCase().includes(lowerQuery)) ||
      (item.workTags ?? []).some(t => t.toLowerCase().includes(lowerQuery)) ||
      (item.industryTags ?? []).some(t => t.toLowerCase().includes(lowerQuery)) ||
      (item.institutions ?? []).some(t => t.toLowerCase().includes(lowerQuery))
    );
  },
  
  // Chat state
  messages: [],
  chatDraftAttachments: [],
  addMessage: (content: string, isUser = true) => set(state => ({
    messages: [...state.messages, {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date().toISOString(),
      isUser,
    }]
  })),
  clearMessages: () => set({ messages: [] }),
  startAssistantMessage: () => {
    const id = crypto.randomUUID();
    set(state => ({
      messages: [...state.messages, {
        id,
        content: '',
        timestamp: new Date().toISOString(),
        isUser: false,
      }]
    }));
    return id;
  },
  appendAssistantMessage: (id: string, delta: string) => set(state => ({
    messages: state.messages.map(m => m.id === id ? { ...m, content: (m.content + delta) } : m)
  })),
  addDraftAttachment: (att) => set(state => {
    const exists = state.chatDraftAttachments.some(a => a.id === att.id && a.type === att.type);
    if (exists) return {} as any;
    return { chatDraftAttachments: [...state.chatDraftAttachments, att] } as any;
  }),
  removeDraftAttachment: (id: string) => set(state => ({
    chatDraftAttachments: state.chatDraftAttachments.filter(a => a.id !== id)
  })),
  clearDraftAttachments: () => set({ chatDraftAttachments: [] }),
  
  // Research reports
  researchReports: [],
  addResearchReport: (report) => set(state => {
    const id = report.id ?? crypto.randomUUID();
    const createdAt = report.createdAt ?? new Date().toISOString();
    const newReport: ResearchReport = { id, title: report.title, content: report.content, createdAt };
    return { researchReports: [newReport, ...state.researchReports] };
  }),
  removeResearchReport: (id: string) => set(state => ({
    researchReports: state.researchReports.filter(r => r.id !== id)
  })),
  setResearchReports: (reports: ResearchReport[]) => set({ researchReports: reports }),
  
  // UI state
  isChatExpanded: false,
  toggleChat: () => set(state => ({ isChatExpanded: !state.isChatExpanded })),
  setChatExpanded: (expanded: boolean) => set({ isChatExpanded: expanded }),
  
  // Panel state
  activePanel: 'workspace',
  setActivePanel: (panel: 'news' | 'workspace' | 'projects' | 'knowledge') => set({ activePanel: panel }),

  // Knowledge Base
  knowledgeReports: mockKnowledgeReports,
  addKnowledgeReport: (report) => set(state => {
    const id = report.id ?? crypto.randomUUID();
    const createdAt = report.createdAt ?? new Date().toISOString();
    const wordCount = report.content.length;
    const newReport: KnowledgeReport = {
      ...report,
      id,
      createdAt,
      wordCount,
    };
    return { knowledgeReports: [newReport, ...state.knowledgeReports] };
  }),
  removeKnowledgeReport: (id: string) => set(state => ({
    knowledgeReports: state.knowledgeReports.filter(r => r.id !== id)
  })),
  updateKnowledgeReport: (id: string, updates: Partial<KnowledgeReport>) => set(state => ({
    knowledgeReports: state.knowledgeReports.map(r => 
      r.id === id ? { ...r, ...updates, wordCount: updates.content ? updates.content.length : r.wordCount } : r
    )
  })),

  // Projects
  projects: mockProjects,
  uploadedFiles: mockFiles,
  
  // File Folders
  folders: mockFolders,
  addProject: (p) => set(state => {
    const id = p.id ?? crypto.randomUUID();
    const createdAt = p.createdAt ?? new Date().toISOString();
    const proj: ProjectItem = {
      ...p,
      id,
      createdAt,
    };
    return { projects: [proj, ...state.projects] };
  }),
  removeProject: (id: string) => set(state => ({
    projects: state.projects.filter(p => p.id !== id)
  })),
  updateProject: (id: string, updates: Partial<ProjectItem>) => set(state => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates} : p)
  })),
  setProjects: (list: ProjectItem[]) => set({ projects: list }),
  addProjectsFromFiles: async (files: File[]) => {
    // Helpers
    const parseCsv = async (file: File): Promise<ProjectItem[]> => {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) return [];
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const nameIdx =
        headers.findIndex(h => ['name', 'project', 'title', '项目', '项目名称'].includes(h.toLowerCase())) >= 0
          ? headers.findIndex(h => ['name', 'project', 'title', '项目', '项目名称'].includes(h.toLowerCase()))
          : 0;
      const descIdx =
        headers.findIndex(h => ['description', 'desc', '摘要', '简介'].includes(h.toLowerCase()));
      const now = new Date().toISOString();
      const rows: ProjectItem[] = dataLines.map((line) => {
        // naive CSV split; sufficient for simple uploads
        const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = (cells[nameIdx] ?? '').trim() || file.name;
        const description = descIdx >= 0 ? (cells[descIdx] ?? '').trim() : undefined;
        return {
          id: crypto.randomUUID(),
          name,
          description,
          status: 'pending',
          tags: [],
          sourceFileName: file.name,
          createdAt: now,
        };
      });
      return rows;
    };
    const toTextSummary = (text: string, max = 160) =>
      text.replace(/\s+/g, ' ').slice(0, max).trim();

    const newProjects: ProjectItem[] = [];
    const newFileMetas: UploadedFileMeta[] = [];
    for (const file of files) {
      newFileMetas.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size ?? 0,
        type: file.type ?? '',
        createdAt: new Date().toISOString(),
      });
      try {
        if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
          const rows = await parseCsv(file);
          newProjects.push(...rows);
          continue;
        }
        if (file.type.includes('json') || file.name.toLowerCase().endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            for (const item of data) {
              const name = String(item.name ?? item.title ?? item.project ?? file.name);
              const description = item.description ?? item.desc ?? '';
              newProjects.push({
                id: crypto.randomUUID(),
                name,
                description,
                status: 'pending',
                tags: Array.isArray(item.tags) ? item.tags : [],
                sourceFileName: file.name,
                createdAt: new Date().toISOString(),
              });
            }
          } else {
            const name = String(data.name ?? data.title ?? data.project ?? file.name);
            const description = data.description ?? data.desc ?? '';
            newProjects.push({
              id: crypto.randomUUID(),
              name,
              description,
              status: 'pending',
              tags: Array.isArray((data as any).tags) ? (data as any).tags : [],
              sourceFileName: file.name,
              createdAt: new Date().toISOString(),
            });
          }
          continue;
        }
        // Fallback: treat as text; create one project per file
        const text = await file.text().catch(() => '');
        newProjects.push({
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, ''),
          description: text ? toTextSummary(text) : undefined,
          status: 'pending',
          tags: [],
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // On parsing failure, still create a basic card
        newProjects.push({
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, ''),
          description: undefined,
          status: 'pending',
          tags: [],
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
        });
      }
    }
    set(state => ({ 
      projects: [...newProjects, ...state.projects],
      uploadedFiles: [...newFileMetas, ...state.uploadedFiles],
    }));
  },
  
  // Folder operations
  addFolder: (name: string, color?: string) => set(state => ({
    folders: [
      ...state.folders,
      {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        color,
      },
    ],
  })),
  removeFolder: (id: string) => set(state => ({
    folders: state.folders.filter(f => f.id !== id),
    uploadedFiles: state.uploadedFiles.map(file =>
      file.folderId === id ? { ...file, folderId: undefined } : file
    ),
  })),
  updateFolder: (id: string, updates: Partial<FileFolder>) => set(state => ({
    folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f),
  })),
  moveFileToFolder: (fileId: string, folderId?: string) => set(state => ({
    uploadedFiles: state.uploadedFiles.map(f =>
      f.id === fileId ? { ...f, folderId } : f
    ),
  })),

  // Uploaded files batch operations
  removeUploadedFiles: (ids: string[]) => set(state => ({
    uploadedFiles: state.uploadedFiles.filter(f => !ids.includes(f.id)),
  })),

  // Upload Tasks
  uploadTasks: [],
  addUploadTask: (fileName: string, fileSize: number) => {
    const id = crypto.randomUUID();
    set(state => ({
      uploadTasks: [
        ...state.uploadTasks,
        {
          id,
          fileName,
          fileSize,
          status: 'uploading',
          uploadProgress: 0,
          parseProgress: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    return id;
  },
  updateUploadTask: (id: string, updates: Partial<UploadTask>) => set(state => ({
    uploadTasks: state.uploadTasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ),
  })),
  removeUploadTask: (id: string) => set(state => ({
    uploadTasks: state.uploadTasks.filter(task => task.id !== id),
  })),
  clearCompletedTasks: () => set(state => ({
    uploadTasks: state.uploadTasks.filter(
      task => task.status !== 'completed' && task.status !== 'error'
    ),
  })),
  hasActiveUploads: () => {
    const { uploadTasks } = get();
    return uploadTasks.some(
      task => task.status === 'uploading' || task.status === 'parsing'
    );
  },

  // Smart Canvas state
  smartCanvasOpen: false,
  setSmartCanvasOpen: (open: boolean) => set({ smartCanvasOpen: open }),
  toggleSmartCanvas: () => set(state => ({ smartCanvasOpen: !state.smartCanvasOpen })),
  smartNotes: [],
  addSmartNote: (item) => set(state => ({ smartNotes: [item, ...state.smartNotes] })),
  removeSmartNote: (id: string) => set(state => ({ smartNotes: state.smartNotes.filter(n => n.id !== id) })),
  clearSmartNotes: () => set({ smartNotes: [] }),
  sortSmartNotes: () => set(state => {
    const order: Record<string, number> = { company: 0, research: 1, news: 2 } as any;
    const sorted = [...state.smartNotes].sort((a, b) => {
      const ta = (order as any)[a.type] ?? 99;
      const tb = (order as any)[b.type] ?? 99;
      if (ta !== tb) return ta - tb;
      return (a.title || '').localeCompare(b.title || '');
    });
    return { smartNotes: sorted } as any;
  }),

  // Combined results mode
  combinedResultsEnabled: false,
  combinedQuery: '',
  openCombinedResults: (query: string) => set(() => {
    const q = query.trim();
    return {
      combinedResultsEnabled: true,
      combinedQuery: q,
      searchQuery: q,
      activePanel: 'news',
    };
  }),
  closeCombinedResults: () => set(() => ({ combinedResultsEnabled: false })),
  resetToInitialNews: () => set(() => ({ combinedResultsEnabled: false, searchQuery: '' })),

  // Agent structured companies
  agentCompanies: [],
  setAgentCompanies: (list) => set({ agentCompanies: list ?? [] }),
  clearAgentCompanies: () => set({ agentCompanies: [] }),

  // Favorites
  favorites: [],
  favoriteFilters: [],
  setFavoriteFilters: (types: FavoriteType[]) => set({ favoriteFilters: types }),
  clearFavoriteFilters: () => set({ favoriteFilters: [] }),
  filteredFavorites: () => {
    const { favorites, favoriteFilters } = get();
    if (!favoriteFilters.length) return favorites;
    const setTypes = new Set(favoriteFilters);
    return favorites.filter(f => setTypes.has(f.type));
  },
  isFavorite: (type: FavoriteType, id: string) => {
    const { favorites } = get();
    return favorites.some(f => f.type === type && f.id === id);
  },
  addFavorite: (item: FavoriteItem) => set(state => {
    const exists = state.favorites.some(f => f.type === item.type && f.id === item.id);
    if (exists) return {};
    return { favorites: [item, ...state.favorites] };
  }),
  removeFavorite: (type: FavoriteType, id: string) => set(state => ({
    favorites: state.favorites.filter(f => !(f.type === type && f.id === id))
  })),
  toggleFavoriteNews: (item: NewsItem) => set(state => {
    const isFav = state.favorites.some(f => f.type === 'news' && f.id === item.id);
    if (isFav) {
      return { favorites: state.favorites.filter(f => !(f.type === 'news' && f.id === item.id)) };
    }
    const fav: FavoriteItem = {
      id: item.id,
      type: 'news',
      title: item.title,
      summary: item.content,
      date: item.date,
      source: item.source,
    };
    return { favorites: [fav, ...state.favorites] };
  }),
  toggleFavoriteResearch: (item: ResearchItem) => set(state => {
    const isFav = state.favorites.some(f => f.type === 'research' && f.id === item.id);
    if (isFav) {
      return { favorites: state.favorites.filter(f => !(f.type === 'research' && f.id === item.id)) };
    }
    const fav: FavoriteItem = {
      id: item.id,
      type: 'research',
      title: item.title,
      summary: item.abstract,
      date: item.date,
      source: item.source,
    };
    return { favorites: [fav, ...state.favorites] };
  }),
  toggleFavoriteCompany: (item: CompanyItem) => set(state => {
    const isFav = state.favorites.some(f => f.type === 'company' && f.id === item.id);
    if (isFav) {
      return { favorites: state.favorites.filter(f => !(f.type === 'company' && f.id === item.id)) };
    }
    const fav: FavoriteItem = {
      id: item.id,
      type: 'company',
      title: item.name,
      summary: item.description,
      source: item.sector,
    };
    return { favorites: [fav, ...state.favorites] };
  }),
}));
