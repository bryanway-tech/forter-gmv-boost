import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type ForterKPIs = {
  fraudApprovalRate: number; // Default 99%
  bankUplift: number; // Default 1%
  chargebackReduction: number; // Default 70%
  disputeRate: number; // Default 95%
  fraudDisputeWinRate: number; // Default 25.2%
  serviceDisputeRate: number; // Default 95%
  serviceDisputeWinRate: number; // Default 45%
  manualReviewReduction: number; // Default 50%
  timePerReviewReduction: number; // Default 80%
};

interface ForterKPIConfigProps {
  kpis: ForterKPIs;
  onUpdate: (kpis: ForterKPIs) => void;
}

export const defaultForterKPIs: ForterKPIs = {
  fraudApprovalRate: 99,
  bankUplift: 1,
  chargebackReduction: 70,
  disputeRate: 95,
  fraudDisputeWinRate: 25.2,
  serviceDisputeRate: 95,
  serviceDisputeWinRate: 45,
  manualReviewReduction: 50,
  timePerReviewReduction: 80,
};

export const ForterKPIConfig = ({ kpis, onUpdate }: ForterKPIConfigProps) => {
  const updateKPI = (field: keyof ForterKPIs, value: number) => {
    onUpdate({ ...kpis, [field]: value });
  };

  return (
    <Card className="p-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="forter-kpis">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Forter Performance Assumptions</h3>
              <span className="text-xs text-muted-foreground">(Click to customize)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fraudApproval">Fraud Approval Rate (%)</Label>
                  <Input
                    id="fraudApproval"
                    type="number"
                    step="0.1"
                    value={kpis.fraudApprovalRate}
                    onChange={(e) => updateKPI("fraudApprovalRate", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Forter's expected fraud approval rate
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankUplift">Bank Approval Uplift (%)</Label>
                  <Input
                    id="bankUplift"
                    type="number"
                    step="0.1"
                    value={kpis.bankUplift}
                    onChange={(e) => updateKPI("bankUplift", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Improvement in bank approval rates
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chargebackReduction">Chargeback Reduction (%)</Label>
                  <Input
                    id="chargebackReduction"
                    type="number"
                    step="0.1"
                    value={kpis.chargebackReduction}
                    onChange={(e) => updateKPI("chargebackReduction", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected reduction in fraud chargebacks
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disputeRate">Fraud Dispute Rate (%)</Label>
                  <Input
                    id="disputeRate"
                    type="number"
                    step="0.1"
                    value={kpis.disputeRate}
                    onChange={(e) => updateKPI("disputeRate", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    % of fraud chargebacks actively disputed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fraudWinRate">Fraud Dispute Win Rate (%)</Label>
                  <Input
                    id="fraudWinRate"
                    type="number"
                    step="0.1"
                    value={kpis.fraudDisputeWinRate}
                    onChange={(e) => updateKPI("fraudDisputeWinRate", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    % of disputed fraud chargebacks won
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDisputeRate">Service Dispute Rate (%)</Label>
                  <Input
                    id="serviceDisputeRate"
                    type="number"
                    step="0.1"
                    value={kpis.serviceDisputeRate}
                    onChange={(e) => updateKPI("serviceDisputeRate", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    % of service chargebacks actively disputed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceWinRate">Service Dispute Win Rate (%)</Label>
                  <Input
                    id="serviceWinRate"
                    type="number"
                    step="0.1"
                    value={kpis.serviceDisputeWinRate}
                    onChange={(e) => updateKPI("serviceDisputeWinRate", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    % of disputed service chargebacks won
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
