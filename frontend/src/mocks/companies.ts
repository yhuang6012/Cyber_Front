import type { CompanyItem } from '@/store/useAppStore';

export const SAMPLE_COMPANIES: CompanyItem[] = [
  {
    id: 'c1',
    name: 'Acme Robotics',
    ticker: 'ACMR',
    sector: 'Industrial Automation',
    description: '面向制造业的柔性机器人与机器视觉方案提供商，核心客户涵盖 3C 与汽车。',
    headquarters: 'Shenzhen, China',
    founded: '2016'
  },
  {
    id: 'c2',
    name: 'NeuraCloud',
    ticker: 'NEUR',
    sector: 'Cloud & AI',
    description: '提供推理加速与 AI 平台服务的云厂商，布局液冷数据中心。',
    headquarters: 'Seattle, USA',
    founded: '2012'
  },
  {
    id: 'c3',
    name: 'LithoTech Materials',
    ticker: 'LITH',
    sector: 'New Energy Materials',
    description: '专注正极/电解液添加剂与高性能隔膜的材料企业。',
    headquarters: 'Suzhou, China',
    founded: '2014'
  }
  ,
  {
    id: 'c4',
    name: 'NeuroLink Labs',
    ticker: 'NRLK',
    sector: 'Brain-Computer Interface',
    description: '专注非侵入式脑机接口传感器与信号解码算法，主攻沟通辅助与认知训练应用。',
    headquarters: 'San Francisco, USA',
    founded: '2018'
  },
  {
    id: 'c5',
    name: 'Synaptech Medical',
    ticker: 'SYNM',
    sector: 'Neurotechnology',
    description: '面向医疗场景的植入式神经电极与闭环刺激系统供应商，核心方向为运动功能重建。',
    headquarters: 'Basel, Switzerland',
    founded: '2015'
  }
];


