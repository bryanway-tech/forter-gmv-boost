import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalculatorData } from "@/pages/Index";
import forterLogo from "@/assets/forter-logo.png";
import { ArrowUp, TrendingUp, DollarSign, Shield, Info } from "lucide-react";
import { CalculationBreakdown } from "@/components/calculator/CalculationBreakdown";
import { defaultForterKPIs } from "@/components/calculator/ForterKPIConfig";

interface ResultsDashboardProps {
  data: CalculatorData;
  customerLogoUrl?: string;
  onReset: () => void;
}

export const ResultsDashboard = ({ data, customerLogoUrl, onReset }: ResultsDashboardProps) => {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{
    title: string;
    calculations: any[];
  }>({ title: "", calculations: [] });

  const forterKPIs = data.forterKPIs || defaultForterKPIs;

  // Calculate current and future states
  const calculateMetrics = () => {
    const amerRevenue = data.amerAnnualGMV || 0;
    const emeaRevenue = data.emeaAnnualGMV || 0;
    const apacRevenue = data.apacAnnualGMV || 0;
    const totalRevenue = amerRevenue + emeaRevenue + apacRevenue;

    // AMER calculations
    const amerBankApproval = 1 - (data.amerIssuingBankDeclineRate || 7) / 100;
    const amerFraudApproval =
      data.amerFraudCheckTiming === "pre-auth"
        ? (data.amerPreAuthApprovalRate || 95) / 100
        : (data.amerPostAuthApprovalRate || 98.5) / 100;
    const currentAmerCompleteRate = amerBankApproval * amerFraudApproval;
    const futureAmerBankApproval = Math.min(0.99, amerBankApproval + forterKPIs.bankUplift / 100);
    const futureAmerCompleteRate = futureAmerBankApproval * (forterKPIs.fraudApprovalRate / 100);

    // EMEA calculations
    const emeaBankApproval = 1 - (data.emeaIssuingBankDeclineRate || 5) / 100;
    const emeaFraudApproval = (data.emeaPreAuthApprovalRate || 95) / 100;
    const currentEmeaCompleteRate = emeaBankApproval * emeaFraudApproval;
    const futureEmeaBankApproval = Math.min(0.99, emeaBankApproval + forterKPIs.bankUplift / 100);
    const futureEmeaCompleteRate = futureEmeaBankApproval * (forterKPIs.fraudApprovalRate / 100);

    // APAC calculations
    const apacBankApproval = 1 - (data.apacIssuingBankDeclineRate || 7) / 100;
    const apacFraudApproval =
      data.apacFraudCheckTiming === "pre-auth"
        ? (data.apacPreAuthApprovalRate || 95) / 100
        : (data.apacPostAuthApprovalRate || 98.5) / 100;
    const currentApacCompleteRate = apacBankApproval * apacFraudApproval;
    const futureApacBankApproval = Math.min(0.99, apacBankApproval + forterKPIs.bankUplift / 100);
    const futureApacCompleteRate = futureApacBankApproval * (forterKPIs.fraudApprovalRate / 100);

    // Calculate GMV uplift
    const amerGMVUplift = amerRevenue * (futureAmerCompleteRate - currentAmerCompleteRate);
    const emeaGMVUplift = emeaRevenue * (futureEmeaCompleteRate - currentEmeaCompleteRate);
    const apacGMVUplift = apacRevenue * (futureApacCompleteRate - currentApacCompleteRate);
    const totalGMVUplift = amerGMVUplift + emeaGMVUplift + apacGMVUplift;

    // Chargeback calculations
    const currentChargebacks = totalRevenue * ((data.fraudCBRate || 0.8) / 100);
    const reductionRate = forterKPIs.chargebackReduction / 100;
    const futureChargebacks = currentChargebacks * (1 - reductionRate);
    const chargebackSavings = currentChargebacks - futureChargebacks;

    return {
      currentAmerCompleteRate: currentAmerCompleteRate * 100,
      futureAmerCompleteRate: futureAmerCompleteRate * 100,
      currentEmeaCompleteRate: currentEmeaCompleteRate * 100,
      futureEmeaCompleteRate: futureEmeaCompleteRate * 100,
      currentApacCompleteRate: currentApacCompleteRate * 100,
      futureApacCompleteRate: futureApacCompleteRate * 100,
      totalGMVUplift,
      amerGMVUplift,
      emeaGMVUplift,
      apacGMVUplift,
      gmvUpliftPercent: (totalGMVUplift / totalRevenue) * 100,
      chargebackSavings,
      chargebackReductionPercent: forterKPIs.chargebackReduction,
      currentChargebacks,
      futureChargebacks,
      totalRevenue,
      amerRevenue,
      emeaRevenue,
      apacRevenue,
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

  const showGMVBreakdown = () => {
    const calculations = [];

    if (data.amerAnnualGMV) {
      calculations.push(
        { label: "AMER Revenue", value: metrics.amerRevenue },
        { label: "Current Complete Rate", value: `${formatPercent(metrics.currentAmerCompleteRate)}` },
        { label: "Future Complete Rate", value: `${formatPercent(metrics.futureAmerCompleteRate)}` },
        {
          label: "AMER GMV Uplift",
          value: metrics.amerGMVUplift,
          formula: `${formatCurrency(metrics.amerRevenue)} × (${formatPercent(metrics.futureAmerCompleteRate)} - ${formatPercent(metrics.currentAmerCompleteRate)})`,
        }
      );
    }

    if (data.emeaAnnualGMV) {
      calculations.push(
        { label: "EMEA Revenue", value: metrics.emeaRevenue },
        { label: "Current Complete Rate", value: `${formatPercent(metrics.currentEmeaCompleteRate)}` },
        { label: "Future Complete Rate", value: `${formatPercent(metrics.futureEmeaCompleteRate)}` },
        {
          label: "EMEA GMV Uplift",
          value: metrics.emeaGMVUplift,
          formula: `${formatCurrency(metrics.emeaRevenue)} × (${formatPercent(metrics.futureEmeaCompleteRate)} - ${formatPercent(metrics.currentEmeaCompleteRate)})`,
        }
      );
    }

    if (data.apacAnnualGMV) {
      calculations.push(
        { label: "APAC Revenue", value: metrics.apacRevenue },
        { label: "Current Complete Rate", value: `${formatPercent(metrics.currentApacCompleteRate)}` },
        { label: "Future Complete Rate", value: `${formatPercent(metrics.futureApacCompleteRate)}` },
        {
          label: "APAC GMV Uplift",
          value: metrics.apacGMVUplift,
          formula: `${formatCurrency(metrics.apacRevenue)} × (${formatPercent(metrics.futureApacCompleteRate)} - ${formatPercent(metrics.currentApacCompleteRate)})`,
        }
      );
    }

    calculations.push({
      label: "Total GMV Uplift",
      value: metrics.totalGMVUplift,
      isResult: true,
    });

    setBreakdownData({
      title: "GMV Uplift Calculation",
      calculations,
    });
    setBreakdownOpen(true);
  };

  const showChargebackBreakdown = () => {
    setBreakdownData({
      title: "Chargeback Savings Calculation",
      calculations: [
        { label: "Total Revenue", value: metrics.totalRevenue },
        { label: "Current Fraud Chargeback Rate", value: `${data.fraudCBRate || 0.8}%` },
        {
          label: "Current Chargebacks",
          value: metrics.currentChargebacks,
          formula: `${formatCurrency(metrics.totalRevenue)} × ${data.fraudCBRate || 0.8}%`,
        },
        {
          label: "Forter Chargeback Reduction",
          value: `${forterKPIs.chargebackReduction}%`,
        },
        {
          label: "Future Chargebacks",
          value: metrics.futureChargebacks,
          formula: `${formatCurrency(metrics.currentChargebacks)} × (1 - ${forterKPIs.chargebackReduction}%)`,
        },
        {
          label: "Total Savings",
          value: metrics.chargebackSavings,
          formula: `${formatCurrency(metrics.currentChargebacks)} - ${formatCurrency(metrics.futureChargebacks)}`,
          isResult: true,
        },
      ],
    });
    setBreakdownOpen(true);
  };

  const showCompleteRateBreakdown = (region: 'amer' | 'emea' | 'apac') => {
    const calculations = [];
    
    if (region === 'amer') {
      const bankDeclineRate = data.amerIssuingBankDeclineRate || 7;
      const bankApproval = 1 - bankDeclineRate / 100;
      const fraudApproval = data.amerFraudCheckTiming === "pre-auth"
        ? (data.amerPreAuthApprovalRate || 95) / 100
        : (data.amerPostAuthApprovalRate || 98.5) / 100;
      
      calculations.push(
        { label: "Issuing Bank Decline Rate", value: `${bankDeclineRate}%` },
        { label: "Bank Approval Rate", value: `${(bankApproval * 100).toFixed(2)}%`, formula: `100% - ${bankDeclineRate}%` },
        { label: `Fraud Approval Rate (${data.amerFraudCheckTiming})`, value: `${(fraudApproval * 100).toFixed(2)}%` },
        {
          label: "Current Complete Rate",
          value: `${metrics.currentAmerCompleteRate.toFixed(2)}%`,
          formula: `${(bankApproval * 100).toFixed(2)}% × ${(fraudApproval * 100).toFixed(2)}%`,
          isResult: true,
        }
      );
    } else if (region === 'emea') {
      const bankDeclineRate = data.emeaIssuingBankDeclineRate || 5;
      const bankApproval = 1 - bankDeclineRate / 100;
      const fraudApproval = (data.emeaPreAuthApprovalRate || 95) / 100;
      
      calculations.push(
        { label: "Issuing Bank Decline Rate", value: `${bankDeclineRate}%` },
        { label: "Bank Approval Rate", value: `${(bankApproval * 100).toFixed(2)}%`, formula: `100% - ${bankDeclineRate}%` },
        { label: "Fraud Approval Rate (pre-auth)", value: `${(fraudApproval * 100).toFixed(2)}%` },
        {
          label: "Current Complete Rate",
          value: `${metrics.currentEmeaCompleteRate.toFixed(2)}%`,
          formula: `${(bankApproval * 100).toFixed(2)}% × ${(fraudApproval * 100).toFixed(2)}%`,
          isResult: true,
        }
      );
    } else {
      const bankDeclineRate = data.apacIssuingBankDeclineRate || 7;
      const bankApproval = 1 - bankDeclineRate / 100;
      const fraudApproval = data.apacFraudCheckTiming === "pre-auth"
        ? (data.apacPreAuthApprovalRate || 95) / 100
        : (data.apacPostAuthApprovalRate || 98.5) / 100;
      
      calculations.push(
        { label: "Issuing Bank Decline Rate", value: `${bankDeclineRate}%` },
        { label: "Bank Approval Rate", value: `${(bankApproval * 100).toFixed(2)}%`, formula: `100% - ${bankDeclineRate}%` },
        { label: `Fraud Approval Rate (${data.apacFraudCheckTiming})`, value: `${(fraudApproval * 100).toFixed(2)}%` },
        {
          label: "Current Complete Rate",
          value: `${metrics.currentApacCompleteRate.toFixed(2)}%`,
          formula: `${(bankApproval * 100).toFixed(2)}% × ${(fraudApproval * 100).toFixed(2)}%`,
          isResult: true,
        }
      );
    }

    setBreakdownData({
      title: `${region.toUpperCase()} Complete Rate Calculation`,
      calculations,
    });
    setBreakdownOpen(true);
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
          <Card
            className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={showGMVBreakdown}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">GMV Uplift</h3>
              <Info className="w-4 h-4 ml-auto text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-green-700 dark:text-green-300 mb-2">
              {formatCurrency(metrics.totalGMVUplift)}
            </p>
            <p className="text-sm text-muted-foreground">
              <ArrowUp className="w-4 h-4 inline mr-1" />
              {formatPercent(metrics.gmvUpliftPercent)} increase in approved GMV
            </p>
            <p className="text-xs text-muted-foreground mt-2">Click to see calculation</p>
          </Card>

          <Card
            className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={showChargebackBreakdown}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Chargeback Savings</h3>
              <Info className="w-4 h-4 ml-auto text-muted-foreground" />
            </div>
            <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
              {formatCurrency(metrics.chargebackSavings)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPercent(metrics.chargebackReductionPercent)} reduction in fraud chargebacks
            </p>
            <p className="text-xs text-muted-foreground mt-2">Click to see calculation</p>
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
          <div className="grid md:grid-cols-3 gap-8">
            {data.amerAnnualGMV && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">AMER Region</h3>
                <div className="space-y-4">
                  <div 
                    className="flex justify-between items-center p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => showCompleteRateBreakdown('amer')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Current Complete Rate</span>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
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

            {data.emeaAnnualGMV && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">EMEA Region</h3>
                <div className="space-y-4">
                  <div 
                    className="flex justify-between items-center p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => showCompleteRateBreakdown('emea')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Current Complete Rate</span>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
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

            {data.apacAnnualGMV && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">APAC Region</h3>
                <div className="space-y-4">
                  <div 
                    className="flex justify-between items-center p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => showCompleteRateBreakdown('apac')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Current Complete Rate</span>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-xl">
                      {formatPercent(metrics.currentApacCompleteRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                    <span>With Forter</span>
                    <span className="font-bold text-xl text-primary">
                      {formatPercent(metrics.futureApacCompleteRate)}
                    </span>
                  </div>
                  <div className="text-center">
                    <ArrowUp className="w-8 h-8 mx-auto text-green-600" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatPercent(
                        metrics.futureApacCompleteRate - metrics.currentApacCompleteRate
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
              • Forter's {forterKPIs.fraudApprovalRate}% fraud approval rate and optimized bank routing can
              unlock {formatCurrency(metrics.totalGMVUplift)} in additional GMV
            </p>
            <p className="text-muted-foreground">
              • {forterKPIs.chargebackReduction}% reduction in fraud chargebacks saves{" "}
              {formatCurrency(metrics.chargebackSavings)} annually
            </p>
            <p className="text-muted-foreground">
              • Total potential value:{" "}
              {formatCurrency(metrics.totalGMVUplift + metrics.chargebackSavings)}
            </p>
          </div>
        </Card>
      </div>

      <CalculationBreakdown
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
        title={breakdownData.title}
        calculations={breakdownData.calculations}
      />
    </div>
  );
};
