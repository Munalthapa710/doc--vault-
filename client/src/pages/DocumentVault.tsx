import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Download, Eye, File, Heart, Pencil, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, documentApi, DocumentItem } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';

const formatBytes = (bytes: number) => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export function DocumentVault() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const isDeletedView = location.pathname === '/documents/deleted';
  const [filters, setFilters] = useState({ search: '', fileType: '', sort: 'newest', includeDeleted: false, page: 1, pageSize: 12 });
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [editTarget, setEditTarget] = useState<DocumentItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const queryFilters = { ...filters, includeDeleted: isDeletedView || filters.includeDeleted };
  const { data, isLoading } = useQuery({ queryKey: ['documents', queryFilters], queryFn: () => documentApi.list(queryFilters) });
  const docs = isDeletedView ? (data?.rows || []).filter((doc) => doc.isDeleted) : (data?.rows || []);
  useEffect(() => {
    setEditName(editTarget?.displayName || '');
    setEditTags(editTarget?.tags.join(', ') || '');
  }, [editTarget]);

  const mutate = async (action: () => Promise<unknown>, message: string) => {
    await action();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const download = async (doc: DocumentItem) => {
    const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${doc.displayName}.${doc.fileExtension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const rename = async (event: FormEvent) => {
    event.preventDefault();
    if (!editTarget) return;
    const tags = editTags.split(',').map((tag) => tag.trim()).filter(Boolean);
    await documentApi.update(editTarget.id, { displayName: editName, tags });
    toast.success('Document updated');
    setEditTarget(null);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document', editTarget.id] });
  };

  const actionsFor = (doc: DocumentItem) => (
    <div className="table-actions">
      {!doc.isDeleted && <Link className="icon-button" to={`/documents/${doc.id}`} title="Preview"><Eye size={17} /></Link>}
      {!doc.isDeleted && <button className="icon-button" onClick={() => setEditTarget(doc)} title="Rename"><Pencil size={17} /></button>}
      {!doc.isDeleted && <button className="icon-button" onClick={() => mutate(() => documentApi.favorite(doc.id), 'Favorite updated')} title="Favorite"><Heart size={17} fill={doc.isFavorite ? 'currentColor' : 'none'} /></button>}
      {!doc.isDeleted && <button className="icon-button" onClick={() => download(doc)} title="Download"><Download size={17} /></button>}
      {doc.isDeleted ? <button className="icon-button" onClick={() => mutate(() => documentApi.restore(doc.id), 'Document restored')} title="Restore"><RotateCcw size={17} /></button> : <button className="icon-button text-rose-700" onClick={() => setDeleteTarget(doc)} title="Delete"><Trash2 size={17} /></button>}
    </div>
  );

  const columns = useMemo<ColumnDef<DocumentItem>[]>(() => [
    {
      header: 'Document',
      cell: ({ row }) => (
        <div className="document-table-name">
          <DocumentThumb doc={row.original} />
          <div>
            <strong>{row.original.displayName}</strong>
            <span>{row.original.originalFileName}</span>
          </div>
        </div>
      )
    },
    { header: 'Type', cell: ({ row }) => <span className="document-type-pill">{row.original.fileExtension.toUpperCase()}</span> },
    { header: 'Size', cell: ({ row }) => formatBytes(row.original.fileSize) },
    { header: isDeletedView ? 'Deleted' : 'Uploaded', cell: ({ row }) => new Date(row.original.uploadedAt).toLocaleDateString() },
    { header: 'Tags', cell: ({ row }) => row.original.tags.length ? row.original.tags.slice(0, 3).join(', ') : '-' },
    { header: 'Actions', cell: ({ row }) => actionsFor(row.original) }
  ], [isDeletedView]);

  return (
    <div className="grid gap-5">
      <section className="page-header">
        <div><span className="eyebrow">Private files</span><h1>{isDeletedView ? 'Restore Deleted' : 'Document Vault'}</h1><p>{isDeletedView ? 'Review deleted documents and restore files you still need.' : 'Search, preview, download, favorite, restore, and delete documents.'}</p></div>
        {isDeletedView ? <Link className="btn-secondary" to="/documents">Back to Vault</Link> : <Link className="btn-primary" to="/documents/upload">Upload</Link>}
      </section>
      <section className="page-panel">
        <div className="resource-filter-fields">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="form-field pl-10" placeholder="Search documents or tags" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} /></div>
          <select className="form-field max-w-36" value={filters.fileType} onChange={(e) => setFilters({ ...filters, fileType: e.target.value, page: 1 })}><option value="">All types</option><option value="pdf">PDF</option><option value="jpg">JPG</option><option value="png">PNG</option><option value="docx">DOCX</option><option value="txt">TXT</option></select>
          <select className="form-field max-w-40" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="size">File size</option></select>
          {!isDeletedView && <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={filters.includeDeleted} onChange={(e) => setFilters({ ...filters, includeDeleted: e.target.checked })} /> Deleted</label>}
        </div>
        <div className="mt-5">
          {isLoading && <p className="text-sm font-bold text-slate-500">Loading documents...</p>}
          {!isLoading && (
            <DataTable
              rows={docs}
              columns={columns}
              emptyTitle={isDeletedView ? 'No deleted documents found.' : 'No documents match this view.'}
              renderMobileCard={(doc) => <DocumentMobileRow doc={doc} actions={actionsFor(doc)} />}
            />
          )}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-500"><span>{isDeletedView ? docs.length : data?.total || 0} documents</span><span>Page {data?.page || 1} of {data?.pages || 1}</span></div>
      </section>
      <ConfirmDialog open={!!deleteTarget} title="Delete document?" message="The document will move to deleted items and can be restored later." confirmLabel="Delete" tone="danger" onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && mutate(() => documentApi.delete(deleteTarget.id), 'Document deleted').then(() => setDeleteTarget(null))} />
      {editTarget && (
        <div className="confirm-layer" role="presentation">
          <button className="confirm-backdrop" type="button" aria-label="Cancel rename" onClick={() => setEditTarget(null)} />
          <form className="confirm-panel grid gap-4" role="dialog" aria-modal="true" onSubmit={rename}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Document</span>
                <h2 className="text-lg font-black">Rename Document</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setEditTarget(null)} aria-label="Close"><X size={17} /></button>
            </div>
            <label className="grid gap-2 text-sm font-bold">
              Display name
              <input className="form-field" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Tags
              <input className="form-field" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="passport, insurance, tax" />
            </label>
            <div className="confirm-actions mt-0">
              <button className="btn-secondary" type="button" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn-primary" type="submit">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function DocumentThumb({ doc }: { doc: DocumentItem }) {
  const isImage = doc.mimeType.startsWith('image/') && !doc.isDeleted;
  const { data: previewBlob } = useQuery({
    queryKey: ['document-thumb', doc.id],
    queryFn: async () => (await api.get(`/documents/${doc.id}/preview`, { responseType: 'blob' })).data as Blob,
    enabled: isImage
  });
  const previewUrl = useMemo(() => previewBlob ? URL.createObjectURL(previewBlob) : '', [previewBlob]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <span className="mobile-list-thumb">
      {previewUrl ? <img src={previewUrl} alt={doc.displayName} loading="lazy" /> : <File size={22} />}
    </span>
  );
}

function DocumentMobileRow({ doc, actions }: { doc: DocumentItem; actions: ReactNode }) {
  return (
    <article className="mobile-list-row rounded-xl border border-slate-200 bg-white shadow-sm">
      <DocumentThumb doc={doc} />
      <div className="mobile-list-main">
        <strong>{doc.displayName}</strong>
        <div className="mobile-list-meta"><span>{doc.fileExtension.toUpperCase()}</span><span>{formatBytes(doc.fileSize)}</span><span>{new Date(doc.uploadedAt).toLocaleDateString()}</span></div>
      </div>
      <div className="mobile-data-actions">{actions}</div>
    </article>
  );
}
