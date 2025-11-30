import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wine className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Beer Catalog</h1>
          </div>
          <div>
            <Button onClick={() => navigate("/dashboard")}>
              Open Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Beer Catalog</h2>
          <p className="text-xl text-gray-600 mb-8">
            Manage your beer inventory, breweries, styles, and menu categories with ease.
          </p>
          <Button size="lg" onClick={() => navigate("/dashboard")}>
            Open Dashboard
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-amber-600" />
                Manage Beers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add, edit, and organize your beer inventory with detailed information including ABV, IBU, and style.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-amber-600" />
                Breweries & Styles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Organize beers by brewery and style, with support for BJCP categories and detailed descriptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-amber-600" />
                Menu Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create custom menu categories and associate beers to organize your offerings effectively.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
