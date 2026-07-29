import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Archive, Clock3, Database, FileText, HardDrive, Layers3, Star, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi, DocumentItem } from '../api';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : 'None';

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
  const typeRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.documentsByType)
      .map(([type, count]) => ({
        type: type.toUpperCase(),
        count,
        storage: data.storageByType[type] || 0,
        share: data.totalDocuments > 0 ? Math.round((count / data.totalDocuments) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count || b.storage - a.storage);
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <div className="dashboard-shell">
        <section className="page-header">
          <div><span className="eyebrow">Secure storage</span><h1>Document Dashboard</h1><p>Unable to load dashboard data right now.</p></div>
          <Link className="btn-primary" to="/documents/upload">Upload Document</Link>
        </section>
        <section className="page-panel">
          <p className="text-sm font-bold text-slate-500">Please refresh the page or sign in again.</p>
        </section>
      </div>
    );
  }

  const averageSize = data.totalDocuments > 0 ? data.totalStorageUsed / data.totalDocuments : 0;
  const largestType = typeRows[0];
  const latestUpload = data.recentUploads[0];
  const largestFile = data.largestDocuments[0];

  return (
    <div className="dashboard-shell">
      <section className="page-header">
        <div><span className="eyebrow">Secure storage</span><h1>Document Dashboard</h1><p>Your private vault activity, file mix, and storage overview.</p></div>
        <Link className="btn-primary" to="/documents/upload">Upload Document</Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<FileText />} label="Documents" value={data.totalDocuments.toString()} detail={`${typeRows.length} active file types`} />
        <Stat icon={<HardDrive />} label="Storage Used" value={formatBytes(data.totalStorageUsed)} detail={`${formatBytes(averageSize)} average size`} />
        <Stat icon={<Star />} label="Favorites" value={data.favoriteDocuments.length.toString()} detail={data.favoriteDocuments[0]?.displayName || 'No favorites yet'} />
        <Stat icon={<Clock3 />} label="Last Login" value={formatDate(data.lastLoginAt)} detail={latestUpload ? `Latest upload ${formatDate(latestUpload.uploadedAt)}` : 'No uploads yet'} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="page-panel min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="panel-title">File Type Bar Chart</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">Document count by file type with storage details.</p>
            </div>
            <span className="document-type-pill">{largestType ? `${largestType.type} leads` : 'Empty vault'}</span>
          </div>
          <div className="h-[320px] min-w-0">
            {typeRows.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeRows} layout="vertical" margin={{ top: 12, right: 18, bottom: 16, left: 18 }}>
                  <XAxis type="number" dataKey="count" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <YAxis type="category" dataKey="type" width={58} tickLine={false} axisLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 900 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} content={<BarTooltip />} />
                  <Bar dataKey="count" fill="#0891b2" radius={[0, 8, 8, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<Archive size={38} />} title="No document types yet" />
            )}
          </div>
        </div>

        <div className="page-panel">
          <h2 className="panel-title">Storage Insights</h2>
          <div className="mt-4 grid gap-3">
            <Insight icon={<Layers3 size={18} />} label="Most common type" value={largestType ? `${largestType.type} (${largestType.count})` : 'None'} />
            <Insight icon={<Database size={18} />} label="Largest file" value={largestFile ? `${largestFile.displayName} (${formatBytes(largestFile.fileSize)})` : 'None'} />
            <Insight icon={<UploadCloud size={18} />} label="Recent upload" value={latestUpload ? `${latestUpload.displayName} (${formatDate(latestUpload.uploadedAt)})` : 'None'} />
          </div>
          <div className="mt-5 grid gap-3">
            {typeRows.map((row) => <TypeRow key={row.type} row={row} />)}
            {typeRows.length === 0 && <p className="text-sm font-semibold text-slate-500">Upload documents to see storage distribution.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent Uploads" items={data.recentUploads} emptyTitle="No recent uploads." />
        <Panel title="Largest Files" items={data.largestDocuments} emptyTitle="No stored files." />
        <Panel title="Last Downloaded" items={data.lastDownloadedDocuments} emptyTitle="No downloads yet." />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Favorites" items={data.favoriteDocuments} emptyTitle="No favorites yet." />
        <div className="page-panel">
          <h2 className="panel-title">Vault Health</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <HealthTile label="Previewable" value={data.recentUploads.filter((doc) => doc.canPreview).length.toString()} detail="recent files" />
            <HealthTile label="Archived" value={(data.documentsByType.zip || 0).toString()} detail="zip files" />
            <HealthTile label="Office Docs" value={((data.documentsByType.doc || 0) + (data.documentsByType.docx || 0) + (data.documentsByType.xls || 0) + (data.documentsByType.xlsx || 0)).toString()} detail="word and sheet files" />
            <HealthTile label="Downloads" value={data.lastDownloadedDocuments.length.toString()} detail="recent activity" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="stat-card">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className="mt-1 block truncate text-xs font-bold text-slate-500">{detail}</small>
    </div>
  );
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { type: string; count: number; storage: number; share: number } }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-xl">
      <strong>{row.type}</strong>
      <p className="mt-1 font-bold text-slate-600">{row.count} documents</p>
      <p className="font-bold text-slate-600">{formatBytes(row.storage)} storage</p>
      <p className="font-bold text-slate-600">{row.share}% of vault</p>
    </div>
  );
}

function Insight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-slate-50 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-cyan-700">{icon}</span>
      <div className="min-w-0">
        <span className="text-xs font-black uppercase text-slate-500">{label}</span>
        <strong className="block truncate text-sm text-slate-900">{value}</strong>
      </div>
    </div>
  );
}

function TypeRow({ row }: { row: { type: string; count: number; storage: number; share: number } }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm font-black">
        <span>{row.type}</span>
        <span>{row.count} files / {formatBytes(row.storage)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full rounded-full bg-cyan-600" style={{ width: `${Math.max(row.share, row.count > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, items, emptyTitle }: { title: string; items: DocumentItem[]; emptyTitle: string }) {
  return (
    <div className="page-panel min-w-0">
      <h2 className="panel-title">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.length === 0 && <p className="text-sm font-semibold text-slate-500">{emptyTitle}</p>}
        {items.map((item) => (
          <Link key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold" to={`/documents/${item.id}`}>
            <span className="min-w-0 truncate">{item.displayName}</span>
            <span className="shrink-0 text-slate-500">{item.fileExtension.toUpperCase()} / {formatBytes(item.fileSize)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HealthTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <strong className="mt-2 block text-2xl font-black text-slate-950">{value}</strong>
      <small className="font-bold text-slate-500">{detail}</small>
    </div>
  );
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-slate-500">
      <div>
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl bg-slate-50 text-cyan-700">{icon}</div>
        <strong>{title}</strong>
      </div>
    </div>
  );
}
