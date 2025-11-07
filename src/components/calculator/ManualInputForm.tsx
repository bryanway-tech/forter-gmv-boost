import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorData } from "@/pages/Index";
import { ForterKPIConfig, defaultForterKPIs } from "@/components/calculator/ForterKPIConfig";
import { ChallengeSelection } from "@/components/calculator/ChallengeSelection";
import { ValueSummary } from "@/components/calculator/ValueSummary";
import { toast } from "sonner";
import { ResultsDashboard } from "./ResultsDashboard";
import { CalculationBreakdown } from "./CalculationBreakdown";

interface ManualInputFormProps {
  onComplete: (data: CalculatorData) => void;
  initialData?: CalculatorData;
}

export const ManualInputForm = ({ onComplete, initialData }: ManualInputFormProps) => {
  const [formData, setFormData] = useState<CalculatorData>(
    initialData || {
      amerGrossMarginPercent: 50,
      emeaGrossMarginPercent: 50,
      apacGrossMarginPercent: 50,
      fraudCBAOV: 158,
      serviceCBAOV: 158,
      forterKPIs: defaultForterKPIs,
    }
  );

  const [selectedChallenges, setSelectedChallenges] = useState<{ [key: string]: boolean }>({});
  const [selectedSolutions, setSelectedSolutions] = useState<{ [key: string]: boolean }>({});
  const [showResults, setShowResults] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{
    title: string;
    columns?: string[];
    calculations: any[];
  }>({ title: "", calculations: [] });
  const [driverToggles, setDriverToggles] = useState<{ [key: string]: boolean }>({
    'gmv-uplift': true,
    'chargeback-savings': true
  });
  const [marginEnabled, setMarginEnabled] = useState(true);

  const updateField = (field: keyof CalculatorData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatNumberWithCommas = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return "";
    return value.toLocaleString("en-US");
  };

  const parseNumberFromString = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleNumericChange = (field: keyof CalculatorData, value: string) => {
    const numericValue = parseNumberFromString(value);
    updateField(field, numericValue);
  };

  const handleChallengeChange = (challengeId: string, checked: boolean) => {
    setSelectedChallenges(prev => ({ ...prev, [challengeId]: checked }));
    
    // Auto-enable/disable solutions based on challenges
    if (challengeId.startsWith('fraud-systems')) {
      setSelectedSolutions(prev => ({ 
        ...prev, 
        'fraud-management': checked,
        'payments-optimization': checked 
      }));
    } else if (challengeId.startsWith('payments')) {
      setSelectedSolutions(prev => ({ ...prev, 'payments-optimization': checked }));
    }
  };

  const handleSolutionChange = (solutionId: string, checked: boolean) => {
    setSelectedSolutions(prev => ({ ...prev, [solutionId]: checked }));
  };

  const handleDriverToggle = (driverId: string, enabled: boolean) => {
    setDriverToggles(prev => ({ ...prev, [driverId]: enabled }));
  };

  const handleMarginToggle = (enabled: boolean) => {
    setMarginEnabled(enabled);
  };

  const handleSubmit = () => {
    if (!formData.amerAnnualGMV && !formData.emeaAnnualGMV && !formData.apacAnnualGMV) {
      toast.error("Please enter GMV for at least one region");
      return;
    }

    setShowResults(true);
    toast.success("Calculating your value assessment...");
  };

  const handleEditResults = () => {
    setShowResults(false);
  };

  if (showResults) {
    return (
      <ResultsDashboard
        data={formData}
        onEditManual={handleEditResults}
        onEditChatbot={() => {}}
        onStartOver={() => setShowResults(false)}
      />
    );
  }

  // Determine which data inputs to show based on selected challenges
  const showFraudInputs = Object.keys(selectedChallenges).some(k => k.startsWith('fraud-systems') && selectedChallenges[k]);
  const showPaymentsInputs = Object.keys(selectedChallenges).some(k => k.startsWith('payments') && selectedChallenges[k]);

  // Calculate metrics for Value Summary
  const metrics = useMemo(() => {
    const forterKPIs = formData.forterKPIs || defaultForterKPIs;
    
    const amerRevenue = formData.amerAnnualGMV || 0;
    const emeaRevenue = formData.emeaAnnualGMV || 0;
    const apacRevenue = formData.apacAnnualGMV || 0;
    const totalRevenue = amerRevenue + emeaRevenue + apacRevenue;

    if (totalRevenue === 0) {
      return { totalGMVUplift: 0, chargebackSavings: 0, totalValue: 0, profitValue: 0 };
    }

    // Helper to get abandonment rate
    const getAbandonmentRate = (rate: number | undefined) => (rate !== undefined && rate !== null ? rate : 0) / 100;

    // AMER calculations
    const amerBankDeclineRate = (formData.amerIssuingBankDeclineRate || 7) / 100;
    const amerBankApproval = 1 - amerBankDeclineRate;
    const amerFraudApproval = formData.amerFraudCheckTiming === "pre-auth"
      ? (formData.amerPreAuthApprovalRate || 95) / 100
      : (formData.amerPostAuthApprovalRate || 98.5) / 100;
    const amer3DSRate = (formData.amer3DSChallengeRate || 0) / 100;
    const amerAbandonmentRate = getAbandonmentRate(formData.amer3DSAbandonmentRate);
    const amerManualReviewRate = (formData.amerManualReviewRate || 0) / 100;

    const currentAmerFraudApproved = amerRevenue * amerFraudApproval;
    const currentAmerTo3DS = currentAmerFraudApproved * amer3DSRate;
    const currentAmer3DSAbandoned = currentAmerTo3DS * amerAbandonmentRate;
    const currentAmerPost3DSSuccess = currentAmerTo3DS - currentAmer3DSAbandoned;
    const currentAmerExempt3DS = currentAmerFraudApproved * (1 - amer3DSRate);
    const currentAmerToAuth = currentAmerPost3DSSuccess + currentAmerExempt3DS;
    const currentAmerBankApproved = currentAmerToAuth * amerBankApproval;
    const currentAmerManualReview = currentAmerBankApproved * amerManualReviewRate;
    const currentAmerManualAbandoned = currentAmerManualReview * 0.03;
    const currentAmerCompleted = currentAmerBankApproved - currentAmerManualAbandoned;

    const bankDeclineImprovement = forterKPIs.bankDeclineImprovement / 100;
    const futureAmerBankDeclineRate = amerBankDeclineRate * (1 - bankDeclineImprovement);
    const futureAmerBankApproval = Math.min(0.99, 1 - futureAmerBankDeclineRate);
    const futureAmerFraudApproval = forterKPIs.fraudApprovalRate / 100;
    const futureAmer3DSRate = forterKPIs.threeDSChallengeIsAbsolute
      ? forterKPIs.threeDSChallengeReduction / 100
      : amer3DSRate * (1 - forterKPIs.threeDSChallengeReduction / 100);
    const futureAmerAbandonmentRate = forterKPIs.threeDSAbandonmentIsAbsolute
      ? forterKPIs.threeDSAbandonmentImprovement / 100
      : Math.max(0, amerAbandonmentRate * (1 - forterKPIs.threeDSAbandonmentImprovement / 100));
    const futureAmerManualReviewRate = forterKPIs.manualReviewIsAbsolute
      ? forterKPIs.manualReviewReduction / 100
      : amerManualReviewRate * (1 - forterKPIs.manualReviewReduction / 100);

    const futureAmerFraudApproved = amerRevenue * futureAmerFraudApproval;
    const futureAmerTo3DS = futureAmerFraudApproved * futureAmer3DSRate;
    const futureAmer3DSAbandoned = futureAmerTo3DS * futureAmerAbandonmentRate;
    const futureAmerPost3DSSuccess = futureAmerTo3DS - futureAmer3DSAbandoned;
    const futureAmerExempt3DS = futureAmerFraudApproved * (1 - futureAmer3DSRate);
    const futureAmerToAuth = futureAmerPost3DSSuccess + futureAmerExempt3DS;
    const futureAmerBankApproved = futureAmerToAuth * futureAmerBankApproval;
    const futureAmerManualReview = futureAmerBankApproved * futureAmerManualReviewRate;
    const futureAmerManualAbandoned = futureAmerManualReview * 0.02;
    const futureAmerCompleted = futureAmerBankApproved - futureAmerManualAbandoned;

    // EMEA calculations
    const emeaBankDeclineRate = (formData.emeaIssuingBankDeclineRate ?? 5) / 100;
    const emeaBankApproval = 1 - emeaBankDeclineRate;
    const emeaFraudApproval = (formData.emeaPreAuthApprovalRate ?? 95) / 100;
    const emea3DSRate = (formData.emea3DSChallengeRate ?? 0) / 100;
    const emeaAbandonmentRate = getAbandonmentRate(formData.emea3DSAbandonmentRate);
    const emeaManualReviewRate = (formData.emeaManualReviewRate ?? 0) / 100;

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

    // APAC calculations
    const apacBankDeclineRate = (formData.apacIssuingBankDeclineRate ?? 7) / 100;
    const apacBankApproval = 1 - apacBankDeclineRate;
    const apacFraudApproval = formData.apacFraudCheckTiming === "pre-auth"
      ? (formData.apacPreAuthApprovalRate ?? 95) / 100
      : (formData.apacPostAuthApprovalRate ?? 98.5) / 100;
    const apac3DSRate = (formData.apac3DSChallengeRate ?? 0) / 100;
    const apacAbandonmentRate = getAbandonmentRate(formData.apac3DSAbandonmentRate);
    const apacManualReviewRate = (formData.apacManualReviewRate ?? 0) / 100;

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

    // Calculate GMV uplift
    const amerGMVUplift = futureAmerCompleted - currentAmerCompleted;
    const emeaGMVUplift = futureEmeaCompleted - currentEmeaCompleted;
    const apacGMVUplift = futureApacCompleted - currentApacCompleted;
    const totalGMVUplift = amerGMVUplift + emeaGMVUplift + apacGMVUplift;

    // Chargeback calculations
    const currentChargebacks = totalRevenue * ((formData.fraudCBRate ?? 0.8) / 100);
    const reductionRate = forterKPIs.chargebackReduction / 100;
    const futureChargebacks = currentChargebacks * (1 - reductionRate);
    const chargebackSavings = currentChargebacks - futureChargebacks;

    // Apply driver toggles
    const enabledGMVUplift = driverToggles['gmv-uplift'] ? totalGMVUplift : 0;
    const enabledChargebackSavings = driverToggles['chargeback-savings'] ? chargebackSavings : 0;

    const totalValue = enabledGMVUplift + enabledChargebackSavings;
    
    // Calculate profit value with margin toggle
    const avgMargin = (
      (formData.amerGrossMarginPercent || 50) + 
      (formData.emeaGrossMarginPercent || 50) + 
      (formData.apacGrossMarginPercent || 50)
    ) / 3;
    const profitValue = marginEnabled 
      ? (totalValue * (avgMargin / 100)) / 12 
      : totalValue / 12;

    return { 
      totalGMVUplift, 
      chargebackSavings, 
      totalValue, 
      profitValue,
      // For breakdown calculations
      currentAmerCompleted,
      futureAmerCompleted,
      currentEmeaCompleted,
      futureEmeaCompleted,
      currentApacCompleted,
      futureApacCompleted,
      currentChargebacks,
      futureChargebacks
    };
  }, [formData, driverToggles, marginEnabled]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Value Assessment Model</h2>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="inputs">Key Inputs</TabsTrigger>
            <TabsTrigger value="forter">Forter KPI</TabsTrigger>
            <TabsTrigger value="summary">Value Summary</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={formData.customerName || ""}
                  onChange={(e) => updateField("customerName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => updateField("industry", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apparel">Apparel & Fashion</SelectItem>
                    <SelectItem value="electronics">Electronics & Technology</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="books">Books & Media</SelectItem>
                    <SelectItem value="toys">Toys & Games</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="jewelry">Jewelry & Accessories</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="pet">Pet Supplies</SelectItem>
                    <SelectItem value="grocery">Grocery & Gourmet</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="travel">Travel & Hospitality</SelectItem>
                    <SelectItem value="digital">Digital Goods & Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hqLocation">HQ Location</Label>
                <Input
                  id="hqLocation"
                  placeholder="e.g., United States"
                  value={formData.hqLocation || ""}
                  onChange={(e) => updateField("hqLocation", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4 mt-6">
            <ChallengeSelection
              selectedChallenges={selectedChallenges}
              onChallengeChange={handleChallengeChange}
              selectedSolutions={selectedSolutions}
              onSolutionChange={handleSolutionChange}
            />
          </TabsContent>

          {/* Key Inputs Tab */}
          <TabsContent value="inputs" className="space-y-6 mt-6">
            {(!showFraudInputs && !showPaymentsInputs) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please select challenges in the Challenges tab to see relevant data inputs.</p>
              </div>
            )}

            {(showFraudInputs || showPaymentsInputs) && (
              <Tabs defaultValue="amer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="amer">AMER</TabsTrigger>
                  <TabsTrigger value="emea">EMEA</TabsTrigger>
                  <TabsTrigger value="apac">APAC</TabsTrigger>
                </TabsList>

                {/* AMER Inputs */}
                <TabsContent value="amer" className="space-y-4 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amerGMV">Annual GMV Attempts ($)</Label>
                      <Input
                        id="amerGMV"
                        type="text"
                        value={formatNumberWithCommas(formData.amerAnnualGMV)}
                        onChange={(e) => handleNumericChange("amerAnnualGMV", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amerGrossAttempts">Gross Sales Attempts (#)</Label>
                      <Input
                        id="amerGrossAttempts"
                        type="text"
                        value={formatNumberWithCommas(formData.amerGrossAttempts)}
                        onChange={(e) => handleNumericChange("amerGrossAttempts", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amerMargin">Gross Margin (%)</Label>
                      <Input
                        id="amerMargin"
                        type="number"
                        value={formData.amerGrossMarginPercent ?? ""}
                        onChange={(e) => updateField("amerGrossMarginPercent", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {showFraudInputs && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="amerFraudTiming">Fraud Check Timing</Label>
                          <Select
                            value={formData.amerFraudCheckTiming}
                            onValueChange={(value: "pre-auth" | "post-auth") =>
                              updateField("amerFraudCheckTiming", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timing" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre-auth">Pre-Authorization</SelectItem>
                              <SelectItem value="post-auth">Post-Authorization</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.amerFraudCheckTiming === "pre-auth" && (
                          <div className="space-y-2">
                            <Label htmlFor="amerPreAuth">Pre-Auth Fraud Approval Rate (%)</Label>
                            <Input
                              id="amerPreAuth"
                              type="number"
                              value={formData.amerPreAuthApprovalRate ?? ""}
                              onChange={(e) => updateField("amerPreAuthApprovalRate", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}

                        {formData.amerFraudCheckTiming === "post-auth" && (
                          <div className="space-y-2">
                            <Label htmlFor="amerPostAuth">Post-Auth Fraud Approval Rate (%)</Label>
                            <Input
                              id="amerPostAuth"
                              type="number"
                              value={formData.amerPostAuthApprovalRate ?? ""}
                              onChange={(e) => updateField("amerPostAuthApprovalRate", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {showPaymentsInputs && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="amerBankDecline">Issuing Bank Decline Rate (%)</Label>
                          <Input
                            id="amerBankDecline"
                            type="number"
                            value={formData.amerIssuingBankDeclineRate ?? ""}
                            onChange={(e) => updateField("amerIssuingBankDeclineRate", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amer3DSRate">3DS Challenge Rate (%)</Label>
                          <Input
                            id="amer3DSRate"
                            type="number"
                            value={formData.amer3DSChallengeRate ?? ""}
                            onChange={(e) => updateField("amer3DSChallengeRate", parseFloat(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">% of transactions requiring 3DS challenge</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amer3DSAbandonment">3DS Abandonment Rate (%)</Label>
                          <Input
                            id="amer3DSAbandonment"
                            type="number"
                            value={formData.amer3DSAbandonmentRate ?? ""}
                            onChange={(e) => updateField("amer3DSAbandonmentRate", parseFloat(e.target.value) || 0)}
                            step="0.1"
                          />
                          <p className="text-xs text-muted-foreground">% of 3DS challenged transactions that are abandoned</p>
                        </div>
                      </>
                    )}

                    {showFraudInputs && (
                      <div className="space-y-2">
                        <Label htmlFor="amerManualReview">Manual Review Rate (%)</Label>
                        <Input
                          id="amerManualReview"
                          type="number"
                          value={formData.amerManualReviewRate ?? ""}
                          onChange={(e) => updateField("amerManualReviewRate", parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">% of transactions requiring manual review</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* EMEA Inputs */}
                <TabsContent value="emea" className="space-y-4 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emeaGMV">Annual GMV Attempts ($)</Label>
                      <Input
                        id="emeaGMV"
                        type="text"
                        value={formatNumberWithCommas(formData.emeaAnnualGMV)}
                        onChange={(e) => handleNumericChange("emeaAnnualGMV", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emeaGrossAttempts">Gross Sales Attempts (#)</Label>
                      <Input
                        id="emeaGrossAttempts"
                        type="text"
                        value={formatNumberWithCommas(formData.emeaGrossAttempts)}
                        onChange={(e) => handleNumericChange("emeaGrossAttempts", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emeaMargin">Gross Margin (%)</Label>
                      <Input
                        id="emeaMargin"
                        type="number"
                        value={formData.emeaGrossMarginPercent ?? ""}
                        onChange={(e) => updateField("emeaGrossMarginPercent", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {showFraudInputs && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="emeaPreAuth">Pre-Auth Fraud Approval Rate (%)</Label>
                          <Input
                            id="emeaPreAuth"
                            type="number"
                            value={formData.emeaPreAuthApprovalRate ?? ""}
                            onChange={(e) => updateField("emeaPreAuthApprovalRate", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    )}

                    {showPaymentsInputs && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="emeaBankDecline">Issuing Bank Decline Rate (%)</Label>
                          <Input
                            id="emeaBankDecline"
                            type="number"
                            value={formData.emeaIssuingBankDeclineRate ?? ""}
                            onChange={(e) => updateField("emeaIssuingBankDeclineRate", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emea3DSRate">3DS Challenge Rate (%)</Label>
                          <Input
                            id="emea3DSRate"
                            type="number"
                            value={formData.emea3DSChallengeRate ?? ""}
                            onChange={(e) => updateField("emea3DSChallengeRate", parseFloat(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">% of transactions requiring 3DS challenge</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emea3DSAbandonment">3DS Abandonment Rate (%)</Label>
                          <Input
                            id="emea3DSAbandonment"
                            type="number"
                            value={formData.emea3DSAbandonmentRate ?? ""}
                            onChange={(e) => updateField("emea3DSAbandonmentRate", parseFloat(e.target.value) || 0)}
                            step="0.1"
                          />
                          <p className="text-xs text-muted-foreground">% of 3DS challenged transactions that are abandoned</p>
                        </div>
                      </>
                    )}

                    {showFraudInputs && (
                      <div className="space-y-2">
                        <Label htmlFor="emeaManualReview">Manual Review Rate (%)</Label>
                        <Input
                          id="emeaManualReview"
                          type="number"
                          value={formData.emeaManualReviewRate ?? ""}
                          onChange={(e) => updateField("emeaManualReviewRate", parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">% of transactions requiring manual review</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* APAC Inputs */}
                <TabsContent value="apac" className="space-y-4 mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apacGMV">Annual GMV Attempts ($)</Label>
                      <Input
                        id="apacGMV"
                        type="text"
                        value={formatNumberWithCommas(formData.apacAnnualGMV)}
                        onChange={(e) => handleNumericChange("apacAnnualGMV", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apacGrossAttempts">Gross Sales Attempts (#)</Label>
                      <Input
                        id="apacGrossAttempts"
                        type="text"
                        value={formatNumberWithCommas(formData.apacGrossAttempts)}
                        onChange={(e) => handleNumericChange("apacGrossAttempts", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apacMargin">Gross Margin (%)</Label>
                      <Input
                        id="apacMargin"
                        type="number"
                        value={formData.apacGrossMarginPercent ?? ""}
                        onChange={(e) => updateField("apacGrossMarginPercent", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {showFraudInputs && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="apacFraudTiming">Fraud Check Timing</Label>
                          <Select
                            value={formData.apacFraudCheckTiming}
                            onValueChange={(value: "pre-auth" | "post-auth") =>
                              updateField("apacFraudCheckTiming", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timing" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre-auth">Pre-Authorization</SelectItem>
                              <SelectItem value="post-auth">Post-Authorization</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.apacFraudCheckTiming === "pre-auth" && (
                          <div className="space-y-2">
                            <Label htmlFor="apacPreAuth">Pre-Auth Fraud Approval Rate (%)</Label>
                            <Input
                              id="apacPreAuth"
                              type="number"
                              value={formData.apacPreAuthApprovalRate ?? ""}
                              onChange={(e) => updateField("apacPreAuthApprovalRate", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}

                        {formData.apacFraudCheckTiming === "post-auth" && (
                          <div className="space-y-2">
                            <Label htmlFor="apacPostAuth">Post-Auth Fraud Approval Rate (%)</Label>
                            <Input
                              id="apacPostAuth"
                              type="number"
                              value={formData.apacPostAuthApprovalRate ?? ""}
                              onChange={(e) => updateField("apacPostAuthApprovalRate", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {showPaymentsInputs && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="apacBankDecline">Issuing Bank Decline Rate (%)</Label>
                          <Input
                            id="apacBankDecline"
                            type="number"
                            value={formData.apacIssuingBankDeclineRate ?? ""}
                            onChange={(e) => updateField("apacIssuingBankDeclineRate", parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="apac3DSRate">3DS Challenge Rate (%)</Label>
                          <Input
                            id="apac3DSRate"
                            type="number"
                            value={formData.apac3DSChallengeRate ?? ""}
                            onChange={(e) => updateField("apac3DSChallengeRate", parseFloat(e.target.value) || 0)}
                          />
                          <p className="text-xs text-muted-foreground">% of transactions requiring 3DS challenge</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="apac3DSAbandonment">3DS Abandonment Rate (%)</Label>
                          <Input
                            id="apac3DSAbandonment"
                            type="number"
                            value={formData.apac3DSAbandonmentRate ?? ""}
                            onChange={(e) => updateField("apac3DSAbandonmentRate", parseFloat(e.target.value) || 0)}
                            step="0.1"
                          />
                          <p className="text-xs text-muted-foreground">% of 3DS challenged transactions that are abandoned</p>
                        </div>
                      </>
                    )}

                    {showFraudInputs && (
                      <div className="space-y-2">
                        <Label htmlFor="apacManualReview">Manual Review Rate (%)</Label>
                        <Input
                          id="apacManualReview"
                          type="number"
                          value={formData.apacManualReviewRate ?? ""}
                          onChange={(e) => updateField("apacManualReviewRate", parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">% of transactions requiring manual review</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          {/* Forter Performance Assumptions Tab */}
          <TabsContent value="forter" className="space-y-4 mt-6">
            <ForterKPIConfig
              kpis={formData.forterKPIs || defaultForterKPIs}
              onUpdate={(kpis) => updateField("forterKPIs", kpis)}
            />
          </TabsContent>

          {/* Value Summary Tab */}
          <TabsContent value="summary" className="space-y-4 mt-6">
            {metrics.totalValue === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">Please enter data in the Key Inputs tab to see your value assessment.</p>
                <p className="text-sm">As you fill in the inputs, the calculations will update automatically here.</p>
              </div>
            ) : (
              <>
                <ValueSummary
                  businessGrowthDrivers={[
                    { 
                      id: 'gmv-uplift', 
                      label: 'GMV Uplift', 
                      value: metrics.totalGMVUplift,
                      enabled: driverToggles['gmv-uplift']
                    }
                  ]}
                  riskAvoidanceDrivers={[
                    { 
                      id: 'chargeback-savings', 
                      label: 'Chargeback Savings', 
                      value: metrics.chargebackSavings,
                      enabled: driverToggles['chargeback-savings']
                    }
                  ]}
                  totalValue={metrics.totalValue}
                  profitValue={metrics.profitValue}
                  marginEnabled={marginEnabled}
                  onDriverClick={(driverId) => {
                    const forterKPIs = formData.forterKPIs || defaultForterKPIs;
                    const amerRevenue = formData.amerAnnualGMV || 0;
                    const emeaRevenue = formData.emeaAnnualGMV || 0;
                    const apacRevenue = formData.apacAnnualGMV || 0;
                    
                    if (driverId === 'gmv-uplift') {
                      // Calculate AoV: sales attempts ($) / transaction attempts (#)
                      // Default AoV of 105 to derive transaction count
                      const amerTransactionCount = amerRevenue / 105;
                      const avgOrderValue = 105;
                      
                      // Calculate transaction counts for breakdown
                      const currentAmerApprovedCount = amerTransactionCount * (formData.amerFraudCheckTiming === "pre-auth" ? (formData.amerPreAuthApprovalRate || 95) / 100 : 1);
                      const futureAmerApprovedCount = amerTransactionCount * (forterKPIs.fraudApprovalRate / 100);
                      
                      setBreakdownData({
                        title: "GMV Uplift - Fraud Management & Payment Optimization",
                        columns: ["Current", "Impact", "Forter"],
                        calculations: [
                          { label: "1. Pre-Auth Fraud Decisioning", isHeader: true },
                          { label: "Non-EEA eCommerce gross sales attempts (#)", currentValue: amerTransactionCount, impactValue: null, forterValue: amerTransactionCount },
                          { label: "Non-EEA eCommerce gross sales attempts ($)", currentValue: amerRevenue, impactValue: null, forterValue: amerRevenue },
                          { label: "Transaction average order value ($)", currentValue: avgOrderValue, impactValue: null, forterValue: avgOrderValue },
                          { label: "Pre-Auth fraud approval rate (%)", currentValue: formData.amerFraudCheckTiming === "pre-auth" ? (formData.amerPreAuthApprovalRate || 95) : 100, impactValue: `${forterKPIs.fraudApprovalRate - (formData.amerFraudCheckTiming === "pre-auth" ? (formData.amerPreAuthApprovalRate || 95) : 100)}%pp`, forterValue: forterKPIs.fraudApprovalRate },
                          { label: "Pre-Auth fraud approved sales (#)", currentValue: currentAmerApprovedCount, impactValue: futureAmerApprovedCount - currentAmerApprovedCount, forterValue: futureAmerApprovedCount },
                          { label: "Pre-Auth fraud approved sales ($)", currentValue: currentAmerApprovedCount * avgOrderValue, impactValue: (futureAmerApprovedCount - currentAmerApprovedCount) * avgOrderValue, forterValue: futureAmerApprovedCount * avgOrderValue },
                          
                          { label: "2. AMER 3DS Flow", isHeader: true },
                          { label: "Credit card transactions (%)", currentValue: 100, impactValue: null, forterValue: 100 },
                          { label: "Transactions going through 3DS (%)", currentValue: formData.amer3DSChallengeRate || 0, impactValue: `-${formData.amer3DSChallengeRate || 0}%pp`, forterValue: 0 },
                          { label: "Transaction 3DS failure and abandonment rate (%)", currentValue: formData.amer3DSAbandonmentRate || 10, impactValue: null, forterValue: formData.amer3DSAbandonmentRate || 10 },
                          { label: "3DS exempt transactions (%)", currentValue: 100 - (formData.amer3DSChallengeRate || 0), impactValue: `${formData.amer3DSChallengeRate || 0}%pp`, forterValue: 100 },
                          
                          { label: "3. Issuing Bank", isHeader: true },
                          { label: "Declined transactions rate by issuing bank (%)", currentValue: formData.amerIssuingBankDeclineRate || 7, impactValue: `0%pp`, forterValue: formData.amerIssuingBankDeclineRate || 7 },
                          
                          { label: "4. Post-Auth Fraud Decisioning", isHeader: true },
                          { label: "Post-Auth fraud approval rate (%)", currentValue: formData.amerFraudCheckTiming === "post-auth" ? (formData.amerPostAuthApprovalRate || 98.5) : 100, impactValue: `${100 - (formData.amerFraudCheckTiming === "post-auth" ? (formData.amerPostAuthApprovalRate || 98.5) : 100)}%pp`, forterValue: 100 },
                          { label: "Post-Auth fraud approved sales ($)", currentValue: metrics.currentAmerCompleted, impactValue: metrics.futureAmerCompleted - metrics.currentAmerCompleted, forterValue: metrics.futureAmerCompleted },
                          
                          { label: "Total Sales Completion", isHeader: true },
                          { label: "Total non-EEA sales completion ($)", currentValue: metrics.currentAmerCompleted, impactValue: metrics.futureAmerCompleted - metrics.currentAmerCompleted, forterValue: metrics.futureAmerCompleted, isResult: true },
                          { label: "Completion rate (%)", currentValue: (metrics.currentAmerCompleted / amerRevenue) * 100, impactValue: `${((metrics.futureAmerCompleted - metrics.currentAmerCompleted) / amerRevenue * 100).toFixed(2)}%pp`, forterValue: (metrics.futureAmerCompleted / amerRevenue) * 100 },
                        ]
                      });
                      setBreakdownOpen(true);
                    } else if (driverId === 'chargeback-savings') {
                      const currentTotalRevenue = metrics.currentAmerCompleted + metrics.currentEmeaCompleted + metrics.currentApacCompleted;
                      const futureTotalRevenue = metrics.futureAmerCompleted + metrics.futureEmeaCompleted + metrics.futureApacCompleted;
                      const currentFraudCBRate = (formData.fraudCBRate || 0.8) / 100;
                      const futureFraudCBRate = currentFraudCBRate * (1 - forterKPIs.chargebackReduction / 100);
                      const avgOrderValue = formData.fraudCBAOV || 158;
                      
                      const currentGrossFraudCB = currentTotalRevenue * currentFraudCBRate;
                      const futureGrossFraudCB = futureTotalRevenue * futureFraudCBRate;
                      const currentGrossFraudCBCount = currentGrossFraudCB / avgOrderValue;
                      const futureGrossFraudCBCount = futureGrossFraudCB / avgOrderValue;
                      
                      const fraudDisputeRate = 0.95;
                      const fraudWinRate = 0.25;
                      
                      const currentDisputed = 0;
                      const futureDisputed = futureGrossFraudCBCount * fraudDisputeRate;
                      const futureWon = futureDisputed * fraudWinRate;
                      
                      const currentNetCB = currentGrossFraudCB;
                      const futureNetCB = futureGrossFraudCB - (futureWon * avgOrderValue);
                      
                      setBreakdownData({
                        title: "Reduce fraud chargebacks",
                        columns: ["Current", "Impact", "Forter"],
                        calculations: [
                          { label: "Completed value of transactions ($)", currentValue: currentTotalRevenue, impactValue: null, forterValue: futureTotalRevenue },
                          { label: "Gross fraud chargeback rate on value amount (%)", currentValue: currentFraudCBRate * 100, impactValue: `-${forterKPIs.chargebackReduction}%`, forterValue: futureFraudCBRate * 100 },
                          { label: "Average order value of fraud chargebacks ($)", currentValue: avgOrderValue, impactValue: null, forterValue: avgOrderValue },
                          { label: "Gross fraud chargebacks ($)", currentValue: currentGrossFraudCB, impactValue: futureGrossFraudCB - currentGrossFraudCB, forterValue: futureGrossFraudCB },
                          { label: "Gross fraud chargebacks (#)", currentValue: currentGrossFraudCBCount, impactValue: futureGrossFraudCBCount - currentGrossFraudCBCount, forterValue: futureGrossFraudCBCount },
                          { label: "Fraud chargeback disputed (%)", currentValue: 0, impactValue: "0%", forterValue: 95 },
                          { label: "Fraud chargebacks disputed (#)", currentValue: currentDisputed, impactValue: futureDisputed, forterValue: futureDisputed },
                          { label: "Fraud chargebacks disputed ($)", currentValue: 0, impactValue: futureDisputed * avgOrderValue, forterValue: futureDisputed * avgOrderValue },
                          { label: "Fraud chargeback win rate (%)", currentValue: 0, impactValue: "0%", forterValue: 25 },
                          { label: "Fraud chargebacks won (#)", currentValue: 0, impactValue: futureWon, forterValue: futureWon },
                          { label: "Fraud chargebacks won ($)", currentValue: 0, impactValue: futureWon * avgOrderValue, forterValue: futureWon * avgOrderValue },
                          { label: "Net fraud chargebacks (#)", currentValue: currentGrossFraudCBCount, impactValue: futureGrossFraudCBCount - futureWon - currentGrossFraudCBCount, forterValue: futureGrossFraudCBCount - futureWon, isResult: true },
                          { label: "Net fraud chargebacks ($)", currentValue: currentNetCB, impactValue: currentNetCB - futureNetCB, forterValue: futureNetCB, isResult: true },
                          { label: "Overall fraud chargeback recovery rate (%)", currentValue: 0, impactValue: "24%", forterValue: 24 },
                        ]
                      });
                      setBreakdownOpen(true);
                    }
                  }}
                  onDriverToggle={handleDriverToggle}
                  onMarginToggle={handleMarginToggle}
                />
                
                <CalculationBreakdown
                  open={breakdownOpen}
                  onOpenChange={setBreakdownOpen}
                  title={breakdownData.title}
                  columns={breakdownData.columns}
                  calculations={breakdownData.calculations}
                />
                
                <div className="flex justify-center gap-4 mt-6">
                  <Button onClick={handleSubmit} size="lg">
                    View Full Results Dashboard
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
