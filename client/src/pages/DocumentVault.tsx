import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Check, ChevronDown, Download, Eye, File, Heart, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
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
  const [filters, setFilters] = useState({ search: '', page: 1, pageSize: 12 });
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<DocumentItem | null>(null);
  const [editTarget, setEditTarget] = useState<DocumentItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] = useState('');
  const queryFilters = { ...filters, includeDeleted: isDeletedView };
  const { data, isLoading } = useQuery({ queryKey: ['documents', queryFilters], queryFn: () => documentApi.list(queryFilters) });
  const categoryFor = (doc: DocumentItem) => doc.tags[0] || 'Uncategorized';
  const docs = useMemo(() => {
    const visibleDocs = isDeletedView ? (data?.rows || []).filter((doc) => doc.isDeleted) : (data?.rows || []);
    return categoryFilter === 'all' ? visibleDocs : visibleDocs.filter((doc) => categoryFor(doc) === categoryFilter);
  }, [data?.rows, isDeletedView, categoryFilter]);
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    (data?.rows || []).forEach((doc) => doc.tags.forEach((category) => {
      if (category.trim()) categories.add(category.trim());
    }));
    customCategories.forEach((category) => categories.add(category));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [data?.rows, customCategories]);
  const groupedDocs = useMemo(() => {
    const groups = new Map<string, DocumentItem[]>();
    docs.forEach((doc) => {
      const category = categoryFor(doc);
      groups.set(category, [...(groups.get(category) || []), doc]);
    });
    return Array.from(groups.entries()).sort(([categoryA], [categoryB]) => {
      if (categoryA === 'Uncategorized') return 1;
      if (categoryB === 'Uncategorized') return -1;
      return categoryA.localeCompare(categoryB);
    });
  }, [docs]);
  useEffect(() => {
    setEditName(editTarget?.displayName || '');
    setEditCategory(editTarget?.tags[0] || '');
    setIsCreatingCategory(false);
    setNewCategory('');
    setIsCategoryMenuOpen(false);
    setEditingCategoryName('');
    setCategoryDraft('');
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
    const tags = editCategory.trim() ? [editCategory.trim()] : [];
    await documentApi.update(editTarget.id, { displayName: editName, tags });
    toast.success('Document updated');
    setEditTarget(null);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['document', editTarget.id] });
  };

  const createCategory = () => {
    const category = newCategory.trim();
    if (!category) return;
    setCustomCategories((current) => current.some((item) => item.toLowerCase() === category.toLowerCase()) ? current : [...current, category]);
    setEditCategory(category);
    setNewCategory('');
    setIsCreatingCategory(false);
  };

  const documentsInCategory = (category: string) => (data?.rows || []).filter((doc) => doc.tags[0] === category);

  const renameCategory = async (oldCategory: string) => {
    const nextCategory = categoryDraft.trim();
    if (!nextCategory || nextCategory.toLowerCase() === oldCategory.toLowerCase()) {
      setEditingCategoryName('');
      setCategoryDraft('');
      return;
    }
    setCategoryActionLoading(oldCategory);
    try {
      await Promise.all(documentsInCategory(oldCategory).map((doc) => documentApi.update(doc.id, { displayName: doc.displayName, tags: [nextCategory] })));
      setCustomCategories((current) => current.map((category) => category === oldCategory ? nextCategory : category));
      if (editCategory === oldCategory) setEditCategory(nextCategory);
      if (categoryFilter === oldCategory) setCategoryFilter(nextCategory);
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } finally {
      setCategoryActionLoading('');
      setEditingCategoryName('');
      setCategoryDraft('');
    }
  };

  const deleteCategory = async (category: string) => {
    setCategoryActionLoading(category);
    try {
      await Promise.all(documentsInCategory(category).map((doc) => documentApi.update(doc.id, { displayName: doc.displayName, tags: [] })));
      setCustomCategories((current) => current.filter((item) => item !== category));
      if (editCategory === category) setEditCategory('');
      if (categoryFilter === category) setCategoryFilter('all');
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } finally {
      setCategoryActionLoading('');
      setEditingCategoryName('');
      setCategoryDraft('');
    }
  };

  const actionsFor = (doc: DocumentItem) => (
    <div className="table-actions">
      {!doc.isDeleted && <Link className="icon-button" to={`/documents/${doc.id}`} title="Preview"><Eye size={17} /></Link>}
      {!doc.isDeleted && <button className="icon-button" onClick={() => setEditTarget(doc)} title="Rename"><Pencil size={17} /></button>}
      {!doc.isDeleted && <button className="icon-button" onClick={() => mutate(() => documentApi.favorite(doc.id), 'Favorite updated')} title="Favorite"><Heart size={17} fill={doc.isFavorite ? 'currentColor' : 'none'} /></button>}
      {!doc.isDeleted && <button className="icon-button" onClick={() => download(doc)} title="Download"><Download size={17} /></button>}
      {doc.isDeleted ? (
        <>
          <button className="icon-button" onClick={() => mutate(() => documentApi.restore(doc.id), 'Document restored')} title="Restore"><RotateCcw size={17} /></button>
          <button className="icon-button text-rose-700" onClick={() => setPermanentDeleteTarget(doc)} title="Delete permanently"><Trash2 size={17} /></button>
        </>
      ) : <button className="icon-button text-rose-700" onClick={() => setDeleteTarget(doc)} title="Delete"><Trash2 size={17} /></button>}
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
    { header: 'Uploaded', cell: ({ row }) => new Date(row.original.uploadedAt).toLocaleDateString() },
    { header: 'Category', cell: ({ row }) => categoryFor(row.original) },
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
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="form-field pl-10" placeholder="Search documents or category" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} /></div>
          <select className="form-field max-w-64" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="mt-5">
          {isLoading && <p className="text-sm font-bold text-slate-500">Loading documents...</p>}
          {!isLoading && docs.length === 0 && <DataTable rows={[]} columns={columns} emptyTitle={isDeletedView ? 'No deleted documents found.' : 'No documents match this view.'} />}
          {!isLoading && docs.length > 0 && (
            <div className="grid gap-5">
              {groupedDocs.map(([category, categoryDocs]) => (
                <section key={category} className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-600">{category}</h2>
                    <span className="document-type-pill">{categoryDocs.length} {categoryDocs.length === 1 ? 'document' : 'documents'}</span>
                  </div>
                  <DataTable
                    rows={categoryDocs}
                    columns={columns}
                    emptyTitle={isDeletedView ? 'No deleted documents found.' : 'No documents match this view.'}
                    renderMobileCard={(doc) => <DocumentMobileRow doc={doc} actions={actionsFor(doc)} />}
                  />
                </section>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-500"><span>{isDeletedView ? docs.length : data?.total || 0} documents</span><span>Page {data?.page || 1} of {data?.pages || 1}</span></div>
      </section>
      <ConfirmDialog open={!!deleteTarget} title="Delete document?" message="The document will move to deleted items and can be restored later." confirmLabel="Delete" tone="danger" onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && mutate(() => documentApi.delete(deleteTarget.id), 'Document deleted').then(() => setDeleteTarget(null))} />
      <ConfirmDialog open={!!permanentDeleteTarget} title="Delete permanently?" message="This will permanently remove the document and it cannot be restored." confirmLabel="Delete Permanently" tone="danger" onCancel={() => setPermanentDeleteTarget(null)} onConfirm={() => permanentDeleteTarget && mutate(() => documentApi.permanentDelete(permanentDeleteTarget.id), 'Document permanently deleted').then(() => setPermanentDeleteTarget(null))} />
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
              Category
              <div className="relative">
                <button className="form-field flex items-center justify-between gap-3 text-left font-semibold" type="button" onClick={() => setIsCategoryMenuOpen((open) => !open)}>
                  <span className="min-w-0 truncate">{editCategory || 'Uncategorized'}</span>
                  <ChevronDown size={16} />
                </button>
                {isCategoryMenuOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 grid max-h-72 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                    <button className="flex min-h-10 items-center rounded-md px-3 text-left text-sm font-bold hover:bg-slate-50" type="button" onClick={() => { setEditCategory(''); setIsCategoryMenuOpen(false); }}>
                      Uncategorized
                    </button>
                    {categoryOptions.map((category) => (
                      <div key={category} className="flex min-h-10 items-center gap-2 rounded-md px-2 hover:bg-slate-50">
                        {editingCategoryName === category ? (
                          <>
                            <input
                              className="form-field min-h-9 flex-1 px-2 py-1"
                              value={categoryDraft}
                              onChange={(e) => setCategoryDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  renameCategory(category);
                                }
                              }}
                              autoFocus
                            />
                            <button className="icon-button h-8 w-8" type="button" disabled={categoryActionLoading === category} onClick={() => renameCategory(category)} title="Save category"><Check size={14} /></button>
                            <button className="icon-button h-8 w-8" type="button" onClick={() => { setEditingCategoryName(''); setCategoryDraft(''); }} title="Cancel"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button className="min-w-0 flex-1 truncate text-left text-sm font-bold" type="button" onClick={() => { setEditCategory(category); setIsCategoryMenuOpen(false); }}>
                              {category}
                            </button>
                            <button className="icon-button h-8 w-8" type="button" disabled={!!categoryActionLoading} onClick={() => { setEditingCategoryName(category); setCategoryDraft(category); }} title="Edit category"><Pencil size={14} /></button>
                            <button className="icon-button h-8 w-8 text-rose-700" type="button" disabled={!!categoryActionLoading} onClick={() => deleteCategory(category)} title="Delete category"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </label>
            {isCreatingCategory ? (
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input className="form-field" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" autoFocus />
                <button className="btn-secondary" type="button" onClick={createCategory}><Plus size={16} />Create</button>
              </div>
            ) : (
              <button className="btn-secondary justify-self-start" type="button" onClick={() => setIsCreatingCategory(true)}><Plus size={16} />Create New Category</button>
            )}
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
