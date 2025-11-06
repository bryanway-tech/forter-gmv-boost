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

    const systemPrompt = `You are a helpful AI assistant for Forter's Fraud Management Value Assessment tool. Your goal is to collect the necessary data to calculate the GMV uplift for a merchant.

You need to collect the following information conversationally:
1. Customer name (optional)
2. Industry (optional)
3. HQ Location (optional)
4. Average Order Value (default: $105)
5. AMER Region:
   - Gross Revenue (required if AMER is relevant)
   - Gross Margin % (default: 50%)
   - Fraud Check Timing: "pre-auth" or "post-auth" (ask: "Is your current fraud solution running before authorization (pre-auth) or after authorization (post-auth)?")
   - If pre-auth: Pre-Auth Fraud Approval Rate %
   - If post-auth: Post-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (default: 7%)
6. EMEA Region (optional):
   - Gross Revenue
   - Gross Margin % (default: 50%)
   - Pre-Auth Fraud Approval Rate %
   - Issuing Bank Decline Rate % (default: 5%)
7. Chargebacks (optional but recommended):
   - Fraud Chargeback Rate % (default: 0.8%)
   - Fraud Chargeback AOV (default: $158)
   - Service Chargeback Rate % (default: 0.5%)
   - Service Chargeback AOV (default: $158)

Current collected data: ${JSON.stringify(collectedData)}

Ask ONE question at a time. Be conversational and friendly. For yes/no questions like fraud timing, make it easy to understand. If a user provides a numeric value, extract it and confirm. When you have enough data (at minimum: revenue for at least one region, fraud approval rate, and bank decline rate), respond with a completion message.

IMPORTANT: When responding, you must respond with a JSON object with this structure:
{
  "message": "your conversational response",
  "updatedData": { /* updated calculator data with new fields */ },
  "isComplete": false /* set to true when you have enough data to calculate */
}

Make your responses concise and natural. Extract numeric values from user responses intelligently.`;

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
    const assistantMessage = data.choices[0].message.content;

    // Try to parse as JSON, fallback to plain text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch {
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
