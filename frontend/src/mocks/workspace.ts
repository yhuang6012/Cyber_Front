export type IndustryNode = {
  id: string;
  label: string;
  info: string;
  x: number;
  y: number;
  group: 'upstream' | 'midstream' | 'downstream';
};

export type IndustryEdge = { from: string; to: string };

export type IndustryAnalysis = {
  id: string;
  title: string;
  createdAt: string;
  summary?: string;
  nodes: IndustryNode[];
  edges: IndustryEdge[];
};

export const mockAnalyses: IndustryAnalysis[] = [
  {
    id: 'ana-1',
    title: '新能源车产业链（锂电）',
    createdAt: new Date().toISOString(),
    summary: '覆盖上游锂矿-中游电池-下游整车厂的核心环节与头部公司',
    nodes: [
      { id: 'n1', label: '锂矿开采', info: '主要资源：锂辉石、盐湖卤水；成本与品位关键', x: 100, y: 80, group: 'upstream' },
      { id: 'n2', label: '碳酸锂/氢氧化锂', info: '提锂工艺：萃取/膜法/吸附；价格波动大', x: 100, y: 200, group: 'upstream' },
      { id: 'n3', label: '正负极材料', info: '正极：三元/磷酸铁锂；负极：人造石墨/硅碳', x: 350, y: 80, group: 'midstream' },
      { id: 'n4', label: '隔膜/电解液', info: '隔膜涂覆提升安全性；电解液添加剂影响倍率与寿命', x: 350, y: 200, group: 'midstream' },
      { id: 'n5', label: '电池Pack', info: 'CTP/CTC集成提升能量密度与成本优势', x: 550, y: 140, group: 'midstream' },
      { id: 'n6', label: '整车厂', info: '上游价格传导至整车成本；车型热度影响装机', x: 750, y: 140, group: 'downstream' },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n2', to: 'n4' },
      { from: 'n3', to: 'n5' },
      { from: 'n4', to: 'n5' },
      { from: 'n5', to: 'n6' },
    ],
  },
  {
    id: 'ana-2',
    title: 'AI 算力产业链（GPU/算力中心）',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    summary: '覆盖上游芯片-中游服务器/网络-下游云/应用',
    nodes: [
      { id: 'm1', label: '高端GPU/ASIC', info: '制程先进、HBM带宽瓶颈', x: 100, y: 100, group: 'upstream' },
      { id: 'm2', label: '服务器/整机', info: '液冷方案与机柜密度提升', x: 350, y: 100, group: 'midstream' },
      { id: 'm3', label: '数据中心网络', info: '交换机/光模块/高速互联', x: 350, y: 220, group: 'midstream' },
      { id: 'm4', label: '云服务/AI平台', info: '算力即服务/推理服务', x: 600, y: 160, group: 'downstream' },
    ],
    edges: [
      { from: 'm1', to: 'm2' },
      { from: 'm1', to: 'm3' },
      { from: 'm2', to: 'm4' },
      { from: 'm3', to: 'm4' },
    ],
  },
];


