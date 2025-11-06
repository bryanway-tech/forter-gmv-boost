import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorData } from "@/pages/Index";
import { toast } from "sonner";

interface ManualInputFormProps {
  onComplete: (data: CalculatorData) => void;
}

export const ManualInputForm = ({ onComplete }: ManualInputFormProps) => {
  const [formData, setFormData] = useState<CalculatorData>({
    averageOrderValue: 105,
    amerGrossMargin: 50,
    emeaGrossMargin: 50,
    fraudChargebackAOV: 158,
    serviceChargebackAOV: 158,
  });

  const updateField = (field: keyof CalculatorData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.amerGrossRevenue && !formData.emeaGrossRevenue) {
      toast.error("Please enter revenue for at least one region");
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customer">Customer Info</TabsTrigger>
            <TabsTrigger value="amer">AMER Metrics</TabsTrigger>
            <TabsTrigger value="emea">EMEA Metrics</TabsTrigger>
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
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="averageOrderValue">Average Order Value ($)</Label>
                <Input
                  id="averageOrderValue"
                  type="number"
                  placeholder="105"
                  value={formData.averageOrderValue || ""}
                  onChange={(e) => updateField("averageOrderValue", parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          {/* AMER Metrics */}
          <TabsContent value="amer" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amerRevenue">Gross Revenue ($)</Label>
                <Input
                  id="amerRevenue"
                  type="number"
                  placeholder="75000000"
                  value={formData.amerGrossRevenue || ""}
                  onChange={(e) => updateField("amerGrossRevenue", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amerMargin">Gross Margin (%)</Label>
                <Input
                  id="amerMargin"
                  type="number"
                  placeholder="50"
                  value={formData.amerGrossMargin || ""}
                  onChange={(e) => updateField("amerGrossMargin", parseFloat(e.target.value))}
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
                    placeholder="95"
                    value={formData.amerPreAuthApprovalRate || ""}
                    onChange={(e) => updateField("amerPreAuthApprovalRate", parseFloat(e.target.value))}
                  />
                </div>
              )}

              {formData.amerFraudCheckTiming === "post-auth" && (
                <div className="space-y-2">
                  <Label htmlFor="amerPostAuth">Post-Auth Fraud Approval Rate (%)</Label>
                  <Input
                    id="amerPostAuth"
                    type="number"
                    placeholder="98.5"
                    value={formData.amerPostAuthApprovalRate || ""}
                    onChange={(e) => updateField("amerPostAuthApprovalRate", parseFloat(e.target.value))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amerBankDecline">Issuing Bank Decline Rate (%)</Label>
                <Input
                  id="amerBankDecline"
                  type="number"
                  placeholder="7"
                  value={formData.amerIssuingBankDeclineRate || ""}
                  onChange={(e) => updateField("amerIssuingBankDeclineRate", parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          {/* EMEA Metrics */}
          <TabsContent value="emea" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emeaRevenue">Gross Revenue ($)</Label>
                <Input
                  id="emeaRevenue"
                  type="number"
                  placeholder="75000000"
                  value={formData.emeaGrossRevenue || ""}
                  onChange={(e) => updateField("emeaGrossRevenue", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emeaMargin">Gross Margin (%)</Label>
                <Input
                  id="emeaMargin"
                  type="number"
                  placeholder="50"
                  value={formData.emeaGrossMargin || ""}
                  onChange={(e) => updateField("emeaGrossMargin", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emeaPreAuth">Pre-Auth Fraud Approval Rate (%)</Label>
                <Input
                  id="emeaPreAuth"
                  type="number"
                  placeholder="95"
                  value={formData.emeaPreAuthApprovalRate || ""}
                  onChange={(e) => updateField("emeaPreAuthApprovalRate", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emeaBankDecline">Issuing Bank Decline Rate (%)</Label>
                <Input
                  id="emeaBankDecline"
                  type="number"
                  placeholder="5"
                  value={formData.emeaIssuingBankDeclineRate || ""}
                  onChange={(e) => updateField("emeaIssuingBankDeclineRate", parseFloat(e.target.value))}
                />
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
                  placeholder="0.8"
                  step="0.01"
                  value={formData.fraudChargebackRate || ""}
                  onChange={(e) => updateField("fraudChargebackRate", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fraudCBAOV">Fraud Chargeback AOV ($)</Label>
                <Input
                  id="fraudCBAOV"
                  type="number"
                  placeholder="158"
                  value={formData.fraudChargebackAOV || ""}
                  onChange={(e) => updateField("fraudChargebackAOV", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCBRate">Service Chargeback Rate (%)</Label>
                <Input
                  id="serviceCBRate"
                  type="number"
                  placeholder="0.5"
                  step="0.01"
                  value={formData.serviceChargebackRate || ""}
                  onChange={(e) => updateField("serviceChargebackRate", parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCBAOV">Service Chargeback AOV ($)</Label>
                <Input
                  id="serviceCBAOV"
                  type="number"
                  placeholder="158"
                  value={formData.serviceChargebackAOV || ""}
                  onChange={(e) => updateField("serviceChargebackAOV", parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit} size="lg">
            Calculate Uplift
          </Button>
        </div>
      </Card>
    </div>
  );
};
