import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Star, BookOpen, LineChart, FileText, Trash2, X, Download, Printer, Share2, Bookmark, MoreHorizontal, Filter, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { mockAnalyses } from '@/mocks/workspace';
import { InfoCard } from '@/components/NewsPanel/InfoCard';
import { MyProjects } from './MyProjects';

export function WorkspacePanel() {
  const [activeTab, setActiveTab] = useState<'hot' | 'recommend' | 'watchlist' | 'myprojects'>('myprojects');
  const {
    researchReports,
    removeResearchReport,
    addResearchReport,
    filteredFavorites,
    favoriteFilters,
    setFavoriteFilters,
    clearFavoriteFilters,
    // original datasets for mapping favorites
    newsItems,
    researchItems,
    companyItems,
    agentCompanies,
  } = useAppStore();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const selectedReport = researchReports.find(r => r.id === selectedReportId) ?? null;

  // Seed mock research reports for demo if empty
  useEffect(() => {
    if (researchReports.length === 0) {
      // Import seed reports from mocks
      import('@/mocks/reports').then(({ seedResearchReports }) => {
        seedResearchReports.forEach(r => addResearchReport(r));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mock industry analysis data moved to '@/mocks/workspace'

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedAnalysis = mockAnalyses.find(a => a.id === selectedAnalysisId) ?? null;
  const selectedNode = selectedAnalysis?.nodes.find(n => n.id === selectedNodeId) ?? null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-border">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">聚焦工作台</h2>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b"> 
          <button
              type="button"
              onClick={() => setActiveTab('myprojects')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'myprojects'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'myprojects'}
            >
              <Briefcase className="size-4" />
              我的项目
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hot')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'hot'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'hot'}
            >
              <Star className="size-4" />
              我的关注
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recommend')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'recommend'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'recommend'}
            >
              <BookOpen className="size-4" />
              历史报告
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('watchlist')}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
                activeTab === 'watchlist'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              aria-selected={activeTab === 'watchlist'}
            >
              <LineChart className="size-4" />
              产业分析
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="px-8">
            {activeTab === 'hot' && (
              <motion.div 
                className="grid gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {/* Favorites Filters */}
                <div className="rounded-lg py-1 px-2">
                  <div className="flex items-center justify-between mb-1 relative">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">我的关注</h3>
                      <span className="text-s text-muted-foreground">{filteredFavorites().length} 项</span>
                    </div>
                    {/* Filter dropdown (custom) */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="筛选"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        aria-expanded={showFilterMenu}
                        aria-haspopup="menu"
                      >
                        <Filter className="size-4" />
                      </Button>
                      {showFilterMenu && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-1 w-44 rounded-md border border-border bg-background shadow-md z-10"
                        >
                          <div className="px-3 py-2 text-xs text-muted-foreground">筛选类型</div>
                          <div className="py-1">
                            {[
                              { key: 'company', label: '公司' },
                              { key: 'news', label: '新闻' },
                              { key: 'research', label: '研究' },
                            ].map(f => {
                              const checked = favoriteFilters.includes(f.key as any);
                              return (
                                <label key={f.key} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50">
                                  <input
                                    type="checkbox"
                                    className="accent-primary"
                                    checked={checked}
                                    onChange={(e) => {
                                      const next = new Set(favoriteFilters as any);
                                      if (e.target.checked) next.add(f.key as any); else next.delete(f.key as any);
                                      setFavoriteFilters(Array.from(next) as any);
                                    }}
                                  />
                                  <span>{f.label}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground border-t"
                            onClick={() => { clearFavoriteFilters(); setShowFilterMenu(false); }}
                          >
                            清空筛选
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Favorites List */}
                <div className="rounded-lg border-border p-2">
                  {filteredFavorites().length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">暂无关注内容</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFavorites().map((fav) => {
                        if (fav.type === 'news') {
                          const n = newsItems.find(n => n.id === fav.id);
                          return n ? <InfoCard key={`n-${fav.id}`} kind="news" item={n} /> : null;
                        }
                        if (fav.type === 'research') {
                          const r = researchItems.find(r => r.id === fav.id);
                          return r ? <InfoCard key={`r-${fav.id}`} kind="research" item={r} /> : null;
                        }
                        // company: try local dataset first
                        let c: any = companyItems.find(c => c.id === fav.id);
                        if (!c) {
                          // try agent companies (backend)
                          c = agentCompanies.find(ac => String(ac.company_id) === String(fav.id));
                        }
                        if (!c) {
                          // fallback build minimal company from favorite data
                          c = { company_id: fav.id, company_name: fav.title, description: fav.summary, sector: fav.source } as any;
                        }
                        return <InfoCard key={`c-${fav.id}`} kind="company" item={c} />;
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'recommend' && (
              <motion.div 
                className="grid gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-lg p-0 overflow-hidden">
                  <div className="grid grid-cols-12 min-h-[420px]">
                    {/* Left: List */}
                    <div className="col-span-5">
                      <div className="p-2 flex items-center justify-between">
                        <h3 className="font-semibold">历史报告</h3>
                        <span className="text-xs text-muted-foreground">{researchReports.length} 项</span>
                      </div>
                      <div className="divide-y">
                        {researchReports.length === 0 && (
                          <div className="p-6 text-center text-muted-foreground">
                            暂无报告。生成的投资研究报告会保存在此处。
                          </div>
                        )}
                        {researchReports.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedReportId(r.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-start gap-3 ${selectedReportId === r.id ? 'bg-accent' : ''}`}
                          >
                            <FileText className="size-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{r.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); removeResearchReport(r.id); if (selectedReportId === r.id) setSelectedReportId(null); }}
                              aria-label="删除报告"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="col-span-7">
                      {selectedReport ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-auto p-4">
                            <div className="mx-auto max-w-[900px]">
                              <div className="bg-background rounded-xl shadow-sm border border-border">
                                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-medium truncate">{selectedReport.title}</h4>
                                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{new Date(selectedReport.createdAt).toLocaleString()}</div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="收藏">
                                      <Bookmark className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="导出">
                                      <Download className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="打印">
                                      <Printer className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="分享">
                                      <Share2 className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="更多">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="px-6 py-6">
                                  <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <div dangerouslySetInnerHTML={{ __html: selectedReport.content }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          选择左侧报告以在此查看内容
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'watchlist' && (
              <motion.div 
                className="grid gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {!selectedAnalysis && (
                  <div className="rounded-lg overflow-hidden">
                    <div className="p-2 flex items-center justify-between">
                      <h3 className="font-semibold">产业分析记录</h3>
                      <span className="text-xs text-muted-foreground">{mockAnalyses.length} 项</span>
                    </div>
                    <div className="divide-y">
                      {mockAnalyses.map(ana => (
                        <button
                          key={ana.id}
                          type="button"
                          onClick={() => setSelectedAnalysisId(ana.id)}
                          className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{ana.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{ana.summary}</div>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(ana.createdAt).toLocaleString()}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis && (
                  <div className="rounded-lg overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedAnalysis.title}</h3>
                        <div className="text-xs text-muted-foreground">{new Date(selectedAnalysis.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => { setSelectedAnalysisId(null); setSelectedNodeId(null); }}
                        >
                          返回列表
                        </button>
                      </div>
                    </div>

                    {/* Diagram canvas */}
                    <div className="relative p-4 bg-muted/30">
                      <svg viewBox="0 0 900 380" className="w-full h-[420px]">
                        {/* Edges */}
                        {selectedAnalysis.edges.map((e, idx) => {
                          const from = selectedAnalysis.nodes.find(n => n.id === e.from)!;
                          const to = selectedAnalysis.nodes.find(n => n.id === e.to)!;
                          return (
                            <g key={`edge-${idx}`}>
                              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#BBB" strokeWidth={2} />
                              {/* arrow head */}
                              <polygon
                                points={`${to.x},${to.y} ${to.x - 6},${to.y - 3} ${to.x - 6},${to.y + 3}`}
                                fill="#BBB"
                              />
                            </g>
                          );
                        })}

                        {/* Nodes */}
                        {selectedAnalysis.nodes.map(n => (
                          <g key={n.id} transform={`translate(${n.x - 60}, ${n.y - 20})`}>
                            <rect
                              width={120}
                              height={40}
                              rx={8}
                              ry={8}
                              fill={n.group === 'upstream' ? '#E6F4EA' : n.group === 'midstream' ? '#EAF2FF' : '#FFF1EA'}
                              stroke="#CBD5E1"
                              className="cursor-pointer"
                              onClick={() => setSelectedNodeId(n.id)}
                            />
                            <text x={60} y={24} textAnchor="middle" className="fill-current" style={{ fontSize: 12 }}>
                              {n.label}
                            </text>
                          </g>
                        ))}
                      </svg>

                      {/* Node detail modal */}
                      {selectedNode && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="bg-background border border-border rounded-lg shadow-lg w-[420px] max-w-[90vw]">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                              <div className="font-semibold">{selectedNode.label}</div>
                              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedNodeId(null)} aria-label="关闭">
                                <X className="size-5" />
                              </button>
                            </div>
                            <div className="p-4">
                              <div className="text-sm text-muted-foreground mb-3">
                                所属环节：{selectedNode.group === 'upstream' ? '上游' : selectedNode.group === 'midstream' ? '中游' : '下游'}
                              </div>
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {selectedNode.info}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'myprojects' && (
              <motion.div 
                className="grid gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <MyProjects />
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}


