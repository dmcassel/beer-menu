import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wine, GrapeIcon, MapPinned, Building2 } from "lucide-react";
import { toast } from "sonner";
import ManageWinePage from "./ManageWinePage";
import WineryPage from "./WineryPage";
import VarietalPage from "./VarietalPage";
import LocationPage from "./LocationPage";
import { Link } from "wouter";

export default function WineManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("wines");
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  // Redirect to login if not authenticated or not a curator/admin
  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== "curator" && user.role !== "admin"))
    ) {
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
          <Wine className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
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
              <Wine className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Wine Management</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {user.name}
                </span>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="wines" className="flex items-center gap-2">
              <Wine className="w-4 h-4" />
              <span className="hidden sm:inline">Wines</span>
            </TabsTrigger>
            <TabsTrigger value="wineries" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Wineries</span>
            </TabsTrigger>
            <TabsTrigger value="varietals" className="flex items-center gap-2">
              <GrapeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Varietals</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPinned className="w-4 h-4" />
              <span className="hidden sm:inline">Locations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wines" className="space-y-4">
            <ManageWinePage />
          </TabsContent>

          <TabsContent value="wineries" className="space-y-4">
            <WineryPage />
          </TabsContent>

          <TabsContent value="varietals" className="space-y-4">
            <VarietalPage />
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <LocationPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
