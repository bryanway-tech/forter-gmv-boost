import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Index";
import forterLogo from "@/assets/forter-logo.png";
import { ArrowUp, TrendingUp, DollarSign, Shield } from "lucide-react";

interface ResultsDashboardProps {
  data: CalculatorData;
  customerLogoUrl?: string;
  onReset: () => void;
}

export const ResultsDashboard = ({ data, customerLogoUrl, onReset }: ResultsDashboardProps) => {
  // Calculate current and future states
  const calculateMetrics = () => {
    const amerRevenue = data.amerGrossRevenue || 0;
    const emeaRevenue = data.emeaGrossRevenue || 0;
    const totalRevenue = amerRevenue + emeaRevenue;

    // Current state - Bank Approval Rate × Fraud Approval Rate = Complete Rate
    const amerBankApproval = 1 - (data.amerIssuingBankDeclineRate || 7) / 100;
    const amerFraudApproval =
      data.amerFraudCheckTiming === "pre-auth"
        ? (data.amerPreAuthApprovalRate || 95) / 100
        : (data.amerPostAuthApprovalRate || 98.5) / 100;
    const currentAmerCompleteRate = amerBankApproval * amerFraudApproval;

    const emeaBankApproval = 1 - (data.emeaIssuingBankDeclineRate || 5) / 100;
    const emeaFraudApproval = (data.emeaPreAuthApprovalRate || 95) / 100;
    const currentEmeaCompleteRate = emeaBankApproval * emeaFraudApproval;

    // Future state with Forter (99% fraud approval, 1% bank uplift)
    const futureAmerFraudApproval = 0.99;
    const futureAmerBankApproval = Math.min(0.99, amerBankApproval + 0.01);
    const futureAmerCompleteRate = futureAmerBankApproval * futureAmerFraudApproval;

    const futureEmeaFraudApproval = 0.99;
    const futureEmeaBankApproval = Math.min(0.99, emeaBankApproval + 0.01);
    const futureEmeaCompleteRate = futureEmeaBankApproval * futureEmeaFraudApproval;

    // Calculate GMV uplift
    const amerGMVUplift = amerRevenue * (futureAmerCompleteRate - currentAmerCompleteRate);
    const emeaGMVUplift = emeaRevenue * (futureEmeaCompleteRate - currentEmeaCompleteRate);
    const totalGMVUplift = amerGMVUplift + emeaGMVUplift;

    // Chargeback reductions (70% reduction with Forter)
    const currentChargebacks =
      totalRevenue * ((data.fraudChargebackRate || 0.8) / 100);
    const futureChargebacks = currentChargebacks * 0.3; // 70% reduction
    const chargebackSavings = currentChargebacks - futureChargebacks;

    return {
      currentAmerCompleteRate: currentAmerCompleteRate * 100,
      futureAmerCompleteRate: futureAmerCompleteRate * 100,
      currentEmeaCompleteRate: currentEmeaCompleteRate * 100,
      futureEmeaCompleteRate: futureEmeaCompleteRate * 100,
      totalGMVUplift,
      gmvUpliftPercent: (totalGMVUplift / totalRevenue) * 100,
      chargebackSavings,
      chargebackReductionPercent: 70,
      totalRevenue,
    };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src={forterLogo} alt="Forter" className="h-12 object-contain" />
            {customerLogoUrl && (
              <img src={customerLogoUrl} alt="Customer" className="h-12 object-contain" />
            )}
          </div>
          <Button variant="outline" onClick={onReset}>
            New Assessment
          </Button>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">
            {data.customerName ? `${data.customerName} - ` : ""}Value Assessment Results
          </h1>
          <p className="text-xl text-muted-foreground">
            Your potential uplift with Forter's fraud management solution
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">GMV Uplift</h3>
            </div>
            <p className="text-4xl font-bold text-green-700 dark:text-green-300 mb-2">
              {formatCurrency(metrics.totalGMVUplift)}
            </p>
            <p className="text-sm text-muted-foreground">
              <ArrowUp className="w-4 h-4 inline mr-1" />
              {formatPercent(metrics.gmvUpliftPercent)} increase in approved GMV
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Chargeback Savings</h3>
            </div>
            <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
              {formatCurrency(metrics.chargebackSavings)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPercent(metrics.chargebackReductionPercent)} reduction in fraud chargebacks
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Total Value</h3>
            </div>
            <p className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-2">
              {formatCurrency(metrics.totalGMVUplift + metrics.chargebackSavings)}
            </p>
            <p className="text-sm text-muted-foreground">Combined annual value</p>
          </Card>
        </div>

        {/* Complete Rate Analysis */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Complete Rate Analysis</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {data.amerGrossRevenue && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">AMER Region</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span>Current Complete Rate</span>
                    <span className="font-bold text-xl">
                      {formatPercent(metrics.currentAmerCompleteRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                    <span>With Forter</span>
                    <span className="font-bold text-xl text-primary">
                      {formatPercent(metrics.futureAmerCompleteRate)}
                    </span>
                  </div>
                  <div className="text-center">
                    <ArrowUp className="w-8 h-8 mx-auto text-green-600" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatPercent(
                        metrics.futureAmerCompleteRate - metrics.currentAmerCompleteRate
                      )}{" "}
                      improvement
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.emeaGrossRevenue && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">EMEA Region</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span>Current Complete Rate</span>
                    <span className="font-bold text-xl">
                      {formatPercent(metrics.currentEmeaCompleteRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                    <span>With Forter</span>
                    <span className="font-bold text-xl text-primary">
                      {formatPercent(metrics.futureEmeaCompleteRate)}
                    </span>
                  </div>
                  <div className="text-center">
                    <ArrowUp className="w-8 h-8 mx-auto text-green-600" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatPercent(
                        metrics.futureEmeaCompleteRate - metrics.currentEmeaCompleteRate
                      )}{" "}
                      improvement
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Key Insights */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Key Insights</h2>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              • Your current complete rate (Bank Approval × Fraud Approval) is limiting your GMV
              potential
            </p>
            <p className="text-muted-foreground">
              • Forter's 99% fraud approval rate and optimized bank routing can unlock{" "}
              {formatCurrency(metrics.totalGMVUplift)} in additional GMV
            </p>
            <p className="text-muted-foreground">
              • 70% reduction in fraud chargebacks saves {formatCurrency(metrics.chargebackSavings)}{" "}
              annually
            </p>
            <p className="text-muted-foreground">
              • Total potential value: {formatCurrency(metrics.totalGMVUplift + metrics.chargebackSavings)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
