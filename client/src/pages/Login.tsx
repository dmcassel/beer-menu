import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Beer } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [location, setLocation] = useLocation();
  const googleCallbackMutation = trpc.auth.googleCallback.useMutation();
  const devLoginMutation = trpc.auth.devLogin.useMutation();
  const [devRole, setDevRole] = useState<"user" | "curator" | "admin">("curator");
  
  // Get return URL from query parameter, default to /dashboard
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

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

  const handleDevLogin = async () => {
    try {
      await devLoginMutation.mutateAsync({ role: devRole });
      toast.success(`Logged in as Dev User (${devRole})`);
      setLocation(returnUrl);
    } catch (error: any) {
      toast.error(error.message || "Dev login failed.");
    }
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      const result = await googleCallbackMutation.mutateAsync({
        credential: response.credential,
      });

      if (result.success) {
        toast.success("Login successful!");
        setLocation(returnUrl);
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
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-dashed border-amber-300">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wide">
                Dev Login (local only)
              </p>
              <div className="flex gap-2">
                <Select value={devRole} onValueChange={(v) => setDevRole(v as typeof devRole)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="curator">Curator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleDevLogin}
                  disabled={devLoginMutation.isPending}
                  variant="outline"
                  className="border-amber-400 text-amber-800 hover:bg-amber-50"
                >
                  {devLoginMutation.isPending ? "Logging in…" : "Login"}
                </Button>
              </div>
            </div>
          )}
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
