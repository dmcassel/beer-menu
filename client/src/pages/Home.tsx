import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beer, Settings, Wine } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-amber-700" />
            <h1 className="text-2xl font-bold text-amber-900">Beer Catalog</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">
            Welcome to Beer Catalog
          </h2>
          <p className="text-xl text-amber-800 mb-8">
            Explore our selection of beers, breweries, and styles
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/beers")}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            <Beer className="w-5 h-5 mr-2" />
            Browse Beers
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/beers")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Beer className="w-5 h-5 text-amber-700" />
                Browse Beers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                Explore our full selection of beers with detailed information
                including ABV, IBU, brewery, and style.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Wine className="w-5 h-5 text-amber-700" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                Find beers by menu category, style, or brewery. Narrow down your
                search to discover your next favorite.
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-amber-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Settings className="w-5 h-5 text-amber-700" />
                Manage Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                Add, edit, and organize beers, breweries, styles, and menu
                categories (admin access).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white rounded-lg border border-amber-200 p-8">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">
            Quick Start
          </h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">1</div>
              <p className="text-amber-800">
                Click "Browse Beers" to explore our catalog
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">2</div>
              <p className="text-amber-800">
                Use filters to find beers by style, brewery, or menu
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700 mb-2">3</div>
              <p className="text-amber-800">
                Visit the Manage section to add or update beers
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
