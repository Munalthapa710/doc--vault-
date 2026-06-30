import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, File, Heart, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, documentApi, DocumentItem } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';

const formatBytes = (bytes: number) => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export function DocumentVault() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', fileType: '', sort: 'newest', includeDeleted: false, page: 1, pageSize: 12 });
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['documents', filters], queryFn: () => documentApi.list(filters) });
  const docs = data?.rows || [];

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

  return (
    <div className="grid gap-5">
      <section className="page-header">
        <div><span className="eyebrow">Private files</span><h1>Document Vault</h1><p>Search, preview, download, favorite, restore, and delete documents.</p></div>
        <Link className="btn-primary" to="/documents/upload">Upload</Link>
      </section>
      <section className="page-panel">
        <div className="resource-filter-fields">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="form-field pl-10" placeholder="Search documents or tags" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} /></div>
          <select className="form-field max-w-36" value={filters.fileType} onChange={(e) => setFilters({ ...filters, fileType: e.target.value, page: 1 })}><option value="">All types</option><option value="pdf">PDF</option><option value="jpg">JPG</option><option value="png">PNG</option><option value="docx">DOCX</option><option value="txt">TXT</option></select>
          <select className="form-field max-w-40" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="size">File size</option></select>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={filters.includeDeleted} onChange={(e) => setFilters({ ...filters, includeDeleted: e.target.checked })} /> Deleted</label>
        </div>
        <div className="mt-5 grid gap-3">
          {isLoading && <p className="text-sm font-bold text-slate-500">Loading documents...</p>}
          {!isLoading && docs.length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">No documents match this view.</p>}
          {docs.map((doc) => (
            <article key={doc.id} className="mobile-list-row rounded-xl border border-slate-200 bg-white shadow-sm">
              <span className="mobile-list-thumb"><File size={22} /></span>
              <div className="mobile-list-main">
                <strong>{doc.displayName}</strong>
                <div className="mobile-list-meta"><span>{doc.fileExtension.toUpperCase()}</span><span>{formatBytes(doc.fileSize)}</span><span>{new Date(doc.uploadedAt).toLocaleDateString()}</span></div>
              </div>
              <div className="mobile-data-actions">
                <div>
                  <Link className="icon-button" to={`/documents/${doc.id}`} title="Preview"><Eye size={17} /></Link>
                  <button className="icon-button" onClick={() => mutate(() => documentApi.favorite(doc.id), 'Favorite updated')} title="Favorite"><Heart size={17} fill={doc.isFavorite ? 'currentColor' : 'none'} /></button>
                  <button className="icon-button" onClick={() => download(doc)} title="Download"><Download size={17} /></button>
                  {doc.isDeleted ? <button className="icon-button" onClick={() => mutate(() => documentApi.restore(doc.id), 'Document restored')} title="Restore"><RotateCcw size={17} /></button> : <button className="icon-button text-rose-700" onClick={() => setDeleteTarget(doc)} title="Delete"><Trash2 size={17} /></button>}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-500"><span>{data?.total || 0} documents</span><span>Page {data?.page || 1} of {data?.pages || 1}</span></div>
      </section>
      <ConfirmDialog open={!!deleteTarget} title="Delete document?" message="The document will move to deleted items and can be restored later." confirmLabel="Delete" tone="danger" onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && mutate(() => documentApi.delete(deleteTarget.id), 'Document deleted').then(() => setDeleteTarget(null))} />
    </div>
  );
}
