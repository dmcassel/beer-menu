import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function WinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <Wine className="w-8 h-8 text-purple-700" />
              <h1 className="text-3xl font-bold text-purple-900">Wine Catalog</h1>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="max-w-2xl w-full border-2 border-purple-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className="p-8 bg-purple-100 rounded-full">
                <Wine className="w-24 h-24 text-purple-700" />
              </div>
            </div>
            <CardTitle className="text-4xl text-purple-900 mb-4">
              Wine Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="py-8">
              <p className="text-3xl font-semibold text-purple-800 mb-4">
                Coming Soon
              </p>
              <p className="text-lg text-purple-700">
                We're currently building our wine catalog feature.
              </p>
              <p className="text-lg text-purple-700">
                Check back soon to explore our wine collection!
              </p>
            </div>
            
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
