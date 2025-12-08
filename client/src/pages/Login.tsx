import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Beer } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [, setLocation] = useLocation();
  const googleCallbackMutation = trpc.auth.googleCallback.useMutation();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            width: 350,
            text: "signin_with",
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleCallback = async (response: any) => {
    try {
      const result = await googleCallbackMutation.mutateAsync({
        credential: response.credential,
      });

      if (result.success) {
        toast.success("Login successful!");
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Beer className="w-12 h-12 text-amber-700" />
          </div>
          <CardTitle className="text-2xl text-center">Beer Menu Login</CardTitle>
          <CardDescription className="text-center">
            Sign in with your Google account to access the management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div id="google-signin-button"></div>
          </div>
          <div className="mt-6 text-center">
            <a
              href="/browser"
              className="text-sm text-amber-700 hover:text-amber-900 underline"
            >
              View Beer Catalog
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
