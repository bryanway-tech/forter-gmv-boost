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
    columns?: string[];
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

    // AMER calculations - correct order: Fraud → 3DS → Bank → Manual Review
    const amerBankDeclineRate = (data.amerIssuingBankDeclineRate || 7) / 100;
    const amerBankApproval = 1 - amerBankDeclineRate;
    const amerFraudApproval =
      data.amerFraudCheckTiming === "pre-auth"
        ? (data.amerPreAuthApprovalRate || 95) / 100
        : (data.amerPostAuthApprovalRate || 98.5) / 100;
    
    // Current state: Fraud Approval → 3DS Flow → Bank Authorization → Manual Review
    const amer3DSRate = (data.amer3DSChallengeRate || 0) / 100;
    const amerAbandonmentRate = getAbandonmentRate('amer');
    const amerManualReviewRate = (data.amerManualReviewRate || 0) / 100;
    
    // Step 1: Fraud approval
    const currentAmerFraudApproved = amerRevenue * amerFraudApproval;
    
    // Step 2: 3DS flow
    const currentAmerTo3DS = currentAmerFraudApproved * amer3DSRate;
    const currentAmer3DSAbandoned = currentAmerTo3DS * amerAbandonmentRate;
    const currentAmerPost3DSSuccess = currentAmerTo3DS - currentAmer3DSAbandoned;
    const currentAmerExempt3DS = currentAmerFraudApproved * (1 - amer3DSRate);
    const currentAmerToAuth = currentAmerPost3DSSuccess + currentAmerExempt3DS;
    
    // Step 3: Bank authorization
    const currentAmerBankApproved = currentAmerToAuth * amerBankApproval;
    
    // Step 4: Manual review
    const currentAmerManualReview = currentAmerBankApproved * amerManualReviewRate;
    const currentAmerManualAbandoned = currentAmerManualReview * 0.03;
    const currentAmerCompleted = currentAmerBankApproved - currentAmerManualAbandoned;
    const currentAmerCompleteRate = (currentAmerCompleted / amerRevenue) * 100;
    
    // Future state with Forter
    const bankDeclineImprovement = forterKPIs.bankDeclineImprovement / 100;
    const futureAmerBankDeclineRate = amerBankDeclineRate * (1 - bankDeclineImprovement);
    const futureAmerBankApproval = Math.min(0.99, 1 - futureAmerBankDeclineRate);
    
    const futureAmerFraudApproval = forterKPIs.fraudApprovalRate / 100;
    
    // Apply 3DS optimization - check if absolute or reduction mode
    const futureAmer3DSRate = forterKPIs.threeDSChallengeIsAbsolute
      ? forterKPIs.threeDSChallengeReduction / 100
      : amer3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
      
    const futureAmerAbandonmentRate = forterKPIs.threeDSAbandonmentIsAbsolute
      ? forterKPIs.threeDSAbandonmentImprovement / 100
      : Math.max(0, amerAbandonmentRate * (1 - forterKPIs.threeDSAbandonmentImprovement / 100));
    
    // Apply manual review reduction - check if absolute or reduction mode
    const futureAmerManualReviewRate = forterKPIs.manualReviewIsAbsolute
      ? forterKPIs.manualReviewReduction / 100
      : amerManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);
    
    // Step 1: Fraud approval
    const futureAmerFraudApproved = amerRevenue * futureAmerFraudApproval;
    
    // Step 2: 3DS flow
    const futureAmerTo3DS = futureAmerFraudApproved * futureAmer3DSRate;
    const futureAmer3DSAbandoned = futureAmerTo3DS * futureAmerAbandonmentRate;
    const futureAmerPost3DSSuccess = futureAmerTo3DS - futureAmer3DSAbandoned;
    const futureAmerExempt3DS = futureAmerFraudApproved * (1 - futureAmer3DSRate);
    const futureAmerToAuth = futureAmerPost3DSSuccess + futureAmerExempt3DS;
    
    // Step 3: Bank authorization
    const futureAmerBankApproved = futureAmerToAuth * futureAmerBankApproval;
    
    // Step 4: Manual review
    const futureAmerManualReview = futureAmerBankApproved * futureAmerManualReviewRate;
    const futureAmerManualAbandoned = futureAmerManualReview * 0.02;
    const futureAmerCompleted = futureAmerBankApproved - futureAmerManualAbandoned;
    const futureAmerCompleteRate = (futureAmerCompleted / amerRevenue) * 100;

    // EMEA calculations - correct order: Fraud → 3DS → Bank → Manual Review
    const emeaBankDeclineRate = (data.emeaIssuingBankDeclineRate ?? 5) / 100;
    const emeaBankApproval = 1 - emeaBankDeclineRate;
    const emeaFraudApproval = (data.emeaPreAuthApprovalRate ?? 95) / 100;
    
    const emea3DSRate = (data.emea3DSChallengeRate ?? 0) / 100;
    const emeaAbandonmentRate = getAbandonmentRate('emea');
    const emeaManualReviewRate = (data.emeaManualReviewRate ?? 0) / 100;
    
    // Current state
    const currentEmeaFraudApproved = emeaRevenue * emeaFraudApproval;
    const currentEmeaTo3DS = currentEmeaFraudApproved * emea3DSRate;
    const currentEmea3DSAbandoned = currentEmeaTo3DS * emeaAbandonmentRate;
    const currentEmeaPost3DSSuccess = currentEmeaTo3DS - currentEmea3DSAbandoned;
    const currentEmeaExempt3DS = currentEmeaFraudApproved * (1 - emea3DSRate);
    const currentEmeaToAuth = currentEmeaPost3DSSuccess + currentEmeaExempt3DS;
    const currentEmeaBankApproved = currentEmeaToAuth * emeaBankApproval;
    const currentEmeaManualReview = currentEmeaBankApproved * emeaManualReviewRate;
    const currentEmeaManualAbandoned = currentEmeaManualReview * 0.03;
    const currentEmeaCompleted = currentEmeaBankApproved - currentEmeaManualAbandoned;
    const currentEmeaCompleteRate = (currentEmeaCompleted / emeaRevenue) * 100;
    
    // Future state
    const futureEmeaBankDeclineRate = emeaBankDeclineRate * (1 - bankDeclineImprovement);
    const futureEmeaBankApproval = Math.min(0.99, 1 - futureEmeaBankDeclineRate);
    const futureEmeaFraudApproval = forterKPIs.fraudApprovalRate / 100;
    
    const futureEmea3DSRate = forterKPIs.threeDSChallengeIsAbsolute
      ? forterKPIs.threeDSChallengeReduction / 100
      : emea3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
      
    const futureEmeaAbandonmentRate = forterKPIs.threeDSAbandonmentIsAbsolute
      ? forterKPIs.threeDSAbandonmentImprovement / 100
      : Math.max(0, emeaAbandonmentRate * (1 - forterKPIs.threeDSAbandonmentImprovement / 100));
    
    const futureEmeaManualReviewRate = forterKPIs.manualReviewIsAbsolute
      ? forterKPIs.manualReviewReduction / 100
      : emeaManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);
    
    const futureEmeaFraudApproved = emeaRevenue * futureEmeaFraudApproval;
    const futureEmeaTo3DS = futureEmeaFraudApproved * futureEmea3DSRate;
    const futureEmea3DSAbandoned = futureEmeaTo3DS * futureEmeaAbandonmentRate;
    const futureEmeaPost3DSSuccess = futureEmeaTo3DS - futureEmea3DSAbandoned;
    const futureEmeaExempt3DS = futureEmeaFraudApproved * (1 - futureEmea3DSRate);
    const futureEmeaToAuth = futureEmeaPost3DSSuccess + futureEmeaExempt3DS;
    const futureEmeaBankApproved = futureEmeaToAuth * futureEmeaBankApproval;
    const futureEmeaManualReview = futureEmeaBankApproved * futureEmeaManualReviewRate;
    const futureEmeaManualAbandoned = futureEmeaManualReview * 0.02;
    const futureEmeaCompleted = futureEmeaBankApproved - futureEmeaManualAbandoned;
    const futureEmeaCompleteRate = (futureEmeaCompleted / emeaRevenue) * 100;

    // APAC calculations - correct order: Fraud → 3DS → Bank → Manual Review
    const apacBankDeclineRate = (data.apacIssuingBankDeclineRate ?? 7) / 100;
    const apacBankApproval = 1 - apacBankDeclineRate;
    const apacFraudApproval =
      data.apacFraudCheckTiming === "pre-auth"
        ? (data.apacPreAuthApprovalRate ?? 95) / 100
        : (data.apacPostAuthApprovalRate ?? 98.5) / 100;
    
    const apac3DSRate = (data.apac3DSChallengeRate ?? 0) / 100;
    const apacAbandonmentRate = getAbandonmentRate('apac');
    const apacManualReviewRate = (data.apacManualReviewRate ?? 0) / 100;
    
    // Current state
    const currentApacFraudApproved = apacRevenue * apacFraudApproval;
    const currentApacTo3DS = currentApacFraudApproved * apac3DSRate;
    const currentApac3DSAbandoned = currentApacTo3DS * apacAbandonmentRate;
    const currentApacPost3DSSuccess = currentApacTo3DS - currentApac3DSAbandoned;
    const currentApacExempt3DS = currentApacFraudApproved * (1 - apac3DSRate);
    const currentApacToAuth = currentApacPost3DSSuccess + currentApacExempt3DS;
    const currentApacBankApproved = currentApacToAuth * apacBankApproval;
    const currentApacManualReview = currentApacBankApproved * apacManualReviewRate;
    const currentApacManualAbandoned = currentApacManualReview * 0.03;
    const currentApacCompleted = currentApacBankApproved - currentApacManualAbandoned;
    const currentApacCompleteRate = (currentApacCompleted / apacRevenue) * 100;
    
    // Future state
    const futureApacBankDeclineRate = apacBankDeclineRate * (1 - bankDeclineImprovement);
    const futureApacBankApproval = Math.min(0.99, 1 - futureApacBankDeclineRate);
    const futureApacFraudApproval = forterKPIs.fraudApprovalRate / 100;
    
    const futureApac3DSRate = forterKPIs.threeDSChallengeIsAbsolute
      ? forterKPIs.threeDSChallengeReduction / 100
      : apac3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
      
    const futureApacAbandonmentRate = forterKPIs.threeDSAbandonmentIsAbsolute
      ? forterKPIs.threeDSAbandonmentImprovement / 100
      : Math.max(0, apacAbandonmentRate * (1 - forterKPIs.threeDSAbandonmentImprovement / 100));
    
    const futureApacManualReviewRate = forterKPIs.manualReviewIsAbsolute
      ? forterKPIs.manualReviewReduction / 100
      : apacManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);
    
    const futureApacFraudApproved = apacRevenue * futureApacFraudApproval;
    const futureApacTo3DS = futureApacFraudApproved * futureApac3DSRate;
    const futureApac3DSAbandoned = futureApacTo3DS * futureApacAbandonmentRate;
    const futureApacPost3DSSuccess = futureApacTo3DS - futureApac3DSAbandoned;
    const futureApacExempt3DS = futureApacFraudApproved * (1 - futureApac3DSRate);
    const futureApacToAuth = futureApacPost3DSSuccess + futureApacExempt3DS;
    const futureApacBankApproved = futureApacToAuth * futureApacBankApproval;
    const futureApacManualReview = futureApacBankApproved * futureApacManualReviewRate;
    const futureApacManualAbandoned = futureApacManualReview * 0.02;
    const futureApacCompleted = futureApacBankApproved - futureApacManualAbandoned;
    const futureApacCompleteRate = (futureApacCompleted / apacRevenue) * 100;

    // Calculate GMV uplift
    const amerGMVUplift = futureAmerCompleted - currentAmerCompleted;
    const emeaGMVUplift = futureEmeaCompleted - currentEmeaCompleted;
    const apacGMVUplift = futureApacCompleted - currentApacCompleted;
    const totalGMVUplift = amerGMVUplift + emeaGMVUplift + apacGMVUplift;

    // Chargeback calculations
    const currentChargebacks = totalRevenue * ((data.fraudCBRate ?? 0.8) / 100);
    const reductionRate = forterKPIs.chargebackReduction / 100;
    const futureChargebacks = currentChargebacks * (1 - reductionRate);
    const chargebackSavings = currentChargebacks - futureChargebacks;

    return {
      currentAmerCompleteRate,
      futureAmerCompleteRate,
      currentEmeaCompleteRate,
      futureEmeaCompleteRate,
      currentApacCompleteRate,
      futureApacCompleteRate,
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
      // Store intermediate values for breakdown
      amer: {
        current: { fraudApproved: currentAmerFraudApproved, to3DS: currentAmerTo3DS, abandoned3DS: currentAmer3DSAbandoned, post3DS: currentAmerPost3DSSuccess, exempt3DS: currentAmerExempt3DS, toAuth: currentAmerToAuth, bankApproved: currentAmerBankApproved, manualReview: currentAmerManualReview, manualAbandoned: currentAmerManualAbandoned, completed: currentAmerCompleted },
        future: { fraudApproved: futureAmerFraudApproved, to3DS: futureAmerTo3DS, abandoned3DS: futureAmer3DSAbandoned, post3DS: futureAmerPost3DSSuccess, exempt3DS: futureAmerExempt3DS, toAuth: futureAmerToAuth, bankApproved: futureAmerBankApproved, manualReview: futureAmerManualReview, manualAbandoned: futureAmerManualAbandoned, completed: futureAmerCompleted },
        rates: { fraud: amerFraudApproval, threeds: amer3DSRate, abandonment: amerAbandonmentRate, bank: amerBankApproval, manualReview: amerManualReviewRate },
        futureRates: { fraud: futureAmerFraudApproval, threeds: futureAmer3DSRate, abandonment: futureAmerAbandonmentRate, bank: futureAmerBankApproval, manualReview: futureAmerManualReviewRate }
      },
      emea: {
        current: { fraudApproved: currentEmeaFraudApproved, to3DS: currentEmeaTo3DS, abandoned3DS: currentEmea3DSAbandoned, post3DS: currentEmeaPost3DSSuccess, exempt3DS: currentEmeaExempt3DS, toAuth: currentEmeaToAuth, bankApproved: currentEmeaBankApproved, manualReview: currentEmeaManualReview, manualAbandoned: currentEmeaManualAbandoned, completed: currentEmeaCompleted },
        future: { fraudApproved: futureEmeaFraudApproved, to3DS: futureEmeaTo3DS, abandoned3DS: futureEmea3DSAbandoned, post3DS: futureEmeaPost3DSSuccess, exempt3DS: futureEmeaExempt3DS, toAuth: futureEmeaToAuth, bankApproved: futureEmeaBankApproved, manualReview: futureEmeaManualReview, manualAbandoned: futureEmeaManualAbandoned, completed: futureEmeaCompleted },
        rates: { fraud: emeaFraudApproval, threeds: emea3DSRate, abandonment: emeaAbandonmentRate, bank: emeaBankApproval, manualReview: emeaManualReviewRate },
        futureRates: { fraud: futureEmeaFraudApproval, threeds: futureEmea3DSRate, abandonment: futureEmeaAbandonmentRate, bank: futureEmeaBankApproval, manualReview: futureEmeaManualReviewRate }
      },
      apac: {
        current: { fraudApproved: currentApacFraudApproved, to3DS: currentApacTo3DS, abandoned3DS: currentApac3DSAbandoned, post3DS: currentApacPost3DSSuccess, exempt3DS: currentApacExempt3DS, toAuth: currentApacToAuth, bankApproved: currentApacBankApproved, manualReview: currentApacManualReview, manualAbandoned: currentApacManualAbandoned, completed: currentApacCompleted },
        future: { fraudApproved: futureApacFraudApproved, to3DS: futureApacTo3DS, abandoned3DS: futureApac3DSAbandoned, post3DS: futureApacPost3DSSuccess, exempt3DS: futureApacExempt3DS, toAuth: futureApacToAuth, bankApproved: futureApacBankApproved, manualReview: futureApacManualReview, manualAbandoned: futureApacManualAbandoned, completed: futureApacCompleted },
        rates: { fraud: apacFraudApproval, threeds: apac3DSRate, abandonment: apacAbandonmentRate, bank: apacBankApproval, manualReview: apacManualReviewRate },
        futureRates: { fraud: futureApacFraudApproval, threeds: futureApac3DSRate, abandonment: futureApacAbandonmentRate, bank: futureApacBankApproval, manualReview: futureApacManualReviewRate }
      }
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
    const calculations: any[] = [];
    
    // Helper to calculate AOV for the region
    const getAOV = (revenue: number, attempts: number) => {
      if (attempts && attempts > 0) {
        return revenue / attempts;
      }
      return 105; // Default fallback
    };
    
    // Helper to add regional breakdown with three-column format
    const addRegionalBreakdown = (region: 'AMER' | 'EMEA' | 'APAC', revenue: number, uplift: number) => {
      const regionData = region === 'AMER' ? metrics.amer : region === 'EMEA' ? metrics.emea : metrics.apac;
      const attempts = region === 'AMER' ? data.amerGrossAttempts : region === 'EMEA' ? data.emeaGrossAttempts : data.apacGrossAttempts;
      const aov = getAOV(revenue, attempts || 0);
      const creditCardPercent = 1.0; // Assuming 100% credit card for now
      
      // Add section header
      calculations.push({ 
        label: `${region === 'AMER' ? 'AMER+APAC - Non-EEA' : region === 'EMEA' ? 'EMEA - EEA PSD2' : 'APAC'} - Optimize payments flow`, 
        currentValue: "Current", 
        impactValue: "Impact",
        forterValue: "Forter",
        isHeader: true 
      });
      
      // 1. Pre-Auth Fraud Decisioning
      calculations.push(
        { 
          label: "1. Pre-Auth Fraud Decisioning", 
          currentValue: "", 
          impactValue: "",
          forterValue: "",
          isSubheader: true 
        },
        { 
          label: `${region === 'AMER' ? 'Non-EEA' : region === 'EMEA' ? 'EEA' : 'APAC'} eCommerce gross sales attempts (#)`, 
          currentValue: attempts || Math.round(revenue / aov),
          impactValue: "",
          forterValue: attempts || Math.round(revenue / aov)
        },
        { 
          label: `${region === 'AMER' ? 'Non-EEA' : region === 'EMEA' ? 'EEA' : 'APAC'} eCommerce gross sales attempts ($)`, 
          currentValue: formatCurrency(revenue),
          impactValue: "",
          forterValue: formatCurrency(revenue)
        },
        { 
          label: "Transaction average order value ($)", 
          currentValue: formatCurrency(aov),
          impactValue: "",
          forterValue: formatCurrency(aov)
        },
        { 
          label: "Pre-Auth fraud approval rate (%)", 
          currentValue: `${(regionData.rates.fraud * 100).toFixed(2)}%`,
          impactValue: `${((regionData.futureRates.fraud / regionData.rates.fraud - 1) * 100).toFixed(2)}%`,
          forterValue: `${(regionData.futureRates.fraud * 100).toFixed(2)}%`
        },
        { 
          label: "Pre-Auth fraud approved sales (#)", 
          currentValue: Math.round(regionData.current.fraudApproved / aov),
          impactValue: Math.round((regionData.future.fraudApproved - regionData.current.fraudApproved) / aov),
          forterValue: Math.round(regionData.future.fraudApproved / aov)
        },
        { 
          label: "Pre-Auth fraud approved sales ($)", 
          currentValue: formatCurrency(regionData.current.fraudApproved),
          impactValue: formatCurrency(regionData.future.fraudApproved - regionData.current.fraudApproved),
          forterValue: formatCurrency(regionData.future.fraudApproved)
        }
      );
      
      // 2. 3DS Flow
      calculations.push(
        { 
          label: `2. ${region} 3DS Flow`, 
          currentValue: "", 
          impactValue: "",
          forterValue: "",
          isSubheader: true 
        },
        { 
          label: "Credit card transactions (%)", 
          currentValue: `${(creditCardPercent * 100).toFixed(2)}%`,
          impactValue: "",
          forterValue: `${(creditCardPercent * 100).toFixed(2)}%`
        },
        { 
          label: "Transactions going through 3DS (%)", 
          currentValue: `${(regionData.rates.threeds * 100).toFixed(2)}%`,
          impactValue: `${((regionData.futureRates.threeds - regionData.rates.threeds) * 100).toFixed(2)}%`,
          forterValue: `${(regionData.futureRates.threeds * 100).toFixed(2)}%`
        },
        { 
          label: "Credit card transactions sent to 3DS (#)", 
          currentValue: Math.round(regionData.current.to3DS / aov),
          impactValue: Math.round((regionData.future.to3DS - regionData.current.to3DS) / aov),
          forterValue: Math.round(regionData.future.to3DS / aov)
        },
        { 
          label: "Credit card transactions sent to 3DS ($)", 
          currentValue: formatCurrency(regionData.current.to3DS),
          impactValue: formatCurrency(regionData.future.to3DS - regionData.current.to3DS),
          forterValue: formatCurrency(regionData.future.to3DS)
        },
        { 
          label: "Transaction 3DS failure and abandonment rate (%)", 
          currentValue: `${(regionData.rates.abandonment * 100).toFixed(2)}%`,
          impactValue: `${((regionData.futureRates.abandonment - regionData.rates.abandonment) * 100).toFixed(2)}%`,
          forterValue: `${(regionData.futureRates.abandonment * 100).toFixed(2)}%`
        },
        { 
          label: "3DS failure and abandonment transactions (#)", 
          currentValue: Math.round(regionData.current.abandoned3DS / aov),
          impactValue: Math.round((regionData.future.abandoned3DS - regionData.current.abandoned3DS) / aov),
          forterValue: Math.round(regionData.future.abandoned3DS / aov),
          isBad: true
        },
        { 
          label: "3DS failure and abandonment transactions ($)", 
          currentValue: formatCurrency(regionData.current.abandoned3DS),
          impactValue: formatCurrency(regionData.future.abandoned3DS - regionData.current.abandoned3DS),
          forterValue: formatCurrency(regionData.future.abandoned3DS),
          isBad: true
        },
        { 
          label: "3DS exempt successful (#)", 
          currentValue: Math.round(regionData.current.post3DS / aov),
          impactValue: Math.round((regionData.future.post3DS - regionData.current.post3DS) / aov),
          forterValue: Math.round(regionData.future.post3DS / aov)
        },
        { 
          label: "Exempt credit card transactions (#)", 
          currentValue: Math.round(regionData.current.exempt3DS / aov),
          impactValue: Math.round((regionData.future.exempt3DS - regionData.current.exempt3DS) / aov),
          forterValue: Math.round(regionData.future.exempt3DS / aov)
        },
        { 
          label: "Exempt credit card transactions ($)", 
          currentValue: formatCurrency(regionData.current.exempt3DS),
          impactValue: formatCurrency(regionData.future.exempt3DS - regionData.current.exempt3DS),
          forterValue: formatCurrency(regionData.future.exempt3DS)
        },
        { 
          label: "Total post-3DS success sent to authorization (#)", 
          currentValue: Math.round(regionData.current.toAuth / aov),
          impactValue: Math.round((regionData.future.toAuth - regionData.current.toAuth) / aov),
          forterValue: Math.round(regionData.future.toAuth / aov)
        },
        { 
          label: "Total post-3DS success sent to authorization ($)", 
          currentValue: formatCurrency(regionData.current.toAuth),
          impactValue: formatCurrency(regionData.future.toAuth - regionData.current.toAuth),
          forterValue: formatCurrency(regionData.future.toAuth)
        }
      );
      
      // 3. Issuing Bank
      const currentBankDeclines = regionData.current.toAuth * (1 - regionData.rates.bank);
      const futureBankDeclines = regionData.future.toAuth * (1 - regionData.futureRates.bank);
      
      calculations.push(
        { 
          label: "3. Issuing Bank", 
          currentValue: "", 
          impactValue: "",
          forterValue: "",
          isSubheader: true 
        },
        { 
          label: "Declined transactions by issuing bank (%)", 
          currentValue: `${((1 - regionData.rates.bank) * 100).toFixed(2)}%`,
          impactValue: `${(((1 - regionData.futureRates.bank) - (1 - regionData.rates.bank)) * 100).toFixed(2)}%`,
          forterValue: `${((1 - regionData.futureRates.bank) * 100).toFixed(2)}%`,
          isBad: true
        },
        { 
          label: "Issuing bank declines (#)", 
          currentValue: Math.round(currentBankDeclines / aov),
          impactValue: Math.round((futureBankDeclines - currentBankDeclines) / aov),
          forterValue: Math.round(futureBankDeclines / aov),
          isBad: true
        },
        { 
          label: "Issuing bank declines ($)", 
          currentValue: formatCurrency(currentBankDeclines),
          impactValue: formatCurrency(futureBankDeclines - currentBankDeclines),
          forterValue: formatCurrency(futureBankDeclines),
          isBad: true
        },
        { 
          label: "Post Auth fraud approved sales (#)", 
          currentValue: Math.round(regionData.current.bankApproved / aov),
          impactValue: Math.round((regionData.future.bankApproved - regionData.current.bankApproved) / aov),
          forterValue: Math.round(regionData.future.bankApproved / aov)
        },
        { 
          label: "Post Auth fraud approved sales ($)", 
          currentValue: formatCurrency(regionData.current.bankApproved),
          impactValue: formatCurrency(regionData.future.bankApproved - regionData.current.bankApproved),
          forterValue: formatCurrency(regionData.future.bankApproved)
        }
      );
      
      // 4. Post-Auth Fraud Decisioning (always 100% in current logic)
      calculations.push(
        { 
          label: "4. Post-Auth Fraud Decisioning", 
          currentValue: "", 
          impactValue: "",
          forterValue: "",
          isSubheader: true 
        },
        { 
          label: "Post Auth Fraud approval rate (%)", 
          currentValue: "100.00%",
          impactValue: "0.00%",
          forterValue: "100.00%"
        },
        { 
          label: "Post Auth fraud approved sales (#)", 
          currentValue: Math.round(regionData.current.bankApproved / aov),
          impactValue: Math.round((regionData.future.bankApproved - regionData.current.bankApproved) / aov),
          forterValue: Math.round(regionData.future.bankApproved / aov)
        },
        { 
          label: "Post Auth fraud approved sales ($)", 
          currentValue: formatCurrency(regionData.current.bankApproved),
          impactValue: formatCurrency(regionData.future.bankApproved - regionData.current.bankApproved),
          forterValue: formatCurrency(regionData.future.bankApproved)
        }
      );
      
      // 5. Alternative Payment Methods (assuming 0% for now)
      calculations.push(
        { 
          label: "5. Alternative Payment Methods", 
          currentValue: "", 
          impactValue: "",
          forterValue: "",
          isSubheader: true 
        },
        { 
          label: "Alternative payment means (non-credit card) transactions (%)", 
          currentValue: "0.00%",
          impactValue: "",
          forterValue: "0.00%"
        },
        { 
          label: "Alternative payment methods (non-credit card) transactions (#)", 
          currentValue: "0",
          impactValue: "0",
          forterValue: "0"
        },
        { 
          label: "Alternative payment methods (non-credit card) transactions ($)", 
          currentValue: "$0",
          impactValue: "$0",
          forterValue: "$0"
        },
        { 
          label: "Total non-EEA sales completion (in-scope) (#)", 
          currentValue: Math.round(regionData.current.completed / aov),
          impactValue: Math.round((regionData.future.completed - regionData.current.completed) / aov),
          forterValue: Math.round(regionData.future.completed / aov)
        },
        { 
          label: "Total non-EEA sales completion (in-scope) ($)", 
          currentValue: formatCurrency(regionData.current.completed),
          impactValue: formatCurrency(regionData.future.completed - regionData.current.completed),
          forterValue: formatCurrency(regionData.future.completed)
        },
        { 
          label: "Total non-EEA sales completion (in-scope) - deduped ($)", 
          currentValue: formatCurrency(regionData.current.completed),
          impactValue: formatCurrency(regionData.future.completed - regionData.current.completed),
          forterValue: formatCurrency(regionData.future.completed)
        },
        { 
          label: "Completion rate (%)", 
          currentValue: `${((regionData.current.completed / revenue) * 100).toFixed(2)}%`,
          impactValue: `${(((regionData.future.completed / revenue) - (regionData.current.completed / revenue)) * 100).toFixed(2)}%`,
          forterValue: `${((regionData.future.completed / revenue) * 100).toFixed(2)}%`,
          isResult: true
        }
      );
    };

    // Add breakdown for each active region
    if (data.amerAnnualGMV) {
      addRegionalBreakdown('AMER', metrics.amerRevenue, metrics.amerGMVUplift);
    }
    
    if (data.emeaAnnualGMV) {
      addRegionalBreakdown('EMEA', metrics.emeaRevenue, metrics.emeaGMVUplift);
    }
    
    if (data.apacAnnualGMV) {
      addRegionalBreakdown('APAC', metrics.apacRevenue, metrics.apacGMVUplift);
    }

    // Total GMV Uplift Summary
    calculations.push({ 
      label: "━━━━━━━━━━━━━━━━━", 
      currentValue: "", 
      impactValue: "",
      forterValue: "",
      isHeader: true 
    });
    
    calculations.push({
      label: "TOTAL GMV UPLIFT",
      currentValue: formatCurrency(metrics.totalRevenue - (metrics.totalRevenue - metrics.totalGMVUplift)),
      impactValue: formatCurrency(metrics.totalGMVUplift),
      forterValue: formatCurrency(metrics.totalRevenue),
      isResult: true,
    });

    setBreakdownData({
      title: "GMV Uplift - Detailed Calculation",
      calculations,
      columns: ["Current", "Impact", "Forter"]
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
        columns={breakdownData.columns}
        calculations={breakdownData.calculations}
      />
    </div>
  );
};
