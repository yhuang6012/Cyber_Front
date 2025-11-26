import type { NewsItem } from '@/store/useAppStore';

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Revolutionary AI Breakthrough in Natural Language Processing',
    content: 'Scientists at leading tech companies have announced a major breakthrough in AI that could revolutionize how we interact with computers. The new system demonstrates unprecedented understanding of context and nuance in human language, opening possibilities for more natural and intuitive AI assistants.',
    date: new Date().toISOString(),
    source: 'Tech Today'
  },
  {
    id: '2',
    title: 'Space Exploration Reaches New Milestone with Mars Colony Plans',
    content: 'NASA and SpaceX have jointly announced ambitious plans for establishing the first permanent human colony on Mars by 2030. The project involves revolutionary propulsion technology and sustainable habitat systems that could support hundreds of colonists.',
    date: new Date(Date.now() - 86400000).toISOString(),
    source: 'Space News'
  },
  {
    id: '3',
    title: 'Climate Change Solutions: Breakthrough in Carbon Capture Technology',
    content: 'A team of international researchers has developed a new carbon capture technology that could remove CO2 from the atmosphere 10 times more efficiently than current methods. This breakthrough offers hope for achieving carbon neutrality goals and reversing climate change effects.',
    date: new Date(Date.now() - 172800000).toISOString(),
    source: 'Environmental Science'
  },
  {
    id: '4',
    title: 'Quantum Computing Achieves Major Milestone in Error Correction',
    content: 'Researchers have successfully demonstrated quantum error correction at scale, bringing practical quantum computers closer to reality. This advancement could revolutionize cryptography, drug discovery, and complex optimization problems.',
    date: new Date(Date.now() - 259200000).toISOString(),
    source: 'Quantum Review'
  },
  {
    id: '5',
    title: 'Renewable Energy Storage Solution Breaks Efficiency Records',
    content: 'A new battery technology using advanced materials has achieved 95% efficiency in energy storage, potentially solving the intermittency problem of renewable energy sources like solar and wind power.',
    date: new Date(Date.now() - 345600000).toISOString(),
    source: 'Energy Tribune'
  }
  ,
  {
    id: '6',
    title: '脑机接口创业公司获 1 亿美元融资，推进非侵入式沟通系统',
    content: 'NeuroLink Labs 宣布完成新一轮融资，计划扩展其 EEG 传感器与实时语音解码平台，目标是帮助语言障碍用户实现自然沟通。',
    date: new Date(Date.now() - 1800_000).toISOString(),
    source: 'HealthTech Daily'
  },
  {
    id: '7',
    title: '植入式 BCI 临床试验取得进展，运动功能重建方案获里程碑批复',
    content: 'Synaptech Medical 披露其闭环神经刺激系统在早期临床研究中显著改善患者上肢运动控制，监管机构授予快速通道资格。',
    date: new Date(Date.now() - 5400_000).toISOString(),
    source: 'MedNews'
  }
];


