import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, Bookmark, User, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore, NewsItem, ResearchItem, CompanyItem, AgentCompany } from '@/store/useAppStore';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type InfoCardProps =
  | { kind: 'news'; item: NewsItem }
  | { kind: 'research'; item: ResearchItem }
  | { kind: 'company'; item: CompanyItem | AgentCompany };

export function InfoCard(props: InfoCardProps) {
  const { isFavorite, toggleFavoriteNews, toggleFavoriteResearch, toggleFavoriteCompany, addFavorite, removeFavorite } = useAppStore();

  const isNews = props.kind === 'news';
  const isResearch = props.kind === 'research';
  const isCompany = props.kind === 'company';

  const getCompanyId = (item: CompanyItem | AgentCompany) => {
    return (item as any).id ?? (item as any).company_id?.toString?.() ?? String((item as any).company_id ?? '');
  };

  const id = isCompany ? getCompanyId(props.item as any) : (props.item as any).id;
  const favored = isFavorite(props.kind, id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    // prevent drag from starting when clicking bookmark
    e.preventDefault();

    if (isNews) {
      toggleFavoriteNews(props.item as NewsItem);
      return;
    }
    if (isResearch) {
      toggleFavoriteResearch(props.item as ResearchItem);
      return;
    }

    // company
    const item: any = props.item as any;
    const isAgent = item.company_id != null && item.id == null;
    if (isAgent) {
      if (favored) {
        removeFavorite('company', id);
      } else {
        const fav = {
          id,
          type: 'company' as const,
          title: (item.name ?? item.company_name) as string,
          summary: (item.description ?? '') as string,
          source: (item.sector ?? (Array.isArray(item.tags) ? item.tags.join('/') : undefined)) as string | undefined,
        };
        addFavorite(fav);
      }
    } else {
      toggleFavoriteCompany(props.item as CompanyItem);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // ignore drag if originated from nodrag elements (e.g., favorite button)
    const target = e.target as HTMLElement;
    if (target && target.closest('[data-nodrag]')) return;

    const payload = isNews
      ? { kind: 'news', id: (props.item as NewsItem).id, title: (props.item as NewsItem).title, content: (props.item as NewsItem).content }
      : isResearch
        ? { kind: 'research', id: (props.item as ResearchItem).id, title: (props.item as ResearchItem).title, content: (props.item as ResearchItem).abstract }
        : { kind: 'company', id, title: ((props.item as any).name ?? (props.item as any).company_name) as string, content: ((props.item as any).description ?? '') as string };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const title = isNews
    ? (props.item as NewsItem).title
    : isResearch
      ? (props.item as ResearchItem).title
      : ((props.item as any).name ?? (props.item as any).company_name);

  const renderCompanyMeta = (item: CompanyItem | AgentCompany) => {
    const founded = (item as any).founded ?? (item as any).establish_time;
    const headquarters = (item as any).headquarters ?? (item as any).province;
    const ticker = (item as any).ticker;
    const sector = (item as any).sector || (Array.isArray((item as any).tags) ? (item as any).tags[0] : undefined);
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {founded && (
          <>
            <CalendarIcon className="w-4 h-4" />
            <span>{founded}</span>
          </>
        )}
        {headquarters && (
          <>
            <span>•</span>
            <MapPin className="w-4 h-4" />
            <span className="truncate">{headquarters}</span>
          </>
        )}
        {ticker && (
          <>
            <span>•</span>
            <Badge variant="secondary" className="text-xs">{ticker}</Badge>
          </>
        )}
        {sector && (
          <>
            <span>•</span>
            <Badge className="text-xs" variant="outline">{sector}</Badge>
          </>
        )}
      </div>
    );
  };

  const renderCompanyBody = (item: CompanyItem | AgentCompany) => {
    const description = (item as any).description ?? (item as any).short_intro;
    const team = (item as any).team_cell as string[] | undefined;
    const financing = (item as any).financing_round as Array<{ date: string | null; round: string; amount: string }> | undefined;
    const news = (item as any).news_latest3 as Array<{ url: string; date: string; title: string }> | undefined;
    const latestRound = (item as any).latest_round;
    const latestAmount = (item as any).latest_amount;
    const latestFinanceDate = (item as any).latest_finance_date;
    return (
      <div className="space-y-3">
        {description && (
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        )}
        {team && team.length > 0 && (
          <div className="text-sm">
            <div className="font-medium mb-1">核心团队</div>
            <div className="flex flex-wrap gap-2 text-muted-foreground">
              {team.map((m, i) => (
                <span key={i} className="text-xs bg-muted rounded px-2 py-0.5">{m}</span>
              ))}
            </div>
          </div>
        )}
        {(financing && financing.length > 0) && (
          <div className="text-sm">
            <div className="font-medium mb-1">融资情况</div>
            <div className="space-y-1 text-muted-foreground">
              {financing.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{f.round}</span>
                  <span className="text-xs">{(f.amount || '—')}{f.date ? ` · ${f.date}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 最新融资（当没有完整融资轮次信息时显示） */}
        {!financing?.length && latestRound && (
          <div className="text-sm">
            <div className="font-medium mb-1">最新融资</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{latestRound}</span>
              <span className="text-xs">
                {latestAmount || '—'}
                {latestFinanceDate ? ` · ${latestFinanceDate}` : ''}
              </span>
            </div>
          </div>
        )}
        {news && news.length > 0 && (
          <div className="text-sm">
            <div className="font-medium mb-1">最新资讯</div>
            <div className="space-y-1">
              {news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.date}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
      <div draggable onDragStart={handleDragStart} className={'cursor-grab active:cursor-grabbing'}>
        <Card className="h-full hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg leading-tight line-clamp-2">{title}</CardTitle>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      title={favored ? '已关注' : '关注'}
                      aria-label={favored ? '已关注' : '关注'}
                      onClick={handleFavorite}
                      data-nodrag
                      className={`p-1 rounded hover:bg-accent/50 transition-colors ${favored ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {favored ? (
                        <Bookmark className="w-6 h-6" fill="currentColor" />
                      ) : (
                        <Bookmark className="w-6 h-6" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>{favored ? '取消关注' : '关注'}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Meta */}
            {isNews && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                <span>{format(new Date((props.item as NewsItem).date), 'MMM d, yyyy')}</span>
                {(props.item as NewsItem).source && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">{(props.item as NewsItem).source}</Badge>
                  </>
                )}
              </div>
            )}

            {isResearch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                <span>{format(new Date((props.item as ResearchItem).date), 'MMM d, yyyy')}</span>
                {(props.item as ResearchItem).authors && (props.item as ResearchItem).authors!.length > 0 && (
                  <>
                    <span>•</span>
                    <User className="w-4 h-4" />
                    <span className="truncate">{(props.item as ResearchItem).authors!.join(', ')}</span>
                  </>
                )}
                {(props.item as ResearchItem).source && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">{(props.item as ResearchItem).source}</Badge>
                  </>
                )}
              </div>
            )}

            {isCompany && renderCompanyMeta(props.item as any)}
          </CardHeader>

          <CardContent>
            {isNews && (
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">{(props.item as NewsItem).content}</p>
            )}
            {isResearch && (
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">{(props.item as ResearchItem).abstract}</p>
            )}
            {isCompany && renderCompanyBody(props.item as any)}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}


