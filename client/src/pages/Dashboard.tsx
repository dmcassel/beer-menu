import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Beer, Wine } from "lucide-react";
import { toast } from "sonner";

import { Link } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  // Redirect to login if not authenticated or not a curator/admin
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "curator" && user.role !== "admin"))) {
      setLocation("/browser");
    }
  }, [user, isLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await utils.auth.me.invalidate();
      toast.success("Logged out successfully");
      setLocation("/browser");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-12 h-12 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "curator" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-3">
              <Beer className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-900">Beer Catalog</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Beer Management Card */}
          <Link href="/beer-management">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-8 border-2 border-transparent hover:border-amber-500">
              <div className="flex flex-col items-center text-center space-y-4">
                <Beer className="w-16 h-16 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">Beer Management</h2>
                <p className="text-gray-600">Manage beers, breweries, styles, BJCP categories, and menus</p>
              </div>
            </div>
          </Link>

          {/* Wine Management Card */}
          <Link href="/wine-management">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-8 border-2 border-transparent hover:border-purple-500">
              <div className="flex flex-col items-center text-center space-y-4">
                <Wine className="w-16 h-16 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Wine Management</h2>
                <p className="text-gray-600">Manage wines, wineries, varietals, and locations</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
