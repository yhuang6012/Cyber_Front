import { useState } from 'react';
import { MessageSquarePlus, CircleArrowLeft, CircleArrowRight, Newspaper, LayoutGrid, NotebookPen, Folder, Layers, Settings, Search, X, GraduationCap, Building2, User, FileText, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [hasOpenedChat, setHasOpenedChat] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    clearMessages, 
    messages, 
    isChatExpanded, 
    toggleChat, 
    setChatExpanded, 
    activePanel, 
    setActivePanel, 
    toggleSmartCanvas,
    // Data for global search
    newsItems,
    researchItems,
    companyItems,
    personItems,
    projects,
    knowledgeReports,
  } = useAppStore();

  // if messages appear, ensure header reflects opened state so button切换为箭头
  if (!hasOpenedChat && messages.length > 0) {
    // set state sync (safe in render since idempotent based on condition)
    setHasOpenedChat(true);
  }

  const handleNewConversation = () => {
    clearMessages();
  };

  const handleChatToggle = () => {
    if (!hasOpenedChat && !isChatExpanded) {
      // First time opening chat
      setHasOpenedChat(true);
      setChatExpanded(true);
    } else {
      // Normal toggle behavior
      toggleChat();
    }
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setSearchQuery('');
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Global search logic
  const performSearch = () => {
    if (!searchQuery.trim()) {
      return {
        news: [],
        research: [],
        companies: [],
        persons: [],
        projects: [],
        reports: [],
      };
    }

    const query = searchQuery.toLowerCase();

    const filteredNews = newsItems.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query) ||
      item.source?.toLowerCase().includes(query)
    );

    const filteredResearch = researchItems.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.abstract.toLowerCase().includes(query) ||
      item.source?.toLowerCase().includes(query) ||
      item.authors?.some(a => a.toLowerCase().includes(query))
    );

    const filteredCompanies = companyItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.ticker?.toLowerCase().includes(query) ||
      item.sector?.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );

    const filteredPersons = personItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.englishName?.toLowerCase().includes(query) ||
      item.currentCompany?.toLowerCase().includes(query) ||
      item.currentPosition?.toLowerCase().includes(query)
    );

    const filteredProjects = projects.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.companyName?.toLowerCase().includes(query) ||
      item.industry?.toLowerCase().includes(query)
    );

    const filteredReports = knowledgeReports.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );

    return {
      news: filteredNews.slice(0, 5),
      research: filteredResearch.slice(0, 5),
      companies: filteredCompanies.slice(0, 5),
      persons: filteredPersons.slice(0, 5),
      projects: filteredProjects.slice(0, 5),
      reports: filteredReports.slice(0, 5),
    };
  };

  const searchResults = performSearch();
  const totalResults = 
    searchResults.news.length +
    searchResults.research.length +
    searchResults.companies.length +
    searchResults.persons.length +
    searchResults.projects.length +
    searchResults.reports.length;

  return (
    <>
      <div className="flex-shrink-0 h-16 bg-background border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
           {/* Focus Desk Button */}
           <Button 
            variant={activePanel === 'workspace' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('workspace')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="size-5" />
            工作台
          </Button>
          
          {/* Latest News Button */}
          <Button 
            variant={activePanel === 'news' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('news')}
            className="flex items-center gap-2"
          >
            <Newspaper className="size-5" />
            资讯库
          </Button>

          {/* Additional Top-Level: 项目 */}
          <Button 
            variant={activePanel === 'projects' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('projects')}
            className="flex items-center gap-2"
          >
            <Folder className="size-5" />
            项目库
          </Button>

          {/* Additional Top-Level: 知识库 */}
          <Button 
            variant={activePanel === 'knowledge' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('knowledge')}
            className="flex items-center gap-2"
          >
            <Layers className="size-5" />
            知识库
          </Button>

          {/* Additional Top-Level: 设置 */}
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="size-5" />
            设置
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleSearchOpen}
                className="flex items-center gap-2"
              >
                <Search className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              全站搜索
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Chat Toggle/Add Button */}
          {!hasOpenedChat ? (
            // Show "Add Chat" button initially
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChatToggle}
              className="flex items-center gap-2"
            >
              <MessageSquarePlus className="size-6" />
              开启聊天
            </Button>
          ) : (
            // Show arrow toggle after chat has been opened
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChatToggle}
              className="flex items-center gap-2"
            >
              {isChatExpanded ? (
                <CircleArrowRight className="size-6" />
              ) : (
                <CircleArrowLeft className="size-6" />
              )}
            </Button>
          )}
          
          {/* Start New Conversation Button */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="flex items-center gap-2"
            >
              <MessageSquarePlus className="size-6" />
              新对话
            </Button>
          )}

          {/* Smart Canvas Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSmartCanvas}
            className="flex items-center gap-2"
          >
            <NotebookPen className="size-6" />
            智选
          </Button>
        </div>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={handleSearchClose}
            />

            {/* Search Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索全站内容：新闻、研究、公司、人物、项目、报告..."
                    className="pl-10 pr-10 h-12 text-base border-0 focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSearchClose}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              <ScrollArea className="max-h-[70vh]">
                <div className="p-4">
                  {!searchQuery.trim() ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="size-12 mx-auto mb-3 opacity-50" />
                      <p>输入关键词开始搜索</p>
                      <p className="text-sm mt-1">可搜索：新闻、研究、公司、人物、项目、报告</p>
                    </div>
                  ) : totalResults === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="size-12 mx-auto mb-3 opacity-50" />
                      <p>未找到相关内容</p>
                      <p className="text-sm mt-1">试试其他关键词</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Results Summary */}
                      <div className="text-sm text-muted-foreground">
                        找到 <span className="font-semibold text-foreground">{totalResults}</span> 条结果
                      </div>

                      {/* News Results */}
                      {searchResults.news.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                            <Newspaper className="size-4" />
                            <span>新闻资讯</span>
                            <span className="text-muted-foreground">({searchResults.news.length})</span>
                          </div>
                          <div className="space-y-2">
                            {searchResults.news.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActivePanel('news');
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-sm line-clamp-1">{item.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.content}</div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>{item.source}</span>
                                  <span>·</span>
                                  <span>{item.date}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Research Results */}
                      {searchResults.research.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                            <GraduationCap className="size-4" />
                            <span>学术研究</span>
                            <span className="text-muted-foreground">({searchResults.research.length})</span>
                          </div>
                          <div className="space-y-2">
                            {searchResults.research.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActivePanel('news');
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-sm line-clamp-1">{item.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.abstract}</div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {item.authors && <span>{item.authors.join(', ')}</span>}
                                  <span>·</span>
                                  <span>{item.date}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Company Results */}
                      {searchResults.companies.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                            <Building2 className="size-4" />
                            <span>公司信息</span>
                            <span className="text-muted-foreground">({searchResults.companies.length})</span>
                          </div>
                          <div className="space-y-2">
                            {searchResults.companies.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActivePanel('news');
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-sm line-clamp-1">{item.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {item.ticker && <span>{item.ticker}</span>}
                                  {item.sector && (
                                    <>
                                      <span>·</span>
                                      <span>{item.sector}</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Person Results */}
                      {searchResults.persons.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                            <User className="size-4" />
                            <span>人物信息</span>
                            <span className="text-muted-foreground">({searchResults.persons.length})</span>
                          </div>
                          <div className="space-y-2">
                            {searchResults.persons.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActivePanel('news');
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-sm line-clamp-1">
                                  {item.name} {item.englishName && `(${item.englishName})`}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {item.currentCompany} · {item.currentPosition}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Results */}
                      {searchResults.projects.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                            <Briefcase className="size-4" />
                            <span>项目库</span>
                            <span className="text-muted-foreground">({searchResults.projects.length})</span>
                          </div>
                          <div className="space-y-2">
                            {searchResults.projects.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActivePanel('projects');
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-sm line-clamp-1">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</div>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {item.companyName && <span>{item.companyName}</span>}
                                  {item.industry && (
                                    <>
                                      <span>·</span>
                                      <span>{item.industry}</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Knowledge Report Results */}
                      {searchResults.reports.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                            <FileText className="size-4" />
                            <span>知识库</span>
                            <span className="text-muted-foreground">({searchResults.reports.length})</span>
                          </div>
                          <div className="space-y-2">
                            {searchResults.reports.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActivePanel('knowledge');
                                  handleSearchClose();
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <div className="font-medium text-sm line-clamp-1">{item.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.summary}</div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>{item.category}</span>
                                  <span>·</span>
                                  <span>{item.author}</span>
                                  <span>·</span>
                                  <span>{item.createdAt}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Hint */}
              {totalResults > 0 && (
                <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
                  点击结果可跳转到对应板块
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
} 