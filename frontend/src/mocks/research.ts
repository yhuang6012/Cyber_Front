import type { ResearchItem } from '@/store/useAppStore';

export const SAMPLE_RESEARCH: ResearchItem[] = [
  {
    id: 'r1',
    title: '大型语言模型在金融文本分析中的应用综述',
    abstract: '系统梳理 LLM 在资讯解析、舆情监测与事件抽取中的落地路径，并讨论可解释性与风险控制框架。',
    date: new Date().toISOString(),
    authors: ['Zhang Wei', 'Li Na'],
    source: 'arXiv'
  },
  {
    id: 'r2',
    title: '固态电池商业化进展与材料瓶颈',
    abstract: '从硫化物与氧化物体系对比切入，评估界面稳定性与规模化制造的关键难点。',
    date: new Date(Date.now() - 86400000).toISOString(),
    authors: ['Wang Lin'],
    source: 'Journal of Energy Storage'
  },
  {
    id: 'r3',
    title: '数据中心液冷方案的能效评估',
    abstract: '通过 PUE/ WUE 指标对比气冷与液冷在高密场景下的节能效果与投资回收期。',
    date: new Date(Date.now() - 172800000).toISOString(),
    authors: ['Chen Yu', 'Liu Yang'],
    source: 'IEEE Transactions on Cloud Computing'
  }
  ,
  {
    id: 'r4',
    title: '非侵入式脑机接口中的多通道 EEG 特征融合方法综述',
    abstract: '综述近年来 BCI 中多通道 EEG 特征提取与融合技术，包括时频分析、图卷积网络与注意力机制，并讨论在拼写器与情绪识别任务中的效果。',
    date: new Date(Date.now() - 3600_000).toISOString(),
    authors: ['Zhou Ming', 'Eric Lee'],
    source: 'Neural Engineering Review'
  },
  {
    id: 'r5',
    title: '闭环运动想象 BCI 的延迟补偿与稳定性研究',
    abstract: '提出端到端延迟建模与自适应控制框架，以提升闭环 BCI 在长期使用下的鲁棒性与用户体验。',
    date: new Date(Date.now() - 7200_000).toISOString(),
    authors: ['Wang Jia', 'Maria Gomez'],
    source: 'IEEE TBME'
  }
];


