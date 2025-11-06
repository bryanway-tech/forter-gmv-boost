import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, collectedData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful AI assistant for Forter's Fraud Management Value Assessment tool. Your goal is to collect ONLY the essential fraud management data to calculate GMV uplift.

FOCUS ONLY ON THESE METRICS (skip customer details like name, industry, reps):

1. AMER Region (Start here):
   - Annual GMV Attempts in USD (required) - total value of all transaction attempts
   - Gross Sales Attempts (#) - number of transaction attempts
   - Gross Margin % (if not provided, use 50% default)
   - Fraud Check Timing: Ask "Is your fraud solution pre-authorization or post-authorization?" Accept: "pre-auth", "post-auth", "before", "after", etc.
   - If pre-auth: Pre-Auth Fraud Approval Rate %
   - If post-auth: Post-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (default 7%)
   - 3DS Challenge Rate %
   - 3DS Abandonment Rate %
   - Manual Review Rate %

2. EMEA Region (Optional, ask if they have EMEA GMV):
   - Annual GMV Attempts in USD
   - Gross Sales Attempts (#)
   - Gross Margin % (default 50%)
   - Fraud Check Timing: pre-auth or post-auth
   - If pre-auth: Pre-Auth Fraud Approval Rate %
   - If post-auth: Post-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (default 5%)
   - 3DS Challenge Rate %
   - 3DS Abandonment Rate %
   - Manual Review Rate %

3. APAC Region (Optional, ask if they have APAC GMV):
   - Annual GMV Attempts in USD
   - Gross Sales Attempts (#)
   - Gross Margin % (default 50%)
   - Fraud Check Timing (pre-auth or post-auth)
   - If pre-auth: Pre-Auth Fraud Approval Rate %
   - If post-auth: Post-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (default 7%)
   - 3DS Challenge Rate %
   - 3DS Abandonment Rate %
   - Manual Review Rate %

4. Chargebacks (Optional but important):
   - Fraud Chargeback Rate % (default 0.8%)
   - Fraud Chargeback AOV in USD (default $158)
   - Service Chargeback Rate %
   - Service Chargeback AOV in USD (default $158)

FORTER PERFORMANCE METRICS (ask AFTER collecting current state data):
After collecting at least one region's current state data (GMV, fraud timing, approval rates, bank decline, 3DS metrics, manual review), ask: "Would you like to customize Forter's expected performance metrics, or use the defaults? You can edit them via this chat or enter them manually later."

If they say yes to customizing via chat, ask ONE BY ONE for each metric:
1. First ask: "For Fraud Approval Rate improvement, would you like to enter a percentage improvement or an absolute number?"
   - If percentage: "What percentage improvement do you expect?"
   - If absolute: "What absolute Fraud Approval Rate do you expect with Forter?"
   - Store as: forterKPIs.fraudApproval = value, forterKPIs.fraudApprovalUsePercentage = true/false

2. Then ask: "For Bank Approval Rate improvement, would you like to enter a percentage improvement or an absolute number?"
   - If percentage: "What percentage improvement do you expect?"
   - If absolute: "What absolute Bank Approval Rate do you expect with Forter?"
   - Store as: forterKPIs.bankApproval = value, forterKPIs.bankApprovalUsePercentage = true/false

3. Then ask: "For 3DS Challenge Rate reduction, would you like to enter a percentage reduction or an absolute number?"
   - If percentage: "What percentage reduction do you expect?"
   - If absolute: "What absolute 3DS Challenge Rate do you expect with Forter?"
   - Store as: forterKPIs.threeDSChallenge = value, forterKPIs.threeDSChallengeUsePercentage = true/false

4. Then ask: "For 3DS Abandonment Rate improvement, would you like to enter a percentage improvement or an absolute number?"
   - If percentage: "What percentage improvement do you expect?"
   - If absolute: "What absolute 3DS Abandonment Rate do you expect with Forter?"
   - Store as: forterKPIs.threeDSAbandonment = value, forterKPIs.threeDSAbandonmentUsePercentage = true/false

5. Then ask: "For Manual Review Rate reduction, would you like to enter a percentage reduction or an absolute number?"
   - If percentage: "What percentage reduction do you expect?"
   - If absolute: "What absolute Manual Review Rate do you expect with Forter?"
   - Store as: forterKPIs.manualReview = value, forterKPIs.manualReviewUsePercentage = true/false

6. Finally ask: "For Fraud Chargeback Rate improvement, would you like to enter a percentage improvement or an absolute number?"
   - If percentage: "What percentage improvement do you expect?"
   - If absolute: "What absolute Fraud Chargeback Rate do you expect with Forter?"
   - Store as: forterKPIs.fraudChargeback = value, forterKPIs.fraudChargebackUsePercentage = true/false

If they say no or want to edit manually, mark isComplete: true and move forward.

IMPORTANT RULES:
- Never ask for "revenue". Always use "Annual GMV Attempts (USD)".
- Ask ONE question at a time, collect ALL fields systematically
- ALWAYS ask about 3DS Challenge Rate, 3DS Abandonment Rate, and Manual Review Rate for each region
- After collecting current state (GMV, fraud timing, approval rates, bank decline, 3DS metrics, manual review), ask about Forter performance customization
- Intelligently extract numbers (e.g., "75 million" → 75000000, "95%" → 95)
- Mark isComplete: true ONLY after user confirms they're done with ALL data (current state + optional Forter metrics)
- You MUST respond with valid JSON in this exact structure:

{
  "message": "your conversational response here",
  "updatedData": { "amerAnnualGMV": 75000000, "amerGrossAttempts": 500000, "amerFraudCheckTiming": "pre-auth", "amer3DSChallengeRate": 10, "amer3DSAbandonmentRate": 5, "amerManualReviewRate": 3 },
  "isComplete": false
}

Do NOT include markdown code blocks or extra text - only pure JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;

    // Remove markdown code blocks if present
    assistantMessage = assistantMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse as JSON, fallback to plain text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch (parseError) {
      console.error("Failed to parse AI response:", assistantMessage);
      parsedResponse = {
        message: assistantMessage,
        updatedData: collectedData,
        isComplete: false,
      };
    }

    // Enforce terminology consistency in assistant message
    if (parsedResponse && typeof parsedResponse.message === "string") {
      parsedResponse.message = parsedResponse.message
        .replace(/\bannual\s+gross\s+revenue\b/gi, "annual GMV attempts")
        .replace(/\bgross\s+revenue\b/gi, "Annual GMV Attempts")
        .replace(/\brevenue\b/gi, "GMV");
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        message: "I'm sorry, I encountered an error. Could you please try again?",
        updatedData: {},
        isComplete: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
