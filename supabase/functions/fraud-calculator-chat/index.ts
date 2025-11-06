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
   - Gross Revenue in USD (required)
   - Gross Margin % (if not provided, use 50% default)
   - Fraud Check Timing: Ask "Is your fraud solution pre-authorization or post-authorization?" Accept: "pre-auth", "post-auth", "before", "after", etc.
   - If pre-auth: Pre-Auth Fraud Approval Rate % (what % of transactions does your fraud system approve?)
   - If post-auth: Post-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (what % of transactions are declined by the bank?) - default 7% if not provided

2. EMEA Region (Optional, ask if they have EMEA revenue):
   - Gross Revenue in USD
   - Gross Margin % (default 50%)
   - Pre-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (default 5%)

3. Chargebacks (Optional but important):
   - Fraud Chargeback Rate % (default 0.8%)

Current collected data: ${JSON.stringify(collectedData)}

IMPORTANT RULES:
- Ask ONE question at a time
- Be conversational but direct - focus on fraud metrics only
- Skip asking about customer name, industry, account reps, etc.
- Intelligently extract numbers from responses (e.g., "75 million" → 75000000, "95%" → 95)
- When user gives revenue, always confirm and move to next question
- Once you have AMER revenue, fraud timing, fraud approval rate, and bank decline rate, you can complete
- You MUST respond with valid JSON in this exact structure:

{
  "message": "your conversational response here",
  "updatedData": { "amerGrossRevenue": 75000000, "amerFraudCheckTiming": "pre-auth" },
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
