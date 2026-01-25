import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Label } from "@/components/ui/label";

export default function VarietalPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [varietalToDelete, setVarietalToDelete] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { data: varietals, isLoading, refetch } = trpc.varietal.list.useQuery();
  const createMutation = trpc.varietal.create.useMutation();
  const updateMutation = trpc.varietal.update.useMutation();
  const deleteMutation = trpc.varietal.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success("Varietal updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Varietal created successfully");
      }
      setFormData({ name: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving varietal");
    }
  };

  const handleEdit = (varietal: any) => {
    setFormData({ name: varietal.name });
    setEditingId(varietal.varietalId);
    setOpen(true);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setVarietalToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!varietalToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: varietalToDelete.id });
      toast.success("Varietal deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting varietal");
    } finally {
      setDeleteDialogOpen(false);
      setVarietalToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Grape Varietals</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Varietal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Varietal" : "Add Varietal"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pinot Noir, Chardonnay"
                  required
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {varietals?.map((varietal: any) => (
            <Card key={varietal.varietalId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">{varietal.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(varietal)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(varietal.varietalId, varietal.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Varietal"
        description={`Are you sure you want to delete "${varietalToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
