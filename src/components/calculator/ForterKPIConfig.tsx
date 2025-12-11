import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export type ForterKPIs = {
  fraudApprovalRate: number; // Default 99%
  bankDeclineImprovement: number; // Default 1% (reduces decline rate by this %)
  chargebackReduction: number; // Default 70%
  disputeRate: number; // Default 95%
  fraudDisputeWinRate: number; // Default 25.2%
  serviceDisputeRate: number; // Default 95%
  serviceDisputeWinRate: number; // Default 45%
  manualReviewReduction: number; // Default 50%
  timePerReviewReduction: number; // Default 80%
  threeDSChallengeReduction: number; // Default 30%
  threeDSAbandonmentImprovement: number; // Default 2%
  // Toggle states for input modes
  threeDSChallengeIsAbsolute?: boolean;
  threeDSAbandonmentIsAbsolute?: boolean;
  manualReviewIsAbsolute?: boolean;
  chargebackReductionIsAbsolute?: boolean;
};

interface ForterKPIConfigProps {
  kpis: ForterKPIs;
  onUpdate: (kpis: ForterKPIs) => void;
}

export const defaultForterKPIs: ForterKPIs = {
  fraudApprovalRate: 99,
  bankDeclineImprovement: 1,
  chargebackReduction: 70,
  disputeRate: 95,
  fraudDisputeWinRate: 25.2,
  serviceDisputeRate: 95,
  serviceDisputeWinRate: 45,
  manualReviewReduction: 50,
  timePerReviewReduction: 80,
  threeDSChallengeReduction: 30,
  threeDSAbandonmentImprovement: 2,
};

export const ForterKPIConfig = ({ kpis, onUpdate }: ForterKPIConfigProps) => {
  const [threeDSChallengeMode, setThreeDSChallengeMode] = useState<'reduction' | 'absolute'>(
    kpis.threeDSChallengeIsAbsolute ? 'absolute' : 'reduction'
  );
  const [threeDSAbandonmentMode, setThreeDSAbandonmentMode] = useState<'reduction' | 'absolute'>(
    kpis.threeDSAbandonmentIsAbsolute ? 'absolute' : 'reduction'
  );
  const [manualReviewMode, setManualReviewMode] = useState<'reduction' | 'absolute'>(
    kpis.manualReviewIsAbsolute ? 'absolute' : 'reduction'
  );
  const [chargebackReductionMode, setChargebackReductionMode] = useState<'reduction' | 'absolute'>(
    kpis.chargebackReductionIsAbsolute ? 'absolute' : 'reduction'
  );

  const updateKPI = (field: keyof ForterKPIs, value: number | boolean) => {
    onUpdate({ ...kpis, [field]: value });
  };

  const toggleThreeDSChallengeMode = (checked: boolean) => {
    const newMode = checked ? 'absolute' : 'reduction';
    setThreeDSChallengeMode(newMode);
    updateKPI('threeDSChallengeIsAbsolute', checked);
  };

  const toggleThreeDSAbandonmentMode = (checked: boolean) => {
    const newMode = checked ? 'absolute' : 'reduction';
    setThreeDSAbandonmentMode(newMode);
    updateKPI('threeDSAbandonmentIsAbsolute', checked);
  };

  const toggleManualReviewMode = (checked: boolean) => {
    const newMode = checked ? 'absolute' : 'reduction';
    setManualReviewMode(newMode);
    updateKPI('manualReviewIsAbsolute', checked);
  };

  const toggleChargebackReductionMode = (checked: boolean) => {
    const newMode = checked ? 'absolute' : 'reduction';
    setChargebackReductionMode(newMode);
    updateKPI('chargebackReductionIsAbsolute', checked);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Forter Performance Assumptions</h3>
      <div className="space-y-6">
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
            <Label htmlFor="bankDeclineImprovement">Bank Decline Rate Improvement (%)</Label>
            <Input
              id="bankDeclineImprovement"
              type="number"
              step="0.1"
              value={kpis.bankDeclineImprovement}
              onChange={(e) => updateKPI("bankDeclineImprovement", parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Reduction in bank decline rate (e.g., 1% reduces 7% decline to 6.93%)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="chargebackReduction">
                {chargebackReductionMode === 'reduction' ? 'Fraud Chargeback Reduction (%)' : 'Post-Forter Fraud Chargeback Rate (%)'}
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Improvement %</span>
                <Switch
                  checked={chargebackReductionMode === 'absolute'}
                  onCheckedChange={toggleChargebackReductionMode}
                />
                <span className="text-muted-foreground">Absolute Rate</span>
              </div>
            </div>
            <Input
              id="chargebackReduction"
              type="number"
              step="0.1"
              value={kpis.chargebackReduction}
              onChange={(e) => updateKPI("chargebackReduction", parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {chargebackReductionMode === 'reduction'
                ? 'Expected reduction in fraud chargebacks'
                : 'Target fraud chargeback rate after Forter implementation'}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="threeDSReduction">
                {threeDSChallengeMode === 'reduction' ? '3DS Challenge Reduction (%)' : 'Post-Forter 3DS Challenge Rate (%)'}
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Reduction %</span>
                <Switch
                  checked={threeDSChallengeMode === 'absolute'}
                  onCheckedChange={toggleThreeDSChallengeMode}
                />
                <span className="text-muted-foreground">Absolute Rate</span>
              </div>
            </div>
            <Input
              id="threeDSReduction"
              type="number"
              step="0.1"
              value={kpis.threeDSChallengeReduction}
              onChange={(e) => updateKPI("threeDSChallengeReduction", parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {threeDSChallengeMode === 'reduction' 
                ? 'Reduction in 3DS challenge rate' 
                : 'Target 3DS challenge rate after Forter implementation'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="threeDSAbandonment">
                {threeDSAbandonmentMode === 'reduction' ? '3DS Abandonment Improvement (%)' : 'Post-Forter 3DS Abandonment Rate (%)'}
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Improvement %</span>
                <Switch
                  checked={threeDSAbandonmentMode === 'absolute'}
                  onCheckedChange={toggleThreeDSAbandonmentMode}
                />
                <span className="text-muted-foreground">Absolute Rate</span>
              </div>
            </div>
            <Input
              id="threeDSAbandonment"
              type="number"
              step="0.1"
              value={kpis.threeDSAbandonmentImprovement}
              onChange={(e) => updateKPI("threeDSAbandonmentImprovement", parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {threeDSAbandonmentMode === 'reduction'
                ? 'Reduction in abandonment rate for 3DS challenged transactions'
                : 'Target abandonment rate after Forter implementation'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="manualReviewReduction">
                {manualReviewMode === 'reduction' ? 'Manual Review Reduction (%)' : 'Post-Forter Manual Review Rate (%)'}
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Reduction %</span>
                <Switch
                  checked={manualReviewMode === 'absolute'}
                  onCheckedChange={toggleManualReviewMode}
                />
                <span className="text-muted-foreground">Absolute Rate</span>
              </div>
            </div>
            <Input
              id="manualReviewReduction"
              type="number"
              step="0.1"
              value={kpis.manualReviewReduction}
              onChange={(e) => updateKPI("manualReviewReduction", parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {manualReviewMode === 'reduction'
                ? 'Reduction in transactions requiring manual review'
                : 'Target manual review rate after Forter implementation'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
