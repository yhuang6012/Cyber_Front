import { useState } from 'react';
import { KnowledgeReport } from '@/store/useAppStore';
import { ReportList } from './ReportList';
import { ReportDetailSheet } from './ReportDetailSheet';

export function KnowledgeBasePanel() {
  const [selectedReport, setSelectedReport] = useState<KnowledgeReport | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleReportClick = (report: KnowledgeReport) => {
    setSelectedReport(report);
    setSheetOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto px-6 py-4">
        <ReportList onReportClick={handleReportClick} />
      </div>

      <ReportDetailSheet
        report={selectedReport}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

