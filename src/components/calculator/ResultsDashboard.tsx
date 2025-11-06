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
  onEditManual: () => void;
  onEditChatbot: () => void;
  onStartOver: () => void;
}

export const ResultsDashboard = ({ data, customerLogoUrl, onEditManual, onEditChatbot, onStartOver }: ResultsDashboardProps) => {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{
    title: string;
    calculations: any[];
  }>({ title: "", calculations: [] });

  const forterKPIs = data.forterKPIs || defaultForterKPIs;

  const getAbandonmentRate = (region: 'amer' | 'emea' | 'apac') => {
    const rate = region === 'amer' 
      ? data.amer3DSAbandonmentRate 
      : region === 'emea' 
      ? data.emea3DSAbandonmentRate 
      : data.apac3DSAbandonmentRate;
    return (rate || 5) / 100; // Default 5% if not specified
  };

  // Calculate current and future states
  const calculateMetrics = () => {
    const amerRevenue = data.amerAnnualGMV || 0;
    const emeaRevenue = data.emeaAnnualGMV || 0;
    const apacRevenue = data.apacAnnualGMV || 0;
    const totalRevenue = amerRevenue + emeaRevenue + apacRevenue;

    // AMER calculations
    const amerBankDeclineRate = (data.amerIssuingBankDeclineRate || 7) / 100;
    const amerBankApproval = 1 - amerBankDeclineRate;
    const amerFraudApproval =
      data.amerFraudCheckTiming === "pre-auth"
        ? (data.amerPreAuthApprovalRate || 95) / 100
        : (data.amerPostAuthApprovalRate || 98.5) / 100;
    
    // Current state with 3DS and manual review impacts
    const amer3DSRate = (data.amer3DSChallengeRate || 0) / 100;
    const amerAbandonmentRate = getAbandonmentRate('amer');
    const amerManualReviewRate = (data.amerManualReviewRate || 0) / 100;
    const currentAmerCompleteRate = amerBankApproval * amerFraudApproval * (1 - amer3DSRate * amerAbandonmentRate) * (1 - amerManualReviewRate * 0.03);
    
    // Future state with Forter - fix bank decline calculation per Excel J26
    const bankDeclineImprovement = forterKPIs.bankDeclineImprovement / 100;
    const futureAmerBankDeclineRate = amerBankDeclineRate * (1 - bankDeclineImprovement);
    const futureAmerBankApproval = Math.min(0.99, 1 - futureAmerBankDeclineRate);
    
    // Apply 3DS optimization
    const forter3DSReduction = forterKPIs.threeDSChallengeReduction / 100;
    const futureAmer3DSRate = amer3DSRate * (1 - forter3DSReduction);
    const forterAbandonmentImprovement = forterKPIs.threeDSAbandonmentImprovement / 100;
    const futureAmerAbandonmentRate = Math.max(0, amerAbandonmentRate - forterAbandonmentImprovement);
    const threeDSApprovalImpact = 1 - futureAmer3DSRate * futureAmerAbandonmentRate;
    
    // Apply manual review reduction
    const forterManualReviewReduction = forterKPIs.manualReviewReduction / 100;
    const futureAmerManualReviewRate = amerManualReviewRate * (1 - forterManualReviewReduction);
    const manualReviewImpact = 1 - futureAmerManualReviewRate * 0.02;
    
    const futureAmerCompleteRate = futureAmerBankApproval * (forterKPIs.fraudApprovalRate / 100) * threeDSApprovalImpact * manualReviewImpact;

    // EMEA calculations
    const emeaBankDeclineRate = (data.emeaIssuingBankDeclineRate || 5) / 100;
    const emeaBankApproval = 1 - emeaBankDeclineRate;
    const emeaFraudApproval = (data.emeaPreAuthApprovalRate || 95) / 100;
    
    const emea3DSRate = (data.emea3DSChallengeRate || 0) / 100;
    const emeaAbandonmentRate = getAbandonmentRate('emea');
    const emeaManualReviewRate = (data.emeaManualReviewRate || 0) / 100;
    const currentEmeaCompleteRate = emeaBankApproval * emeaFraudApproval * (1 - emea3DSRate * emeaAbandonmentRate) * (1 - emeaManualReviewRate * 0.03);
    
    const futureEmeaBankDeclineRate = emeaBankDeclineRate * (1 - bankDeclineImprovement);
    const futureEmeaBankApproval = Math.min(0.99, 1 - futureEmeaBankDeclineRate);
    const futureEmea3DSRate = emea3DSRate * (1 - forter3DSReduction);
    const futureEmeaAbandonmentRate = Math.max(0, emeaAbandonmentRate - forterAbandonmentImprovement);
    const emea3DSApprovalImpact = 1 - futureEmea3DSRate * futureEmeaAbandonmentRate;
    const futureEmeaManualReviewRate = emeaManualReviewRate * (1 - forterManualReviewReduction);
    const emeaManualReviewImpact = 1 - futureEmeaManualReviewRate * 0.02;
    const futureEmeaCompleteRate = futureEmeaBankApproval * (forterKPIs.fraudApprovalRate / 100) * emea3DSApprovalImpact * emeaManualReviewImpact;

    // APAC calculations
    const apacBankDeclineRate = (data.apacIssuingBankDeclineRate || 7) / 100;
    const apacBankApproval = 1 - apacBankDeclineRate;
    const apacFraudApproval =
      data.apacFraudCheckTiming === "pre-auth"
        ? (data.apacPreAuthApprovalRate || 95) / 100
        : (data.apacPostAuthApprovalRate || 98.5) / 100;
    
    const apac3DSRate = (data.apac3DSChallengeRate || 0) / 100;
    const apacAbandonmentRate = getAbandonmentRate('apac');
    const apacManualReviewRate = (data.apacManualReviewRate || 0) / 100;
    const currentApacCompleteRate = apacBankApproval * apacFraudApproval * (1 - apac3DSRate * apacAbandonmentRate) * (1 - apacManualReviewRate * 0.03);
    
    const futureApacBankDeclineRate = apacBankDeclineRate * (1 - bankDeclineImprovement);
    const futureApacBankApproval = Math.min(0.99, 1 - futureApacBankDeclineRate);
    const futureApac3DSRate = apac3DSRate * (1 - forter3DSReduction);
    const futureApacAbandonmentRate = Math.max(0, apacAbandonmentRate - forterAbandonmentImprovement);
    const apac3DSApprovalImpact = 1 - futureApac3DSRate * futureApacAbandonmentRate;
    const futureApacManualReviewRate = apacManualReviewRate * (1 - forterManualReviewReduction);
    const apacManualReviewImpact = 1 - futureApacManualReviewRate * 0.02;
    const futureApacCompleteRate = futureApacBankApproval * (forterKPIs.fraudApprovalRate / 100) * apac3DSApprovalImpact * apacManualReviewImpact;

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
    
    // Helper to add regional breakdown
    const addRegionalBreakdown = (region: 'AMER' | 'EMEA' | 'APAC', revenue: number, uplift: number) => {
      const bankDeclineRate = region === 'AMER' 
        ? (data.amerIssuingBankDeclineRate || 7) / 100
        : region === 'EMEA'
        ? (data.emeaIssuingBankDeclineRate || 5) / 100
        : (data.apacIssuingBankDeclineRate || 7) / 100;
      
      const fraudApproval = region === 'AMER'
        ? (data.amerFraudCheckTiming === "pre-auth" 
          ? (data.amerPreAuthApprovalRate || 95) / 100 
          : (data.amerPostAuthApprovalRate || 98.5) / 100)
        : region === 'EMEA'
        ? (data.emeaPreAuthApprovalRate || 95) / 100
        : (data.apacFraudCheckTiming === "pre-auth"
          ? (data.apacPreAuthApprovalRate || 95) / 100
          : (data.apacPostAuthApprovalRate || 98.5) / 100);
      
      const threeDSRate = region === 'AMER'
        ? (data.amer3DSChallengeRate || 0) / 100
        : region === 'EMEA'
        ? (data.emea3DSChallengeRate || 0) / 100
        : (data.apac3DSChallengeRate || 0) / 100;
      
      const manualReviewRate = region === 'AMER'
        ? (data.amerManualReviewRate || 0) / 100
        : region === 'EMEA'
        ? (data.emeaManualReviewRate || 0) / 100
        : (data.apacManualReviewRate || 0) / 100;
      
      const currentBankApproval = 1 - bankDeclineRate;
      const abandonmentRate = getAbandonmentRate(region.toLowerCase() as 'amer' | 'emea' | 'apac');
      const current3DSImpact = 1 - threeDSRate * abandonmentRate;
      const currentManualReviewImpact = 1 - manualReviewRate * 0.03;
      const currentCompleteRate = currentBankApproval * fraudApproval * current3DSImpact * currentManualReviewImpact;
      
      // Future state
      const bankDeclineImprovement = forterKPIs.bankDeclineImprovement / 100;
      const futureBankDeclineRate = bankDeclineRate * (1 - bankDeclineImprovement);
      const futureBankApproval = Math.min(0.99, 1 - futureBankDeclineRate);
      
      // Apply 3DS optimization
      const forter3DSReduction = forterKPIs.threeDSChallengeReduction / 100;
      const future3DSRate = threeDSRate * (1 - forter3DSReduction);
      const forterAbandonmentImprovement = forterKPIs.threeDSAbandonmentImprovement / 100;
      const futureAbandonmentRate = Math.max(0, abandonmentRate - forterAbandonmentImprovement);
      const future3DSImpact = 1 - future3DSRate * futureAbandonmentRate;
      
      const forterManualReviewReduction = forterKPIs.manualReviewReduction / 100;
      const futureManualReviewRate = manualReviewRate * (1 - forterManualReviewReduction);
      const futureManualReviewImpact = 1 - futureManualReviewRate * 0.02;
      
      const forterFraudApproval = forterKPIs.fraudApprovalRate / 100;
      const futureCompleteRate = futureBankApproval * forterFraudApproval * future3DSImpact * futureManualReviewImpact;
      
      // Add section header
      calculations.push({ 
        label: `━━━━━ ${region} Region ━━━━━`, 
        value: "", 
        isHeader: true 
      });
      
      // 1. Pre-Auth Fraud Decisioning
      calculations.push(
        { label: "1. PRE-AUTH FRAUD DECISIONING", value: "", isSubheader: true },
        { label: "   Gross Sales Attempts", value: formatCurrency(revenue) },
        { label: "   Current Pre-Auth Approval Rate", value: `${(fraudApproval * 100).toFixed(2)}%` },
        { label: "   Pre-Auth Approved Sales (Current)", value: formatCurrency(revenue * fraudApproval), formula: `${formatCurrency(revenue)} × ${(fraudApproval * 100).toFixed(2)}%` },
        { label: "   Forter Pre-Auth Approval Rate", value: `${forterKPIs.fraudApprovalRate}%` },
        { label: "   Pre-Auth Approved Sales (Forter)", value: formatCurrency(revenue * forterFraudApproval), formula: `${formatCurrency(revenue)} × ${forterKPIs.fraudApprovalRate}%` }
      );
      
      // 2. 3DS Flow
      if (threeDSRate > 0) {
        calculations.push(
          { label: "2. 3DS CHALLENGE FLOW", value: "", isSubheader: true },
          { label: "   Current 3DS Challenge Rate", value: `${(threeDSRate * 100).toFixed(2)}%` },
          { label: "   Current 3DS Abandonment Rate", value: `${(abandonmentRate * 100).toFixed(2)}%` },
          { label: "   Current 3DS Abandonment Impact", value: `${((1 - current3DSImpact) * 100).toFixed(2)}%`, formula: `${(threeDSRate * 100).toFixed(2)}% × ${(abandonmentRate * 100).toFixed(2)}% abandonment` },
          { label: "   Forter 3DS Challenge Rate", value: `${(future3DSRate * 100).toFixed(2)}%`, formula: `${(threeDSRate * 100).toFixed(2)}% × (1 - ${forterKPIs.threeDSChallengeReduction}%)` },
          { label: "   Forter 3DS Abandonment Improvement", value: `${forterKPIs.threeDSAbandonmentImprovement}%` },
          { label: "   Forter 3DS Abandonment Rate", value: `${(futureAbandonmentRate * 100).toFixed(2)}%`, formula: `${(abandonmentRate * 100).toFixed(2)}% - ${forterKPIs.threeDSAbandonmentImprovement}%` },
          { label: "   Forter 3DS Impact", value: `${((1 - future3DSImpact) * 100).toFixed(2)}%`, formula: `${(future3DSRate * 100).toFixed(2)}% × ${(futureAbandonmentRate * 100).toFixed(2)}%` }
        );
      }
      
      // 3. Issuing Bank Authorization
      calculations.push(
        { label: "3. ISSUING BANK AUTHORIZATION", value: "", isSubheader: true },
        { label: "   Current Bank Decline Rate", value: `${(bankDeclineRate * 100).toFixed(2)}%` },
        { label: "   Current Bank Approval Rate", value: `${(currentBankApproval * 100).toFixed(2)}%`, formula: `100% - ${(bankDeclineRate * 100).toFixed(2)}%` },
        { label: "   Forter Bank Decline Improvement", value: `${forterKPIs.bankDeclineImprovement}%` },
        { label: "   Forter Bank Decline Rate", value: `${(futureBankDeclineRate * 100).toFixed(2)}%`, formula: `${(bankDeclineRate * 100).toFixed(2)}% × (1 - ${forterKPIs.bankDeclineImprovement}%)` },
        { label: "   Forter Bank Approval Rate", value: `${(futureBankApproval * 100).toFixed(2)}%`, formula: `100% - ${(futureBankDeclineRate * 100).toFixed(2)}%` }
      );
      
      // 4. Manual Review
      if (manualReviewRate > 0) {
        calculations.push(
          { label: "4. MANUAL REVIEW", value: "", isSubheader: true },
          { label: "   Current Manual Review Rate", value: `${(manualReviewRate * 100).toFixed(2)}%` },
          { label: "   Current Manual Review Impact", value: `${((1 - currentManualReviewImpact) * 100).toFixed(2)}%`, formula: `${(manualReviewRate * 100).toFixed(2)}% × 3% abandonment` },
          { label: "   Forter Manual Review Reduction", value: `${forterKPIs.manualReviewReduction}%` },
          { label: "   Forter Manual Review Rate", value: `${(futureManualReviewRate * 100).toFixed(2)}%`, formula: `${(manualReviewRate * 100).toFixed(2)}% × (1 - ${forterKPIs.manualReviewReduction}%)` },
          { label: "   Forter Manual Review Impact", value: `${((1 - futureManualReviewImpact) * 100).toFixed(2)}%`, formula: `${(futureManualReviewRate * 100).toFixed(2)}% × 2% abandonment` }
        );
      }
      
      // Complete Rates
      calculations.push(
        { label: "COMPLETE RATES", value: "", isSubheader: true },
        { label: "   Current Complete Rate", value: `${(currentCompleteRate * 100).toFixed(2)}%`, formula: `${(currentBankApproval * 100).toFixed(2)}% × ${(fraudApproval * 100).toFixed(2)}%${threeDSRate > 0 ? ` × ${(current3DSImpact * 100).toFixed(2)}%` : ''}${manualReviewRate > 0 ? ` × ${(currentManualReviewImpact * 100).toFixed(2)}%` : ''}` },
        { label: "   Forter Complete Rate", value: `${(futureCompleteRate * 100).toFixed(2)}%`, formula: `${(futureBankApproval * 100).toFixed(2)}% × ${forterKPIs.fraudApprovalRate}%${threeDSRate > 0 || future3DSRate > 0 ? ` × ${(future3DSImpact * 100).toFixed(2)}%` : ''}${manualReviewRate > 0 ? ` × ${(futureManualReviewImpact * 100).toFixed(2)}%` : ''}` },
        { label: "   GMV Uplift", value: formatCurrency(uplift), formula: `${formatCurrency(revenue)} × (${(futureCompleteRate * 100).toFixed(2)}% - ${(currentCompleteRate * 100).toFixed(2)}%)`, isResult: true }
      );
    };

    if (data.amerAnnualGMV) {
      addRegionalBreakdown('AMER', metrics.amerRevenue, metrics.amerGMVUplift);
    }
    
    if (data.emeaAnnualGMV) {
      addRegionalBreakdown('EMEA', metrics.emeaRevenue, metrics.emeaGMVUplift);
    }
    
    if (data.apacAnnualGMV) {
      addRegionalBreakdown('APAC', metrics.apacRevenue, metrics.apacGMVUplift);
    }

    calculations.push({ 
      label: "━━━━━━━━━━━━━━━━━", 
      value: "", 
      isHeader: true 
    });
    calculations.push({
      label: "TOTAL GMV UPLIFT",
      value: metrics.totalGMVUplift,
      isResult: true,
    });

    setBreakdownData({
      title: "GMV Uplift - Detailed Calculation",
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
      title: `${region.toUpperCase()} Current Complete Rate Calculation`,
      calculations,
    });
    setBreakdownOpen(true);
  };

  const showForterCompleteRateBreakdown = (region: 'amer' | 'emea' | 'apac') => {
    const calculations = [];
    
    if (region === 'amer') {
      const bankDeclineRate = data.amerIssuingBankDeclineRate || 7;
      const currentBankDeclinePercent = bankDeclineRate;
      const currentBankApproval = 1 - bankDeclineRate / 100;
      const bankDeclineImprovement = forterKPIs.bankDeclineImprovement;
      const improvedBankDeclineRate = bankDeclineRate * (1 - bankDeclineImprovement / 100);
      const futureBankApproval = Math.min(0.99, 1 - improvedBankDeclineRate / 100);
      const forterFraudApproval = forterKPIs.fraudApprovalRate / 100;
      
      // 3DS optimization
      const amer3DSRate = data.amer3DSChallengeRate || 0;
      const futureAmer3DSRate = amer3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
      
      // Manual review optimization
      const amerManualReviewRate = data.amerManualReviewRate || 0;
      const futureAmerManualReviewRate = amerManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);
      
      calculations.push(
        { label: "Current Bank Decline Rate", value: `${currentBankDeclinePercent}%` },
        { label: "Forter Bank Decline Improvement", value: `${bankDeclineImprovement}%` },
        { 
          label: "Improved Bank Decline Rate", 
          value: `${improvedBankDeclineRate.toFixed(2)}%`,
          formula: `${currentBankDeclinePercent}% × (1 - ${bankDeclineImprovement}%)`
        },
        { 
          label: "Improved Bank Approval Rate", 
          value: `${(futureBankApproval * 100).toFixed(2)}%`,
          formula: `100% - ${improvedBankDeclineRate.toFixed(2)}%`
        },
        { label: "Forter Fraud Approval Rate", value: `${forterKPIs.fraudApprovalRate}%` }
      );
      
      if (amer3DSRate > 0) {
        calculations.push(
          { label: "Current 3DS Challenge Rate", value: `${amer3DSRate}%` },
          { 
            label: "Optimized 3DS Challenge Rate", 
            value: `${futureAmer3DSRate.toFixed(2)}%`,
            formula: `${amer3DSRate}% × (1 - ${forterKPIs.threeDSChallengeReduction}%)`
          }
        );
      }
      
      if (amerManualReviewRate > 0) {
        calculations.push(
          { label: "Current Manual Review Rate", value: `${amerManualReviewRate}%` },
          { 
            label: "Optimized Manual Review Rate", 
            value: `${futureAmerManualReviewRate.toFixed(2)}%`,
            formula: `${amerManualReviewRate}% × (1 - ${forterKPIs.manualReviewReduction}%)`
          }
        );
      }
      
      calculations.push({
        label: "Future Complete Rate with Forter",
        value: `${metrics.futureAmerCompleteRate.toFixed(2)}%`,
        isResult: true,
      });
    } else if (region === 'emea') {
      const bankDeclineRate = data.emeaIssuingBankDeclineRate || 5;
      const currentBankDeclinePercent = bankDeclineRate;
      const currentBankApproval = 1 - bankDeclineRate / 100;
      const bankDeclineImprovement = forterKPIs.bankDeclineImprovement;
      const improvedBankDeclineRate = bankDeclineRate * (1 - bankDeclineImprovement / 100);
      const futureBankApproval = Math.min(0.99, 1 - improvedBankDeclineRate / 100);
      const forterFraudApproval = forterKPIs.fraudApprovalRate / 100;
      
      const emea3DSRate = data.emea3DSChallengeRate || 0;
      const futureEmea3DSRate = emea3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
      const emeaManualReviewRate = data.emeaManualReviewRate || 0;
      const futureEmeaManualReviewRate = emeaManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);
      
      calculations.push(
        { label: "Current Bank Decline Rate", value: `${currentBankDeclinePercent}%` },
        { label: "Forter Bank Decline Improvement", value: `${bankDeclineImprovement}%` },
        { 
          label: "Improved Bank Decline Rate", 
          value: `${improvedBankDeclineRate.toFixed(2)}%`,
          formula: `${currentBankDeclinePercent}% × (1 - ${bankDeclineImprovement}%)`
        },
        { 
          label: "Improved Bank Approval Rate", 
          value: `${(futureBankApproval * 100).toFixed(2)}%`,
          formula: `100% - ${improvedBankDeclineRate.toFixed(2)}%`
        },
        { label: "Forter Fraud Approval Rate", value: `${forterKPIs.fraudApprovalRate}%` }
      );
      
      if (emea3DSRate > 0) {
        calculations.push(
          { label: "Current 3DS Challenge Rate", value: `${emea3DSRate}%` },
          { 
            label: "Optimized 3DS Challenge Rate", 
            value: `${futureEmea3DSRate.toFixed(2)}%`,
            formula: `${emea3DSRate}% × (1 - ${forterKPIs.threeDSChallengeReduction}%)`
          }
        );
      }
      
      if (emeaManualReviewRate > 0) {
        calculations.push(
          { label: "Current Manual Review Rate", value: `${emeaManualReviewRate}%` },
          { 
            label: "Optimized Manual Review Rate", 
            value: `${futureEmeaManualReviewRate.toFixed(2)}%`,
            formula: `${emeaManualReviewRate}% × (1 - ${forterKPIs.manualReviewReduction}%)`
          }
        );
      }
      
      calculations.push({
        label: "Future Complete Rate with Forter",
        value: `${metrics.futureEmeaCompleteRate.toFixed(2)}%`,
        isResult: true,
      });
    } else {
      const bankDeclineRate = data.apacIssuingBankDeclineRate || 7;
      const currentBankDeclinePercent = bankDeclineRate;
      const currentBankApproval = 1 - bankDeclineRate / 100;
      const bankDeclineImprovement = forterKPIs.bankDeclineImprovement;
      const improvedBankDeclineRate = bankDeclineRate * (1 - bankDeclineImprovement / 100);
      const futureBankApproval = Math.min(0.99, 1 - improvedBankDeclineRate / 100);
      const forterFraudApproval = forterKPIs.fraudApprovalRate / 100;
      
      const apac3DSRate = data.apac3DSChallengeRate || 0;
      const futureApac3DSRate = apac3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
      const apacManualReviewRate = data.apacManualReviewRate || 0;
      const futureApacManualReviewRate = apacManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);
      
      calculations.push(
        { label: "Current Bank Decline Rate", value: `${currentBankDeclinePercent}%` },
        { label: "Forter Bank Decline Improvement", value: `${bankDeclineImprovement}%` },
        { 
          label: "Improved Bank Decline Rate", 
          value: `${improvedBankDeclineRate.toFixed(2)}%`,
          formula: `${currentBankDeclinePercent}% × (1 - ${bankDeclineImprovement}%)`
        },
        { 
          label: "Improved Bank Approval Rate", 
          value: `${(futureBankApproval * 100).toFixed(2)}%`,
          formula: `100% - ${improvedBankDeclineRate.toFixed(2)}%`
        },
        { label: "Forter Fraud Approval Rate", value: `${forterKPIs.fraudApprovalRate}%` }
      );
      
      if (apac3DSRate > 0) {
        calculations.push(
          { label: "Current 3DS Challenge Rate", value: `${apac3DSRate}%` },
          { 
            label: "Optimized 3DS Challenge Rate", 
            value: `${futureApac3DSRate.toFixed(2)}%`,
            formula: `${apac3DSRate}% × (1 - ${forterKPIs.threeDSChallengeReduction}%)`
          }
        );
      }
      
      if (apacManualReviewRate > 0) {
        calculations.push(
          { label: "Current Manual Review Rate", value: `${apacManualReviewRate}%` },
          { 
            label: "Optimized Manual Review Rate", 
            value: `${futureApacManualReviewRate.toFixed(2)}%`,
            formula: `${apacManualReviewRate}% × (1 - ${forterKPIs.manualReviewReduction}%)`
          }
        );
      }
      
      calculations.push({
        label: "Future Complete Rate with Forter",
        value: `${metrics.futureApacCompleteRate.toFixed(2)}%`,
        isResult: true,
      });
    }

    setBreakdownData({
      title: `${region.toUpperCase()} Future Complete Rate with Forter`,
      calculations,
    });
    setBreakdownOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <img src={forterLogo} alt="Forter" className="h-12 object-contain" />
            {customerLogoUrl && (
              <img src={customerLogoUrl} alt="Customer" className="h-12 object-contain" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={onEditManual}>
              Edit Manual Inputs
            </Button>
            <Button variant="outline" onClick={onEditChatbot}>
              Return to AI Chat
            </Button>
            <Button variant="outline" onClick={onStartOver}>
              Start Over
            </Button>
          </div>
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
                  <div 
                    className="flex justify-between items-center p-4 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => showForterCompleteRateBreakdown('amer')}
                  >
                    <div className="flex items-center gap-2">
                      <span>With Forter</span>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
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
                  <div 
                    className="flex justify-between items-center p-4 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => showForterCompleteRateBreakdown('emea')}
                  >
                    <div className="flex items-center gap-2">
                      <span>With Forter</span>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
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
                  <div 
                    className="flex justify-between items-center p-4 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => showForterCompleteRateBreakdown('apac')}
                  >
                    <div className="flex items-center gap-2">
                      <span>With Forter</span>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
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
              • Forter's {forterKPIs.fraudApprovalRate}% fraud approval rate, {forterKPIs.bankDeclineImprovement}% bank decline reduction, 
              {forterKPIs.threeDSChallengeReduction}% 3DS optimization, and {forterKPIs.manualReviewReduction}% manual review reduction 
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
