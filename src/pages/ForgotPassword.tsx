
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Send } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // In a real app, you would implement actual password reset functionality
      console.log("Reset password for:", values.email);
      
      // Simulate success
      setTimeout(() => {
        toast.success("Password reset instructions sent to your email");
        setIsSubmitted(true);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast.error("Failed to send reset email. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container-padding mx-auto max-w-md py-24">
      <Link to="/login" className="inline-flex items-center text-sm mb-6 text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your email address and we'll send you instructions to reset your password
        </p>
      </div>
      
      <div className="glass border rounded-xl p-6 shadow-sm">
        {isSubmitted ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 text-primary rounded-full p-3">
                <Send className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Check your email</h3>
            <p className="text-muted-foreground mb-4">
              We've sent password reset instructions to your email address.
            </p>
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              Send another email
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset instructions"
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
