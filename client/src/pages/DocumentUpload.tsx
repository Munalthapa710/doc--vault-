import { DragEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentApi } from '../api';

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const pick = (files: FileList | null) => setFile(files?.[0] || null);
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); pick(event.dataTransfer.files); };
  const upload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const doc = await documentApi.upload(file);
      toast.success('Document uploaded');
      navigate(`/documents/${doc.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid gap-5">
      <section className="page-header"><div><span className="eyebrow">Cloudinary private storage</span><h1>Upload Document</h1><p>Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, TXT.</p></div></section>
      <section className="page-panel">
        <div onDragOver={(e) => e.preventDefault()} onDrop={drop} className="grid min-h-72 place-items-center rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/50 p-8 text-center">
          <div>
            <UploadCloud className="mx-auto mb-4 text-cyan-700" size={42} />
            <h2 className="text-xl font-black">Drop a private document here</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">{file ? `${file.name} · ${(file.size / 1048576).toFixed(2)} MB` : 'or select one from your device'}</p>
            <input className="mt-5" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => pick(e.target.files)} />
          </div>
        </div>
        <button className="btn-primary mt-5" disabled={!file || loading} onClick={upload}>{loading ? 'Uploading...' : 'Upload Securely'}</button>
      </section>
    </div>
  );
}
