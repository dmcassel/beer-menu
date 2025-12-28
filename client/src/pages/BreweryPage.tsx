import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export default function BreweryPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [breweryToDelete, setBreweryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "" });

  const { data: breweries, isLoading, refetch } = trpc.brewery.list.useQuery();
  const createMutation = trpc.brewery.create.useMutation();
  const updateMutation = trpc.brewery.update.useMutation();
  const deleteMutation = trpc.brewery.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success("Brewery updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Brewery created successfully");
      }
      setFormData({ name: "", location: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      console.log(`BreweryPage; error=${error}`);
      toast.error("Error saving brewery");
    }
  };

  const handleEdit = (brewery: any) => {
    setFormData({ name: brewery.name, location: brewery.location || "" });
    setEditingId(brewery.breweryId);
    setOpen(true);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setBreweryToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!breweryToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: breweryToDelete.id });
      toast.success("Brewery deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting brewery");
    } finally {
      setDeleteDialogOpen(false);
      setBreweryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Breweries</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", location: "" });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Brewery
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Brewery</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Brewery name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={e =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="City, State"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"} Brewery
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {breweries?.map(brewery => (
            <Card key={brewery.breweryId}>
              <CardHeader>
                <CardTitle className="text-lg">{brewery.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {brewery.location && (
                  <p className="text-sm text-gray-600 mb-4">
                    {brewery.location}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(brewery)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(brewery.breweryId, brewery.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={breweryToDelete?.name}
      />
    </div>
  );
}
