import { useState, useEffect } from 'react';
import { InfoCard } from '@/components/NewsPanel/InfoCard';
import { PersonCard } from '@/components/NewsPanel/PersonCard';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, NewsItem, ResearchItem, CompanyItem, AgentCompany, PersonItem } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Newspaper, GraduationCap, Building2, User, Search } from 'lucide-react';

export function NewsPanel() {
  const {
    combinedResultsEnabled,
    combinedQuery,
    resetToInitialNews,
    // raw datasets for filtering
    newsItems: allNews,
    researchItems: allResearch,
    companyItems: allCompanies,
    personItems: allPersons,
    agentCompanies,
  } = useAppStore();

  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Helpers for combined mode keyword extraction and matching
  const extractKeywords = (q: string): string[] => {
    let text = (q || '').toLowerCase().trim();
    const stopPhrases = [
      '想了解一下', '了解一下', '想了解', '介绍一下', '介绍', '是什么', '科普', '入门', '关于',
      'learn about', 'what is', 'overview', 'about'
    ];
    for (const phrase of stopPhrases) {
      if (phrase) {
        text = text.split(phrase).join('');
      }
    }
    text = text.trim();
    if (!text) return [];
    const tokens = text.includes(' ') ? text.split(/\s+/).filter(Boolean) : [text];
    const synonymMap: Record<string, string[]> = {
      '脑机接口': ['bci', 'brain-computer interface', '脑机', '神经接口', '神经技术', 'neurotechnology', 'neurotech'],
      'bci': ['脑机接口', 'brain-computer interface', '脑机', '神经接口', 'neurotechnology', 'neurotech'],
      'brain-computer interface': ['脑机接口', 'bci', 'neurotechnology', 'neurotech'],
      'neurotechnology': ['神经技术', '脑机接口', 'neurotech', 'bci'],
      'neurotech': ['neurotechnology', '脑机接口', 'bci'],
    };
    const expanded = new Set<string>();
    for (const t of tokens) {
      expanded.add(t);
      Object.keys(synonymMap).forEach(key => {
        if (t.includes(key)) {
          synonymMap[key].forEach(s => expanded.add(s));
        }
      });
    }
    return Array.from(expanded);
  };

  const includesAny = (haystack: string, keys: string[]) => {
    const s = (haystack || '').toLowerCase();
    return keys.some(k => k && s.includes(k));
  };

  const filterCompaniesByKeywords = (items: CompanyItem[], keys: string[]) =>
    keys.length === 0 ? items : items.filter(c =>
      includesAny(c.name, keys) ||
      includesAny(c.ticker ?? '', keys) ||
      includesAny(c.sector ?? '', keys) ||
      includesAny(c.description, keys) ||
      includesAny(c.headquarters ?? '', keys)
    );

  const filterResearchByKeywords = (items: ResearchItem[], keys: string[]) =>
    keys.length === 0 ? items : items.filter(r =>
      includesAny(r.title, keys) ||
      includesAny(r.abstract, keys) ||
      includesAny(r.source ?? '', keys) ||
      (r.authors ?? []).some(a => includesAny(a, keys))
    );

  const filterNewsByKeywords = (items: NewsItem[], keys: string[]) =>
    keys.length === 0 ? items : items.filter(n =>
      includesAny(n.title, keys) ||
      includesAny(n.content, keys) ||
      includesAny(n.source ?? '', keys)
    );

  const filterPersonsByKeywords = (items: PersonItem[], keys: string[]) =>
    keys.length === 0 ? items : items.filter(p =>
      includesAny(p.name, keys) ||
      includesAny(p.englishName ?? '', keys) ||
      includesAny(p.currentCompany ?? '', keys) ||
      includesAny(p.currentPosition ?? '', keys) ||
      includesAny(p.description ?? '', keys) ||
      (p.techTags ?? []).some(t => includesAny(t, keys)) ||
      (p.educationTags ?? []).some(t => includesAny(t, keys)) ||
      (p.workTags ?? []).some(t => includesAny(t, keys)) ||
      (p.industryTags ?? []).some(t => includesAny(t, keys))
    );

  // Use local search query for filtering
  const searchQuery = localSearchQuery;
  const keywords = extractKeywords(searchQuery);
  
  // Filter all datasets by local search
  const newsItems = filterNewsByKeywords(allNews, keywords);
  const researchItems = filterResearchByKeywords(allResearch, keywords);
  const companyItems = filterCompaniesByKeywords(allCompanies, keywords);
  const personItems = filterPersonsByKeywords(allPersons, keywords);
  
  // Combined mode still uses the same filtered results
  const combinedCompanies = combinedResultsEnabled ? companyItems : [];
  const combinedResearch = combinedResultsEnabled ? researchItems : [];
  const combinedNews = combinedResultsEnabled ? newsItems : [];
  const combinedPersons = combinedResultsEnabled ? personItems : [];

  const usingAgentCompanies = (agentCompanies?.length ?? 0) > 0;
  const companyCount = usingAgentCompanies ? agentCompanies.length : combinedCompanies.length;

  const [activeTab, setActiveTab] = useState<'news' | 'research' | 'company' | 'person'>('news');
  const [visibleCompanyCount, setVisibleCompanyCount] = useState(10);

  useEffect(() => {
    // reset pagination when source list or combined mode changes
    setVisibleCompanyCount(10);
  }, [combinedResultsEnabled, companyCount]);

  const companiesForRender = (usingAgentCompanies ? agentCompanies : combinedCompanies).slice(0, visibleCompanyCount) as Array<AgentCompany | CompanyItem>;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-border">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {combinedResultsEnabled
                  ? `组合结果：${(combinedQuery || searchQuery || '').trim()}`
                  : (searchQuery?.trim() ? `搜索结果：${searchQuery}` : '最新资讯')}
              </h2>
              <p className="text-muted-foreground">
                {combinedResultsEnabled
                  ? `公司 ${companyCount} · 研究 ${combinedResearch.length} · 人物 ${combinedPersons.length} · 资讯 ${combinedNews.length}`
                  : (searchQuery?.trim()
                    ? `共找到 资讯 ${newsItems.length}，研究 ${researchItems.length}，公司 ${companyItems.length}，人物 ${personItems.length}`
                    : '将左侧任何文章拖拽到聊天区即可讨论')}
              </p>
            </div>
            {combinedResultsEnabled && (
              <button
                type="button"
                onClick={resetToInitialNews}
                className="text-sm text-muted-foreground hover:text-foreground border px-3 py-1.5 rounded-md"
                aria-label="返回新闻视图"
              >
                返回新闻视图
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="搜索新闻、研究、公司、人物..."
              className="pl-9 h-9"
            />
          </div>

          {/* Tabs hidden when combined results enabled */}
          {!combinedResultsEnabled && (
          <div className="flex items-center gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab('news')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'news'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'news'}
            >
              <Newspaper className="size-4" />
              新闻资讯
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'company'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'company'}
            >
              <Building2 className="size-4" />
              公司信息
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('research')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'research'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'research'}
            >
              <GraduationCap className="size-4" />
              学术研究
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('person')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'person'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'person'}
            >
              <User className="size-4" />
              人物信息
            </button>
          </div>
          )}
        </div>
      </div>

      {/* News List - Scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Combined Results Mode: company -> research -> news */}
            {combinedResultsEnabled && (
              <div className="space-y-8">
                {/* Companies */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="size-4" />
                    <h3 className="font-semibold">公司信息</h3>
                    <span className="text-xs text-muted-foreground">{companyCount}</span>
                  </div>
                  {companyCount > 0 ? (
                    <>
                      <div className="grid gap-4">
                        {companiesForRender.map((c: any, index: number) => (
                          <motion.div key={(c.id ?? c.company_id ?? index).toString()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                            <InfoCard kind="company" item={c} />
                          </motion.div>
                        ))}
                      </div>
                      {companyCount > visibleCompanyCount && (
                        <div className="flex justify-center mt-3">
                          <button
                            type="button"
                            onClick={() => setVisibleCompanyCount(v => Math.min(v + 10, companyCount))}
                            className="text-sm border rounded-md px-3 py-1 hover:bg-accent"
                            aria-label="加载更多公司"
                          >
                            更多
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">未找到相关公司</div>
                  )}
                </div>

                {/* Persons */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="size-4" />
                    <h3 className="font-semibold">人物信息</h3>
                    <span className="text-xs text-muted-foreground">{combinedPersons.length}</span>
                  </div>
                  {combinedPersons.length > 0 ? (
                    <div className="grid gap-4">
                      {combinedPersons.map((p: PersonItem, index: number) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                          <PersonCard person={p} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">未找到相关人物</div>
                  )}
                </div>

                {/* Research */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="size-4" />
                    <h3 className="font-semibold">学术研究</h3>
                    <span className="text-xs text-muted-foreground">{combinedResearch.length}</span>
                  </div>
                  {combinedResearch.length > 0 ? (
                    <div className="grid gap-4">
                      {combinedResearch.map((r: ResearchItem, index: number) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                          <InfoCard kind="research" item={r} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">未找到相关研究</div>
                  )}
                </div>

                {/* News */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Newspaper className="size-4" />
                    <h3 className="font-semibold">新闻资讯</h3>
                    <span className="text-xs text-muted-foreground">{combinedNews.length}</span>
                  </div>
                  {combinedNews.length > 0 ? (
                    <motion.div 
                      className="grid gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {combinedNews.map((news: NewsItem, index: number) => (
                        <motion.div key={news.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}>
                          <InfoCard kind="news" item={news} />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-sm text-muted-foreground">未找到了相关新闻</div>
                  )}
                </div>
              </div>
            )}
            {!combinedResultsEnabled && activeTab === 'news' && (
              newsItems.length > 0 ? (
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {newsItems.map((news: NewsItem, index: number) => (
                    <motion.div
                      key={news.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <InfoCard kind="news" item={news} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="text-6xl mb-4">📰</div>
                  <h3 className="text-lg font-medium mb-2">未找到相关文章</h3>
                  <p className="text-center">请调整搜索词或稍后再试。</p>
                </div>
              )
            )}

            {!combinedResultsEnabled && activeTab === 'research' && (
              researchItems.length > 0 ? (
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {researchItems.map((r: ResearchItem, index: number) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.06 }}
                    >
                      <InfoCard kind="research" item={r} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-lg font-medium mb-2">未找到相关研究</h3>
                  <p className="text-center">请尝试其他关键词。</p>
                </div>
              )
            )}

            {!combinedResultsEnabled && activeTab === 'company' && (
              companyItems.length > 0 ? (
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {companyItems.map((c: CompanyItem, index: number) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.06 }}
                    >
                      <InfoCard kind="company" item={c} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="text-6xl mb-4">🏢</div>
                  <h3 className="text-lg font-medium mb-2">未找到相关公司</h3>
                  <p className="text-center">请尝试其他关键词。</p>
                </div>
              )
            )}

            {!combinedResultsEnabled && activeTab === 'person' && (
              personItems.length > 0 ? (
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {personItems.map((p: PersonItem, index: number) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.06 }}
                    >
                      <PersonCard person={p} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-lg font-medium mb-2">未找到相关人物</h3>
                  <p className="text-center">请尝试其他关键词。</p>
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 