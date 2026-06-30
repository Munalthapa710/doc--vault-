import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { api, documentApi } from '../api';

export function DocumentPreview() {
  const { id = '' } = useParams();
  const { data: doc, isLoading } = useQuery({ queryKey: ['document', id], queryFn: () => documentApi.get(id), enabled: !!id });
  const download = async () => {
    if (!doc) return;
    const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${doc.displayName}.${doc.fileExtension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  if (isLoading || !doc) return <div className="page-panel">Loading document...</div>;
  const previewUrl = documentApi.previewUrl(doc.id);
  const isImage = doc.mimeType.startsWith('image/');
  const isPdf = doc.fileExtension === 'pdf';
  return (
    <div className="grid gap-5">
      <section className="page-header">
        <div><span className="eyebrow">{doc.fileExtension.toUpperCase()}</span><h1>{doc.displayName}</h1><p>{doc.originalFileName}</p></div>
        <div className="flex gap-2"><button className="btn-secondary" onClick={download}><Download size={17} />Download</button><Link className="btn-secondary" to="/documents">Back</Link></div>
      </section>
      <section className="page-panel min-h-[520px]">
        {isImage && <img className="mx-auto max-h-[720px] max-w-full rounded-xl object-contain" src={previewUrl} alt={doc.displayName} />}
        {isPdf && <iframe className="h-[720px] w-full rounded-xl border border-slate-200" src={previewUrl} title={doc.displayName} />}
        {!isImage && !isPdf && <div className="grid min-h-96 place-items-center text-center"><div><FileText className="mx-auto mb-3 text-cyan-700" size={48} /><h2 className="text-xl font-black">Preview unavailable</h2><p className="mt-2 text-sm font-bold text-slate-500">Download this file to view it locally.</p></div></div>}
      </section>
    </div>
  );
}
