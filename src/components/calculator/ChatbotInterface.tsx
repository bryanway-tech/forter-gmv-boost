import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalculatorData } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotInterfaceProps {
  onComplete: (data: CalculatorData) => void;
}

export const ChatbotInterface = ({ onComplete }: ChatbotInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'll help you assess the potential value of Forter's fraud management solution. Let's start with some basic information. What is the customer's name?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<CalculatorData>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("fraud-calculator-chat", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          collectedData,
        },
      });

      if (error) throw error;

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);

      if (data.updatedData) {
        setCollectedData(data.updatedData);
      }

      if (data.isComplete) {
        setTimeout(() => {
          onComplete(data.updatedData);
          toast.success("Assessment complete!");
        }, 1000);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Could you please try again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-6 h-[calc(100vh-200px)] flex flex-col">
      <h2 className="text-2xl font-bold mb-4">AI-Guided Assessment</h2>

      <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
