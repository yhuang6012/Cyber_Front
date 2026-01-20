import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';

export interface CompanyCandidate {
  onto_id: string;
  company_name: string;
  credit_code?: string;
  industry?: string;
  region?: string;
  company_stage?: string;
  establish_time?: string;
}

interface CompanyMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: CompanyCandidate[];
  onConfirm: (companyName: string) => void;
  isConfirming: boolean;
}

export function CompanyMatchDialog({
  open,
  onOpenChange,
  candidates,
  onConfirm,
  isConfirming,
}: CompanyMatchDialogProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedCompany) {
      onConfirm(selectedCompany);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>选择匹配的公司</DialogTitle>
          <DialogDescription>
            {candidates.length > 0 
              ? `找到 ${candidates.length} 个候选公司，请选择正确的一个进行关联`
              : '未找到匹配的公司，请检查公司名称是否正确'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          <div className="space-y-3 pr-4 pb-4">
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  未找到匹配的公司
                </p>
                <p className="text-xs text-muted-foreground/60">
                  请检查公司名称是否正确，或稍后重试
                </p>
              </div>
            ) : (
              candidates.map((company) => (
                <div
                  key={company.onto_id}
                className={`
                  relative border rounded-lg p-4 cursor-pointer transition-all
                  hover:shadow-md hover:border-primary/50
                  ${
                    selectedCompany === company.company_name
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-background'
                  }
                `}
                onClick={() => setSelectedCompany(company.company_name)}
              >
                {/* Selected Indicator */}
                {selectedCompany === company.company_name && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                )}

                {/* Company Name */}
                <div className="flex items-start gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">
                      {company.company_name}
                    </h3>
                    {company.credit_code && (
                      <p className="text-xs text-muted-foreground font-mono">
                        统一社会信用代码：{company.credit_code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pl-8">
                  {company.industry && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company.region && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{company.region}</span>
                    </div>
                  )}
                  {company.establish_time && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{company.establish_time}</span>
                    </div>
                  )}
                  {company.company_stage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{company.company_stage}</span>
                    </div>
                  )}
                </div>

                {/* Industry Badge */}
                {company.industry && (
                  <div className="mt-3 pl-8">
                    <Badge variant="secondary" className="text-xs">
                      {company.industry}
                    </Badge>
                  </div>
                )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-background">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCompany || isConfirming}
            className="cursor-pointer"
          >
            {isConfirming ? '确认中...' : '确认关联'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
