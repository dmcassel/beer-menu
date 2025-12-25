import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";

export default function BeerPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    breweryId: "",
    styleId: "",
    abv: "",
    ibu: "",
    status: "out" as "on_tap" | "bottle_can" | "out",
  });

  const { data: beers, isLoading, refetch } = trpc.beer.list.useQuery();
  const { data: breweries } = trpc.brewery.list.useQuery();
  const { data: styles } = trpc.style.list.useQuery();
  const createMutation = trpc.beer.create.useMutation();
  const updateMutation = trpc.beer.update.useMutation();
  const deleteMutation = trpc.beer.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const breweryId = formData.breweryId ? parseInt(formData.breweryId) : undefined;
      const styleId = formData.styleId ? parseInt(formData.styleId) : undefined;
      const ibu = formData.ibu ? parseInt(formData.ibu) : undefined;

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name || undefined,
          description: formData.description || undefined,
          breweryId,
          styleId,
          abv: formData.abv || undefined,
          ibu,
          status: formData.status,
        });
        toast.success("Beer updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          breweryId,
          styleId,
          abv: formData.abv || undefined,
          ibu,
          status: formData.status,
        });
        toast.success("Beer created successfully");
      }
      setFormData({ name: "", description: "", breweryId: "", styleId: "", abv: "", ibu: "", status: "out" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving beer");
    }
  };

  const handleEdit = (beer: any) => {
    setFormData({
      name: beer.name,
      description: beer.description || "",
      breweryId: beer.breweryId?.toString() || "",
      styleId: beer.styleId?.toString() || "",
      abv: beer.abv || "",
      ibu: beer.ibu?.toString() || "",
      status: beer.status || "out",
    });
    setEditingId(beer.beerId);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Beer deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting beer");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Beers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "", breweryId: "", styleId: "", abv: "", ibu: "", status: "out" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Beer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Beer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Beer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beer description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brewery</label>
                <SearchableSelect
                  options={
                    breweries?.map((brewery) => ({
                      label: brewery.name,
                      value: brewery.breweryId.toString(),
                    })) || []
                  }
                  value={formData.breweryId}
                  onChange={(value) => setFormData({ ...formData, breweryId: value })}
                  placeholder="Select a brewery"
                  emptyText="No breweries found"
                  searchPlaceholder="Search breweries..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Style</label>
                <select
                  value={formData.styleId}
                  onChange={(e) => setFormData({ ...formData, styleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a style</option>
                  {styles?.map((style) => (
                    <option key={style.styleId} value={style.styleId}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ABV %</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.abv}
                    onChange={(e) => setFormData({ ...formData, abv: e.target.value })}
                    placeholder="5.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IBU</label>
                  <Input
                    type="number"
                    value={formData.ibu}
                    onChange={(e) => setFormData({ ...formData, ibu: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "on_tap" | "bottle_can" | "out" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="on_tap">On Tap</option>
                  <option value="bottle_can">Bottle/Can</option>
                  <option value="out">Out</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"} Beer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {beers?.map((beer) => (
            <Card key={beer.beerId}>
              <CardHeader>
                <CardTitle className="text-lg">{beer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {beer.description && <p className="text-sm text-gray-600 mb-2">{beer.description}</p>}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  {breweries?.find((b) => b.breweryId === beer.breweryId) && (
                    <p>Brewery: {breweries.find((b) => b.breweryId === beer.breweryId)?.name}</p>
                  )}
                  {styles?.find((s) => s.styleId === beer.styleId) && (
                    <p>Style: {styles.find((s) => s.styleId === beer.styleId)?.name}</p>
                  )}
                  {beer.abv && <p>ABV: {beer.abv}%</p>}
                  {beer.ibu && <p>IBU: {beer.ibu}</p>}
                  <p>Status: <span className="font-medium">
                    {beer.status === "on_tap" ? "On Tap" : beer.status === "bottle_can" ? "Bottle/Can" : "Out"}
                  </span></p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(beer)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(beer.beerId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
