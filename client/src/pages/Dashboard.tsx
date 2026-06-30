import { useQuery } from '@tanstack/react-query';
import { FileText, HardDrive, Star, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';

const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
  if (isLoading) return <div className="page-panel">Loading dashboard...</div>;
  const summary = data!;
  return (
    <div className="dashboard-shell">
      <section className="page-header">
        <div><span className="eyebrow">Secure storage</span><h1>Document Dashboard</h1><p>Your private vault activity and storage overview.</p></div>
        <Link className="btn-primary" to="/documents/upload">Upload Document</Link>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <Stat icon={<FileText />} label="Documents" value={summary.totalDocuments.toString()} />
        <Stat icon={<HardDrive />} label="Storage Used" value={formatBytes(summary.totalStorageUsed)} />
        <Stat icon={<Star />} label="Favorites" value={summary.favoriteDocuments.length.toString()} />
        <Stat icon={<ShieldCheck />} label="Last Login" value={summary.lastLoginAt ? new Date(summary.lastLoginAt).toLocaleDateString() : 'New'} />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Recent Uploads" items={summary.recentUploads} />
        <Panel title="Favorites" items={summary.favoriteDocuments} />
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="stat-card"><div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700">{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}

function Panel({ title, items }: { title: string; items: Array<{ id: string; displayName: string; fileExtension: string; fileSize: number }> }) {
  return (
    <div className="page-panel">
      <h2 className="panel-title">{title}</h2>
      <div className="grid gap-2">
        {items.length === 0 && <p className="text-sm font-semibold text-slate-500">No documents yet.</p>}
        {items.map((item) => <Link key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm font-bold" to={`/documents/${item.id}`}><span>{item.displayName}</span><span>{item.fileExtension.toUpperCase()} · {formatBytes(item.fileSize)}</span></Link>)}
      </div>
    </div>
  );
}
