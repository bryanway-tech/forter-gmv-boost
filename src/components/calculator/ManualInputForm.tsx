import { useState } from "react";
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
  };

  const handleSolutionChange = (solutionId: string, checked: boolean) => {
    setSelectedSolutions(prev => ({ ...prev, [solutionId]: checked }));
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Value Assessment Model</h2>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="inputs">Key Inputs</TabsTrigger>
            <TabsTrigger value="forter">Benefit Scope</TabsTrigger>
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
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Complete the Key Inputs and Benefit Scope tabs, then calculate your value assessment.</p>
              <Button onClick={handleSubmit} size="lg">
                Calculate Value Assessment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
