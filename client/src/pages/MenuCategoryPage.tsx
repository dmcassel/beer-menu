import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

export default function MenuCategoryPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBeerId, setSelectedBeerId] = useState<string>("");

  const { data: menuCategories, isLoading, refetch } = trpc.menuCategory.list.useQuery();
  const { data: beers } = trpc.beer.list.useQuery();
  const { data: categoryBeers } = trpc.menuCategoryBeer.getBeersInCategory.useQuery(
    { menuCatId: selectedCategory || 0 },
    { enabled: !!selectedCategory }
  );

  const createMutation = trpc.menuCategory.create.useMutation();
  const updateMutation = trpc.menuCategory.update.useMutation();
  const deleteMutation = trpc.menuCategory.delete.useMutation();
  const addBeerMutation = trpc.menuCategoryBeer.addBeerToCategory.useMutation();
  const removeBeerMutation = trpc.menuCategoryBeer.removeBeerFromCategory.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success("Menu category updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Menu category created successfully");
      }
      setFormData({ name: "", description: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving menu category");
    }
  };

  const handleEdit = (category: any) => {
    setFormData({ name: category.name, description: category.description || "" });
    setEditingId(category.menuCatId);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Menu category deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting menu category");
    }
  };

  const handleAddBeer = async () => {
    if (!selectedCategory || !selectedBeerId) {
      toast.error("Please select a category and beer");
      return;
    }
    try {
      await addBeerMutation.mutateAsync({
        menuCatId: selectedCategory,
        beerId: parseInt(selectedBeerId),
      });
      toast.success("Beer added to category");
      setSelectedBeerId("");
      refetch();
    } catch (error) {
      toast.error("Error adding beer to category");
    }
  };

  const handleRemoveBeer = async (beerId: number) => {
    if (!selectedCategory) return;
    try {
      await removeBeerMutation.mutateAsync({
        menuCatId: selectedCategory,
        beerId,
      });
      toast.success("Beer removed from category");
      refetch();
    } catch (error) {
      toast.error("Error removing beer from category");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Menu Categories</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Menu Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Seasonal Beers"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"} Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-4">Categories</h3>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {menuCategories?.map((category) => (
                <div
                  key={category.menuCatId}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedCategory === category.menuCatId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedCategory(category.menuCatId)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.menuCatId);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-4">
            {selectedCategory ? "Beers in Category" : "Select a category"}
          </h3>
          {selectedCategory && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={selectedBeerId}
                  onChange={(e) => setSelectedBeerId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select beer to add</option>
                  {beers?.map((beer) => (
                    <option key={beer.beerId} value={beer.beerId}>
                      {beer.name}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddBeer} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {categoryBeers?.map((item) => {
                  const beer = beers?.find((b) => b.beerId === item.beerId);
                  return (
                    <div key={item.beerId} className="flex justify-between items-center p-2 border rounded bg-gray-50">
                      <span className="text-sm">{beer?.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBeer(item.beerId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
