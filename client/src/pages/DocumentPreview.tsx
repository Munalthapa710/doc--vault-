import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { api, documentApi } from '../api';

export function DocumentPreview() {
  const { id = '' } = useParams();
  const { data: doc, isLoading } = useQuery({ queryKey: ['document', id], queryFn: () => documentApi.get(id), enabled: !!id });
  const { data: previewBlob, isLoading: isPreviewLoading, isError: isPreviewError } = useQuery({
    queryKey: ['document-preview', id],
    queryFn: async () => (await api.get(`/documents/${id}/preview`, { responseType: 'blob' })).data as Blob,
    enabled: !!id && !!doc?.canPreview
  });
  const previewUrl = useMemo(() => previewBlob ? URL.createObjectURL(previewBlob) : '', [previewBlob]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);
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
  const isImage = doc.mimeType.startsWith('image/');
  const isPdf = doc.fileExtension === 'pdf';
  const canRenderPreview = (isImage || isPdf) && previewUrl;
  return (
    <div className="document-preview-page grid min-w-0 gap-5 overflow-hidden">
      <section className="page-header document-preview-header">
        <div className="min-w-0">
          <span className="eyebrow">{doc.fileExtension.toUpperCase()}</span>
          <h1>{doc.displayName}</h1>
          <p>{doc.originalFileName}</p>
        </div>
        <div className="document-preview-actions flex gap-2"><button className="btn-secondary" onClick={download}><Download size={17} />Download</button><Link className="btn-secondary" to="/documents">Back</Link></div>
      </section>
      <section className="page-panel document-preview-panel min-h-[520px] min-w-0 overflow-hidden">
        {isPreviewLoading && <div className="grid min-h-96 place-items-center text-sm font-bold text-slate-500">Loading preview...</div>}
        {isPreviewError && <PreviewFallback title="Preview failed" message="Download this file to view it locally." />}
        {!isPreviewLoading && !isPreviewError && isImage && canRenderPreview && <img className="document-preview-image mx-auto max-h-[720px] max-w-full rounded-xl object-contain" src={previewUrl} alt={doc.displayName} />}
        {!isPreviewLoading && !isPreviewError && isPdf && canRenderPreview && <iframe className="h-[720px] w-full rounded-xl border border-slate-200" src={previewUrl} title={doc.displayName} />}
        {!isPreviewLoading && !isPreviewError && !canRenderPreview && <PreviewFallback title="Preview unavailable" message="Download this file to view it locally." />}
      </section>
    </div>
  );
}

function PreviewFallback({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid min-h-96 place-items-center text-center">
      <div>
        <FileText className="mx-auto mb-3 text-cyan-700" size={48} />
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-2 text-sm font-bold text-slate-500">{message}</p>
      </div>
    </div>
  );
}
