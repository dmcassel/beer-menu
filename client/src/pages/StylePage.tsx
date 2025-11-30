import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function StylePage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", bjcpId: "", bjcpLink: "" });

  const { data: styles, isLoading, refetch } = trpc.style.list.useQuery();
  const { data: bjcpCategories } = trpc.bjcpCategory.list.useQuery();
  const createMutation = trpc.style.create.useMutation();
  const updateMutation = trpc.style.update.useMutation();
  const deleteMutation = trpc.style.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bjcpId = formData.bjcpId ? parseInt(formData.bjcpId) : undefined;
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name || undefined,
          description: formData.description || undefined,
          bjcpId,
          bjcpLink: formData.bjcpLink || undefined,
        });
        toast.success("Style updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          bjcpId,
          bjcpLink: formData.bjcpLink || undefined,
        });
        toast.success("Style created successfully");
      }
      setFormData({ name: "", description: "", bjcpId: "", bjcpLink: "" });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error saving style");
    }
  };

  const handleEdit = (style: any) => {
    setFormData({
      name: style.name,
      description: style.description || "",
      bjcpId: style.bjcpId?.toString() || "",
      bjcpLink: style.bjcpLink || "",
    });
    setEditingId(style.styleId);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Style deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Error deleting style");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Beer Styles</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setFormData({ name: "", description: "", bjcpId: "", bjcpLink: "" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Style
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Beer Style</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pale Ale"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Style description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BJCP Category</label>
                <select
                  value={formData.bjcpId}
                  onChange={(e) => setFormData({ ...formData, bjcpId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {bjcpCategories?.map((cat) => (
                    <option key={cat.bjcpId} value={cat.bjcpId}>
                      {cat.label} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BJCP Link</label>
                <Input
                  value={formData.bjcpLink}
                  onChange={(e) => setFormData({ ...formData, bjcpLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Create"} Style
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {styles?.map((style) => (
            <Card key={style.styleId}>
              <CardHeader>
                <CardTitle className="text-lg">{style.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {style.description && <p className="text-sm text-gray-600 mb-2">{style.description}</p>}
                <p className="text-xs text-gray-500 mb-4">
                  {bjcpCategories?.find((c) => c.bjcpId === style.bjcpId)?.label}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(style)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(style.styleId)}
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
