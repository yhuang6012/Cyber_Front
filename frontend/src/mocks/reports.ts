export type SeedReport = {
  title: string;
  content: string;
  createdAt?: string;
  id?: string;
};

export const seedResearchReports: SeedReport[] = [
  {
    title: '2025Q3 行业深度：新能源车与锂电成本拐点观察',
    content: `
          <h2>新能源车与锂电成本拐点观察</h2>
          <p>本报告聚焦上游锂价波动对中下游成本与装机节奏的传导。</p>
          <h3>核心观点</h3>
          <ul>
            <li>锂价回落促使中游材料利润率修复。</li>
            <li>CTP/CTC 集成推动系统成本与能量密度改善。</li>
            <li>整车厂新品周期与渠道去库成为销量关键。</li>
          </ul>
          <h3>风险提示</h3>
          <p>原材料价格波动超预期；海外需求不及预期；技术迭代节奏不达预期。</p>
        `,
  },
  {
    title: 'AI 算力景气度回顾：GPU 紧缺与液冷渗透率提升',
    content: `
          <h2>AI 算力景气度回顾</h2>
          <p>回顾 2024-2025 年 GPU 供需缺口与液冷方案渗透。</p>
          <h3>要点</h3>
          <ol>
            <li>高端 GPU 与 HBM 供给约束延续。</li>
            <li>液冷与高密机柜提升单柜算力密度。</li>
            <li>云厂商 CapEx 周期与 AI 服务商业化加速。</li>
          </ol>
          <p>建议关注：上游高端器件、光互联链条以及数据中心基础设施。</p>
        `,
  },
];


