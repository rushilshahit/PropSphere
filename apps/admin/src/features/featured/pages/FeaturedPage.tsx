import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFeatured, reorderFeatured, toggleFeatured } from '@/api/admin';
import { Badge, Button, Card } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';
import { useState } from 'react';

export default function FeaturedPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'featured'],
    queryFn: listFeatured,
  });

  const [order, setOrder] = useState<string[]>([]);

  const items = data?.items ?? [];
  const displayOrder = order.length ? order : items.map((i) => i.id);

  const toggleMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => toggleFeatured(id, val),
    onSuccess: () => {
      toast('Featured status updated', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'featured'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFeatured,
    onSuccess: () => {
      toast('Order saved', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'featured'] });
    },
  });

  const moveUp = (id: string) => {
    const list = [...displayOrder];
    const idx = list.indexOf(id);
    if (idx > 0) {
      [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      setOrder(list);
    }
  };

  const moveDown = (id: string) => {
    const list = [...displayOrder];
    const idx = list.indexOf(id);
    if (idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      setOrder(list);
    }
  };

  const sortedItems = displayOrder
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as typeof items;

  if (isLoading) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Featured Listings</h1>
        {order.length > 0 && (
          <Button
            loading={reorderMutation.isPending}
            onClick={() => reorderMutation.mutate(order)}
          >
            Save Order
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {sortedItems.map((item, idx) => (
          <Card key={item.id} className="flex items-center gap-4 py-4">
            <span className="text-sm font-bold text-neutral-400 w-6 text-right">{idx + 1}</span>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{item.headline ?? '—'}</p>
              <p className="text-sm text-neutral-500">{item.suburb}, {item.state}</p>
            </div>
            <Badge variant="success">Featured</Badge>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => moveUp(item.id)} disabled={idx === 0}>
                ↑
              </Button>
              <Button size="sm" variant="ghost" onClick={() => moveDown(item.id)} disabled={idx === sortedItems.length - 1}>
                ↓
              </Button>
            </div>
            <Button
              size="sm"
              variant="danger"
              loading={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate({ id: item.id, val: false })}
            >
              Unfeature
            </Button>
          </Card>
        ))}
        {sortedItems.length === 0 && (
          <Card>
            <p className="text-neutral-500 text-center py-4">No featured listings.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
