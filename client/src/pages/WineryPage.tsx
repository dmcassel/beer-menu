import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Label } from "@/components/ui/label";

export default function WineryPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wineryToDelete, setWineryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", location: "" });

  const { data: wineries, isLoading, refetch } = trpc.winery.list.useQuery();
  const createMutation = trpc.winery.create.useMutation();
  const updateMutation = trpc.winery.update.useMutation();
  const deleteMutation = trpc.winery.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success("Winery updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Winery created successfully");
      }
      setFormData({ name: "", location: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving winery");
    }
  };

  const handleEdit = (winery: any) => {
    setFormData({ name: winery.name, location: winery.location || "" });
    setEditingId(winery.wineryId);
    setOpen(true);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setWineryToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!wineryToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: wineryToDelete.id });
      toast.success("Winery deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting winery");
    } finally {
      setDeleteDialogOpen(false);
      setWineryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Wineries</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", location: "" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Winery
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Winery" : "Add Winery"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Napa Valley, California"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {wineries?.map((winery: any) => (
            <Card key={winery.wineryId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{winery.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(winery)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(winery.wineryId, winery.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              {winery.location && (
                <CardContent>
                  <p className="text-sm text-gray-600">{winery.location}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Winery"
        description={`Are you sure you want to delete "${wineryToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
