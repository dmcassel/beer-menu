import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function WineHeader() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await utils.auth.me.invalidate();
      toast.success("Logged out successfully");
      setLocation("/wine");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, {user.name || user.email}
        </span>
        {(user.role === "curator" || user.role === "admin") && (
          <a
            href="/dashboard"
            className="text-sm text-purple-700 hover:text-purple-900 underline"
          >
            Manage Catalog
          </a>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <a
      href="/login?returnUrl=/wine"
      className="text-sm text-purple-700 hover:text-purple-900 underline"
    >
      Login
    </a>
  );
}

export default function WinePage() {
  const { data: availableWines, isLoading } = trpc.wine.listAvailable.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Wine className="w-8 h-8 text-purple-700" />
                <h1 className="text-3xl font-bold text-purple-900">Wine Catalog</h1>
              </div>
            </Link>
            <WineHeader />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
          </div>
        ) : availableWines && availableWines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableWines.map((wine) => (
              <Card key={wine.wineId} className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-900">
                    {wine.label}
                    {wine.vintage && (
                      <span className="text-purple-600 font-normal ml-2">
                        {wine.vintage}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {wine.wineryName && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Winery:</span> {wine.wineryName}
                      </p>
                    )}
                    
                    {wine.varietals && wine.varietals.length > 0 && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Varietal{wine.varietals.length > 1 ? 's' : ''}:</span>{' '}
                        {wine.varietals.map((v) => v.name).join(', ')}
                      </p>
                    )}
                    
                    {wine.locationName && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Location:</span> {wine.locationName}
                      </p>
                    )}
                    
                    <div className="flex gap-4 text-sm text-gray-700 pt-2">
                      {wine.refrigerated > 0 && (
                        <span className="font-medium">
                          🧊 Refrigerated: {wine.refrigerated}
                        </span>
                      )}
                      {wine.cellared > 0 && (
                        <span className="font-medium">
                          🍷 Cellared: {wine.cellared}
                        </span>
                      )}
                    </div>
                    
                    {wine.description && (
                      <p className="text-sm text-gray-600 pt-2 border-t border-gray-200 mt-3 whitespace-pre-line">
                        {wine.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto border-2 border-purple-200">
            <CardContent className="text-center py-12">
              <Wine className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-purple-800 mb-2">
                No wines available
              </p>
              <p className="text-gray-600">
                There are currently no wines with bottles in stock.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
