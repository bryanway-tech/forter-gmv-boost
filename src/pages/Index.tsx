import { useState } from "react";
import forterLogo from "@/assets/forter-logo.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ManualInputForm } from "@/components/calculator/ManualInputForm";
import { ChatbotInterface } from "@/components/calculator/ChatbotInterface";
import { ResultsDashboard } from "@/components/calculator/ResultsDashboard";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { ForterKPIs, defaultForterKPIs } from "@/components/calculator/ForterKPIConfig";

export type CalculatorData = {
  // Customer Information
  customerName?: string;
  industry?: string;
  hqLocation?: string;
  
  // Fraud Management - Challenges & Solutions
  fraudManagementEnabled?: boolean;
  fraudManagementChallenges?: string[];
  fraudManagementSolution?: "standalone" | "combined";
  
  // AMER Regional Data
  amerAnnualGMV?: number;
  amerGrossAttempts?: number; // Number of transaction attempts
  amerGrossMarginPercent?: number;
  amerPreAuthApprovalRate?: number;
  amerPostAuthApprovalRate?: number;
  amerIssuingBankDeclineRate?: number;
  amerFraudCheckTiming?: "pre-auth" | "post-auth";
  amerCreditCardPct?: number; // % of transactions that are credit card
  amer3DSChallengeRate?: number;
  amer3DSAbandonmentRate?: number;
  amerManualReviewRate?: number;
  
  // EMEA Regional Data
  emeaAnnualGMV?: number;
  emeaGrossAttempts?: number; // Number of transaction attempts
  emeaGrossMarginPercent?: number;
  emeaPreAuthApprovalRate?: number;
  emeaPostAuthApprovalRate?: number;
  emeaIssuingBankDeclineRate?: number;
  emeaFraudCheckTiming?: "pre-auth" | "post-auth";
  emeaCreditCardPct?: number; // % of transactions that are credit card
  emea3DSChallengeRate?: number;
  emea3DSAbandonmentRate?: number;
  emeaManualReviewRate?: number;
  
  // APAC Regional Data
  apacAnnualGMV?: number;
  apacGrossAttempts?: number; // Number of transaction attempts
  apacGrossMarginPercent?: number;
  apacPreAuthApprovalRate?: number;
  apacPostAuthApprovalRate?: number;
  apacIssuingBankDeclineRate?: number;
  apacFraudCheckTiming?: "pre-auth" | "post-auth";
  apacCreditCardPct?: number; // % of transactions that are credit card
  apac3DSChallengeRate?: number;
  apac3DSAbandonmentRate?: number;
  apacManualReviewRate?: number;
  
  // Chargebacks - Challenges & Solutions
  chargebacksEnabled?: boolean;
  chargebackChallenges?: string[];
  chargebackSolution?: "standalone" | "combined";
  
  // Fraud Chargebacks
  fraudCBRate?: number;
  fraudCBAOV?: number;
  fraudCBProcessors?: string[];
  fraudCBProcessorOther?: string;
  
  // Service Chargebacks
  serviceCBRate?: number;
  serviceCBAOV?: number;
  serviceCBProcessors?: string[];
  serviceCBProcessorOther?: string;
  
  // Forter KPIs
  forterKPIs?: ForterKPIs;
};

const Index = () => {
  const [mode, setMode] = useState<"select" | "manual" | "chatbot">("select");
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    forterKPIs: defaultForterKPIs,
  });
  const [customerLogoUrl, setCustomerLogoUrl] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomerLogoUrl(e.target?.result as string);
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDataChange = (data: CalculatorData) => {
    setCalculatorData(data);
  };

  const handleDataComplete = (data: CalculatorData) => {
    setCalculatorData(data);
    setShowResults(true);
  };

  const handleEditManual = () => {
    setMode("manual");
    setShowResults(false);
  };

  const handleEditChatbot = () => {
    setMode("chatbot");
    setShowResults(false);
  };

  const handleStartOver = () => {
    setMode("select");
    setCalculatorData({ forterKPIs: defaultForterKPIs });
    setShowResults(false);
    setCustomerLogoUrl("");
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-8">
          {/* Logos */}
          <div className="flex items-center justify-between gap-8 mb-12">
            <img src={forterLogo} alt="Forter" className="h-12 object-contain" />
            {customerLogoUrl && (
              <img src={customerLogoUrl} alt="Customer" className="h-12 object-contain" />
            )}
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Forter Value Assessment
            </h1>
            <p className="text-xl text-muted-foreground">
              Calculate your potential GMV uplift with Forter's fraud management solution
            </p>
          </div>

          {/* Logo Upload */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Customer Logo</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your customer's logo for a personalized analysis
                </p>
              </div>
              <Button variant="outline" className="relative">
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </Card>

          {/* Mode Selection */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="p-8 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
              onClick={() => setMode("manual")}
            >
              <h2 className="text-2xl font-bold mb-3">Value Model</h2>
              <p className="text-muted-foreground mb-4">
                Enter metrics directly through a structured form
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Quick data entry</li>
                <li>• Full visibility of all fields</li>
                <li>• Direct control over inputs</li>
              </ul>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
              onClick={() => setMode("chatbot")}
            >
              <h2 className="text-2xl font-bold mb-3">AI-Guided Input</h2>
              <p className="text-muted-foreground mb-4">
                Let our AI assistant guide you through the process
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Conversational experience</li>
                <li>• Contextual questions</li>
                <li>• Smart recommendations</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <ResultsDashboard
        data={calculatorData}
        customerLogoUrl={customerLogoUrl}
        onEditManual={handleEditManual}
        onEditChatbot={handleEditChatbot}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <img src={forterLogo} alt="Forter" className="h-10 object-contain" />
            {customerLogoUrl && (
              <img src={customerLogoUrl} alt="Customer" className="h-10 object-contain" />
            )}
          </div>
          <Button variant="outline" onClick={() => setMode(mode === "manual" ? "chatbot" : "manual")}>
            Switch to {mode === "manual" ? "AI-Guided" : "Value Model"}
          </Button>
        </div>

        {/* Content */}
        {mode === "manual" ? (
          <ManualInputForm onComplete={handleDataComplete} onChange={handleDataChange} initialData={calculatorData} />
        ) : (
          <ChatbotInterface onComplete={handleDataComplete} onChange={handleDataChange} initialData={calculatorData} />
        )}
      </div>
    </div>
  );
};

export default Index;
