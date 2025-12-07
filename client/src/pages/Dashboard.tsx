import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Beer, Layers, MapPin, Menu, Tag } from "lucide-react";
import BJCPCategoryPage from "./BJCPCategoryPage";
import StylePage from "./StylePage";
import BreweryPage from "./BreweryPage";
import BeerPage from "./BeerPage";
import MenuCategoryPage from "./MenuCategoryPage";
import { Link } from "wouter";

export default function Dashboard() {
  // const { user, logout } = useAuth();
  const user = { name: "Dave" };
  const logout = () => console.log("logout");
  const [activeTab, setActiveTab] = useState("beers");

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
                <span className="text-sm text-gray-600">
                  Welcome, {user.name}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
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
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="beers" className="flex items-center gap-2">
              <Beer className="w-4 h-4" />
              <span className="hidden sm:inline">Beers</span>
            </TabsTrigger>
            <TabsTrigger value="breweries" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Breweries</span>
            </TabsTrigger>
            <TabsTrigger value="styles" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Styles</span>
            </TabsTrigger>
            <TabsTrigger value="bjcp" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">BJCP</span>
            </TabsTrigger>
            <TabsTrigger value="menus" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Menus</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="beers" className="space-y-4">
            <BeerPage />
          </TabsContent>

          <TabsContent value="breweries" className="space-y-4">
            <BreweryPage />
          </TabsContent>

          <TabsContent value="styles" className="space-y-4">
            <StylePage />
          </TabsContent>

          <TabsContent value="bjcp" className="space-y-4">
            <BJCPCategoryPage />
          </TabsContent>

          <TabsContent value="menus" className="space-y-4">
            <MenuCategoryPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
