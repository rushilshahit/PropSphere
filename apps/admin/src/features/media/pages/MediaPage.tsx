import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOrphanedMedia, getMediaSummary, listMediaFiles } from '@/api/admin';
import { Badge, Button, Card, Pagination, Table } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: summary } = useQuery({
    queryKey: ['admin', 'media-summary'],
    queryFn: getMediaSummary,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media', page],
    queryFn: () => listMediaFiles(page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrphanedMedia,
    onSuccess: (r) => {
      toast(`Deleted ${r.deleted} orphaned files`, 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'media'] });
      qc.invalidateQueries({ queryKey: ['admin', 'media-summary'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Media Library</h1>
        {(summary?.orphanedCount ?? 0) > 0 && (
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (confirm(`Delete ${summary!.orphanedCount} orphaned files?`)) {
                deleteMutation.mutate();
              }
            }}
          >
            Delete {summary?.orphanedCount} Orphaned Files
          </Button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-neutral-500">Total Files</p>
            <p className="text-2xl font-bold">{summary.totalFiles.toLocaleString()}</p>
          </Card>
          <Card>
            <p className="text-sm text-neutral-500">Total Size</p>
            <p className="text-2xl font-bold">{formatBytes(summary.totalSizeBytes)}</p>
          </Card>
          <Card>
            <p className="text-sm text-neutral-500">Orphaned Files</p>
            <p className={`text-2xl font-bold ${summary.orphanedCount > 0 ? 'text-red-600' : ''}`}>
              {summary.orphanedCount}
            </p>
          </Card>
        </div>
      )}

      <Card className="p-0">
        <Table
          loading={isLoading}
          rows={data?.items ?? []}
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: 'preview',
              header: 'Preview',
              className: 'w-16',
              render: (r) => (
                <img
                  src={r.cdn_url}
                  alt=""
                  className="w-12 h-12 rounded object-cover bg-neutral-100"
                  loading="lazy"
                />
              ),
            },
            { key: 'storage_path', header: 'Path', className: 'max-w-xs truncate' },
            {
              key: 'property_address',
              header: 'Property',
              render: (r) => r.property_address ?? '—',
            },
            {
              key: 'is_orphaned',
              header: 'Status',
              render: (r) => (
                <Badge variant={r.is_orphaned ? 'danger' : 'success'}>
                  {r.is_orphaned ? 'Orphaned' : 'Linked'}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              header: 'Uploaded',
              render: (r) => new Date(r.created_at).toLocaleDateString(),
            },
          ]}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
      </Card>
    </div>
  );
}
