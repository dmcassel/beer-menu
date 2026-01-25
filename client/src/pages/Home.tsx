import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beer, Wine } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-amber-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-amber-700" />
            <h1 className="text-3xl font-bold text-amber-900">Beer Catalog</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">
            Welcome
          </h2>
          <p className="text-xl text-amber-800">
            Choose what you'd like to explore
          </p>
        </div>

        {/* Selection Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Beer Card */}
          <Card
            className="border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate("/browser")}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                  <Beer className="w-16 h-16 text-amber-700" />
                </div>
              </div>
              <CardTitle className="text-3xl text-amber-900">Beer</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-lg text-amber-800">
                Explore our selection of craft beers, breweries, and styles
              </CardDescription>
            </CardContent>
          </Card>

          {/* Wine Card */}
          <Card
            className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate("/wine")}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-6 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Wine className="w-16 h-16 text-purple-700" />
                </div>
              </div>
              <CardTitle className="text-3xl text-purple-900">Wine</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-lg text-purple-800">
                Discover our wine collection and vineyards
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-amber-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-amber-700">
          <p>Select an option above to get started</p>
        </div>
      </footer>
    </div>
  );
}
