import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";


export default function ManageWinePage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wineToDelete, setWineToDelete] = useState<{ id: number; label: string } | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    wineryId: "",
    vintage: "",
    locationId: null as number | null,
    refrigerated: "0",
    cellared: "0",
    description: "",
    varietalIds: [] as string[],
  });

  const { data: wines, isLoading, refetch } = trpc.wine.list.useQuery();
  const { data: wineries } = trpc.winery.list.useQuery();
  const { data: varietals } = trpc.varietal.list.useQuery();
  const { data: locations } = trpc.location.listWithPaths.useQuery();
  const createMutation = trpc.wine.create.useMutation();
  const updateMutation = trpc.wine.update.useMutation();
  const deleteMutation = trpc.wine.delete.useMutation();

  const wineryOptions: SearchableSelectOption[] =
    wineries?.map((w: any) => ({
      label: w.name,
      value: w.wineryId.toString(),
    })) || [];

  const varietalOptions: MultiSelectOption[] =
    varietals?.map((v: any) => ({
      label: v.name,
      value: v.varietalId.toString(),
    })) || [];

  const locationOptions: SearchableSelectOption[] =
    locations?.map((l: any) => ({
      label: l.fullPath,
      value: l.locationId.toString(),
    })) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        label: formData.label,
        wineryId: formData.wineryId ? parseInt(formData.wineryId) : undefined,
        vintage: formData.vintage ? parseInt(formData.vintage) : undefined,
        locationId: formData.locationId || undefined,
        refrigerated: parseInt(formData.refrigerated),
        cellared: parseInt(formData.cellared),
        description: formData.description || undefined,
        varietalIds: formData.varietalIds.map((id) => parseInt(id)),
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success("Wine updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Wine created successfully");
      }
      setFormData({
        label: "",
        wineryId: "",
        vintage: "",
        locationId: null,
        refrigerated: "0",
        cellared: "0",
        description: "",
        varietalIds: [],
      });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving wine");
    }
  };

  const handleEdit = (wine: any) => {
    setFormData({
      label: wine.label,
      wineryId: wine.wineryId?.toString() || "",
      vintage: wine.vintage?.toString() || "",
      locationId: wine.locationId || null,
      refrigerated: wine.refrigerated?.toString() || "0",
      cellared: wine.cellared?.toString() || "0",
      description: wine.description || "",
      varietalIds: wine.varietals?.map((v: any) => v.varietalId.toString()) || [],
    });
    setEditingId(wine.wineId);
    setOpen(true);
  };

  const handleDeleteClick = (id: number, label: string) => {
    setWineToDelete({ id, label });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!wineToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: wineToDelete.id });
      toast.success("Wine deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting wine");
    } finally {
      setDeleteDialogOpen(false);
      setWineToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Wines</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  label: "",
                  wineryId: "",
                  vintage: "",
                  locationId: null,
                  refrigerated: "0",
                  cellared: "0",
                  description: "",
                  varietalIds: [],
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Wine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Wine" : "Add Wine"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Winery</Label>
                <SearchableSelect
                  options={wineryOptions}
                  value={formData.wineryId}
                  onChange={(value) => setFormData({ ...formData, wineryId: value })}
                  placeholder="Select winery..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vintage">Vintage</Label>
                <Input
                  id="vintage"
                  type="number"
                  value={formData.vintage}
                  onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
                  placeholder="e.g., 2020"
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

              <div className="space-y-2">
                <Label>Varietals</Label>
                <MultiSelect
                  options={varietalOptions}
                  selected={formData.varietalIds}
                  onChange={(varietalIds) => setFormData({ ...formData, varietalIds })}
                  placeholder="Select varietals..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refrigerated">Refrigerated</Label>
                  <Input
                    id="refrigerated"
                    type="number"
                    min="0"
                    value={formData.refrigerated}
                    onChange={(e) => setFormData({ ...formData, refrigerated: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellared">Cellared</Label>
                  <Input
                    id="cellared"
                    type="number"
                    min="0"
                    value={formData.cellared}
                    onChange={(e) => setFormData({ ...formData, cellared: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
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
          {wines?.map((wine: any) => (
            <Card key={wine.wineId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">
                    {wine.label} {wine.vintage && `(${wine.vintage})`}
                  </CardTitle>
                  {wine.wineryName && (
                    <p className="text-sm text-gray-600 mt-1">{wine.wineryName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(wine)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(wine.wineId, wine.label)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wine.varietals && wine.varietals.length > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Varietals:</span>{" "}
                      {wine.varietals.map((v: any) => v.name).join(", ")}
                    </p>
                  )}
                  {wine.locationName && (
                    <p className="text-sm">
                      <span className="font-medium">Location:</span> {wine.locationName}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Inventory:</span> {wine.refrigerated} refrigerated,{" "}
                    {wine.cellared} cellared
                  </p>
                  {wine.description && (
                    <p className="text-sm text-gray-600 mt-2">{wine.description}</p>
                  )}
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
        title="Delete Wine"
        description={`Are you sure you want to delete "${wineToDelete?.label}"? This action cannot be undone.`}
      />
    </div>
  );
}
