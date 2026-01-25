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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LocationPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "country" as "country" | "state" | "area" | "vineyard",
    parentId: "" as string,
  });

  const { data: locations, isLoading, refetch } = trpc.location.list.useQuery();
  const createMutation = trpc.location.create.useMutation();
  const updateMutation = trpc.location.update.useMutation();
  const deleteMutation = trpc.location.delete.useMutation();

  // Filter potential parent locations based on type
  const potentialParents = locations?.filter((loc: any) => {
    // Prevent a location from being its own parent
    if (editingId && loc.locationId === editingId) return false;
    
    if (formData.type === "country") return false;
    if (formData.type === "state") return loc.type === "country";
    if (formData.type === "area") return loc.type === "state" || loc.type === "area";
    if (formData.type === "vineyard") return loc.type === "area";
    return false;
  });

  // Group locations by type
  const locationsByType = {
    country: locations?.filter((l: any) => l.type === "country") || [],
    state: locations?.filter((l: any) => l.type === "state") || [],
    area: locations?.filter((l: any) => l.type === "area") || [],
    vineyard: locations?.filter((l: any) => l.type === "vineyard") || [],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        type: formData.type,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success("Location updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Location created successfully");
      }
      setFormData({ name: "", type: "country", parentId: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving location");
    }
  };

  const handleEdit = (location: any) => {
    setFormData({
      name: location.name,
      type: location.type,
      parentId: location.parentId?.toString() || "",
    });
    setEditingId(location.locationId);
    setOpen(true);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setLocationToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: locationToDelete.id });
      toast.success("Location deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting location");
    } finally {
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const getLocationHierarchy = (location: any): string => {
    const parts: string[] = [location.name];
    let current = location;
    
    while (current.parentId) {
      const parent = locations?.find((l: any) => l.locationId === current.parentId);
      if (parent) {
        parts.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    
    return parts.join(" → ");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Locations</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", type: "country", parentId: "" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Location" : "Add Location"}</DialogTitle>
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
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value, parentId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="state">State/Province</SelectItem>
                    <SelectItem value="area">Area/Region</SelectItem>
                    <SelectItem value="vineyard">Vineyard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type !== "country" && potentialParents && potentialParents.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Location</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent location" />
                    </SelectTrigger>
                    <SelectContent>
                      {potentialParents.map((loc: any) => (
                        <SelectItem key={loc.locationId} value={loc.locationId.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
        <div className="space-y-8">
          {/* Countries */}
          {locationsByType.country.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Countries</h3>
              <div className="grid gap-4">
                {locationsByType.country.map((location: any) => (
                  <Card key={location.locationId}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{location.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(location.locationId, location.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Full Path:</span> {getLocationHierarchy(location)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* States/Provinces */}
          {locationsByType.state.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">States/Provinces</h3>
              <div className="grid gap-4">
                {locationsByType.state.map((location: any) => (
                  <Card key={location.locationId}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{location.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(location.locationId, location.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Full Path:</span> {getLocationHierarchy(location)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Areas/Regions */}
          {locationsByType.area.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Areas/Regions</h3>
              <div className="grid gap-4">
                {locationsByType.area.map((location: any) => (
                  <Card key={location.locationId}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{location.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(location.locationId, location.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Full Path:</span> {getLocationHierarchy(location)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vineyards */}
          {locationsByType.vineyard.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Vineyards</h3>
              <div className="grid gap-4">
                {locationsByType.vineyard.map((location: any) => (
                  <Card key={location.locationId}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{location.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(location)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(location.locationId, location.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Full Path:</span> {getLocationHierarchy(location)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Location"
        description={`Are you sure you want to delete "${locationToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
