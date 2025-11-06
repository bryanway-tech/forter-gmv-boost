import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorData } from "@/pages/Index";
import { ForterKPIConfig, defaultForterKPIs } from "@/components/calculator/ForterKPIConfig";
import { toast } from "sonner";

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

  const updateField = (field: keyof CalculatorData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate Average Order Value from revenue and transactions
  const calculateAOV = (revenue?: number, transactions?: number) => {
    if (revenue && transactions && transactions > 0) {
      return revenue / transactions;
    }
    return 0;
  };

  const amerTransactions = formData.amerAnnualGMV && formData.amerAnnualGMV > 0
    ? Math.round(formData.amerAnnualGMV / 105) // Default AOV assumption
    : 0;

  const emeaTransactions = formData.emeaAnnualGMV && formData.emeaAnnualGMV > 0
    ? Math.round(formData.emeaAnnualGMV / 105)
    : 0;

  const apacTransactions = formData.apacAnnualGMV && formData.apacAnnualGMV > 0
    ? Math.round(formData.apacAnnualGMV / 105)
    : 0;

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.amerAnnualGMV && !formData.emeaAnnualGMV && !formData.apacAnnualGMV) {
      toast.error("Please enter GMV for at least one region");
      return;
    }

    onComplete(formData);
    toast.success("Calculating your uplift...");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Fraud Management Assessment</h2>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="customer">Customer Info</TabsTrigger>
            <TabsTrigger value="amer">AMER</TabsTrigger>
            <TabsTrigger value="emea">EMEA</TabsTrigger>
            <TabsTrigger value="apac">APAC</TabsTrigger>
            <TabsTrigger value="chargebacks">Chargebacks</TabsTrigger>
          </TabsList>

          {/* Customer Information */}
          <TabsContent value="customer" className="space-y-4 mt-6">
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

            {/* Display calculated transactions */}
            {(formData.amerAnnualGMV || formData.emeaAnnualGMV || formData.apacAnnualGMV) && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Calculated Transactions</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {formData.amerAnnualGMV && (
                    <div>
                      <span className="text-muted-foreground">AMER: </span>
                      <span className="font-bold">{amerTransactions.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.emeaAnnualGMV && (
                    <div>
                      <span className="text-muted-foreground">EMEA: </span>
                      <span className="font-bold">{emeaTransactions.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.apacAnnualGMV && (
                    <div>
                      <span className="text-muted-foreground">APAC: </span>
                      <span className="font-bold">{apacTransactions.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* AMER Metrics */}
          <TabsContent value="amer" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amerGMV">Annual GMV Attempts ($)</Label>
                <Input
                  id="amerGMV"
                  type="number"
                  value={formData.amerAnnualGMV ?? ""}
                  onChange={(e) => updateField("amerAnnualGMV", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amerGrossAttempts">Gross Sales Attempts (#)</Label>
                <Input
                  id="amerGrossAttempts"
                  type="number"
                  value={formData.amerGrossAttempts ?? ""}
                  onChange={(e) => updateField("amerGrossAttempts", parseFloat(e.target.value) || 0)}
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
            </div>
          </TabsContent>

          {/* EMEA Metrics */}
          <TabsContent value="emea" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emeaGMV">Annual GMV Attempts ($)</Label>
                <Input
                  id="emeaGMV"
                  type="number"
                  value={formData.emeaAnnualGMV ?? ""}
                  onChange={(e) => updateField("emeaAnnualGMV", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emeaGrossAttempts">Gross Sales Attempts (#)</Label>
                <Input
                  id="emeaGrossAttempts"
                  type="number"
                  value={formData.emeaGrossAttempts ?? ""}
                  onChange={(e) => updateField("emeaGrossAttempts", parseFloat(e.target.value) || 0)}
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

              <div className="space-y-2">
                <Label htmlFor="emeaPreAuth">Pre-Auth Fraud Approval Rate (%)</Label>
                <Input
                  id="emeaPreAuth"
                  type="number"
                  value={formData.emeaPreAuthApprovalRate ?? ""}
                  onChange={(e) => updateField("emeaPreAuthApprovalRate", parseFloat(e.target.value) || 0)}
                />
              </div>

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
            </div>
          </TabsContent>

          {/* APAC Metrics */}
          <TabsContent value="apac" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apacGMV">Annual GMV Attempts ($)</Label>
                <Input
                  id="apacGMV"
                  type="number"
                  value={formData.apacAnnualGMV ?? ""}
                  onChange={(e) => updateField("apacAnnualGMV", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apacGrossAttempts">Gross Sales Attempts (#)</Label>
                <Input
                  id="apacGrossAttempts"
                  type="number"
                  value={formData.apacGrossAttempts ?? ""}
                  onChange={(e) => updateField("apacGrossAttempts", parseFloat(e.target.value) || 0)}
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
            </div>
          </TabsContent>

          {/* Chargebacks */}
          <TabsContent value="chargebacks" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fraudCBRate">Fraud Chargeback Rate (%)</Label>
                <Input
                  id="fraudCBRate"
                  type="number"
                  step="0.01"
                  value={formData.fraudCBRate ?? ""}
                  onChange={(e) => updateField("fraudCBRate", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fraudCBAOV">Fraud Chargeback AOV ($)</Label>
                <Input
                  id="fraudCBAOV"
                  type="number"
                  value={formData.fraudCBAOV ?? ""}
                  onChange={(e) => updateField("fraudCBAOV", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCBRate">Service Chargeback Rate (%)</Label>
                <Input
                  id="serviceCBRate"
                  type="number"
                  step="0.01"
                  value={formData.serviceCBRate ?? ""}
                  onChange={(e) => updateField("serviceCBRate", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCBAOV">Service Chargeback AOV ($)</Label>
                <Input
                  id="serviceCBAOV"
                  type="number"
                  value={formData.serviceCBAOV ?? ""}
                  onChange={(e) => updateField("serviceCBAOV", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Forter KPI Configuration */}
      <ForterKPIConfig
        kpis={formData.forterKPIs || defaultForterKPIs}
        onUpdate={(kpis) => updateField("forterKPIs", kpis)}
      />

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg">
          Calculate Uplift
        </Button>
      </div>
    </div>
  );
};
