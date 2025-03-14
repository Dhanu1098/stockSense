
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, Loader2, Lightbulb, ArrowRightLeft, BarChart2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  query: z.string().min(5, { message: "Query must be at least 5 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface GeminiResponse {
  text: string;
}

const AiAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      // Format the prompt to focus on stock market analysis
      const enhancedPrompt = `Stock market analysis: ${values.query}. Provide detailed insights, potential risks, opportunities, and your recommendation.`;
      
      // Call Google Gemini API
      const apiResponse = await callGeminiApi(enhancedPrompt);
      setResponse(apiResponse.text);
      setIsLoading(false);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast.error("Failed to get AI analysis. Please try again.");
      setIsLoading(false);
    }
  };

  const callGeminiApi = async (prompt: string): Promise<GeminiResponse> => {
    try {
      const apiKey = "AIzaSyA6yvH9lgQV2kSjM76PpJ_An8u4x7HIwZ4";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the response
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      return { text: responseText };
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      throw error;
    }
  };

  const predefinedQueries = [
    "What are the key factors affecting tech stocks right now?",
    "Analyze the current market sentiment for healthcare stocks",
    "What is the outlook for renewable energy stocks in the next quarter?",
    "Analyze the impact of recent interest rate changes on banking stocks",
    "What are the best dividend stocks to consider in this market?"
  ];

  return (
    <div className="container-padding py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Market Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Ask our AI assistant for personalized stock market insights and analysis
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="glass border rounded-xl p-6 shadow-sm h-full">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Sample Questions
            </h3>
            
            <div className="flex flex-col gap-2">
              {predefinedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-3 text-left"
                  onClick={() => form.setValue("query", query)}
                >
                  {query}
                </Button>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                What You Can Ask
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Stock performance analysis</li>
                <li>• Market trend predictions</li>
                <li>• Sector-specific insights</li>
                <li>• Portfolio optimization</li>
                <li>• Risk assessments</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="glass border rounded-xl p-6 shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Your Question
                        <ArrowRightLeft className="inline-block ml-2 h-4 w-4" />
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="E.g., What is the outlook for tech stocks in the current market?" 
                          className="h-24 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get AI Analysis
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            {response && (
              <div className="mt-6 bg-secondary/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Analysis Result:</h3>
                <div className="whitespace-pre-line text-sm">
                  {response}
                </div>
              </div>
            )}
            
            {!response && !isLoading && (
              <div className="mt-6 text-center text-muted-foreground p-6">
                <Sparkles className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>Ask a question to get AI-powered stock market insights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysis;
