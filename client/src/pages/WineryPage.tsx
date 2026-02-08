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
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";

export default function WineryPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wineryToDelete, setWineryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    locationId: null as number | null 
  });

  const { data: wineries, isLoading, refetch } = trpc.winery.list.useQuery();
  const { data: locations } = trpc.location.listWithPaths.useQuery();
  const createMutation = trpc.winery.create.useMutation();
  const updateMutation = trpc.winery.update.useMutation();
  const deleteMutation = trpc.winery.delete.useMutation();

  const locationOptions: SearchableSelectOption[] =
    locations?.map((l: any) => ({
      label: l.fullPath,
      value: l.locationId.toString(),
    })) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        locationId: formData.locationId || undefined,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success("Winery updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Winery created successfully");
      }
      setFormData({ name: "", locationId: null });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving winery");
    }
  };

  const handleEdit = (winery: any) => {
    setFormData({ 
      name: winery.name, 
      locationId: winery.locationId || null 
    });
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

  // Helper function to get location full path
  const getLocationPath = (locationId: number | null) => {
    if (!locationId || !locations) return null;
    const location = locations.find((l: any) => l.locationId === locationId);
    return location?.fullPath || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Wineries</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setEditingId(null); 
              setFormData({ name: "", locationId: null }); 
            }}>
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
                <Label>Location</Label>
                <SearchableSelect
                  options={locationOptions}
                  value={formData.locationId?.toString() || ""}
                  onChange={(value) => setFormData({ ...formData, locationId: value ? parseInt(value) : null })}
                  placeholder="Search and select location..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {(winery.location || winery.locationId) && (
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {getLocationPath(winery.locationId) || winery.location}
                  </p>
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
