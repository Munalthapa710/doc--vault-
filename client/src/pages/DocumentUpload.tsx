import { DragEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentApi } from '../api';

const formatFileSize = (bytes: number) => `${(bytes / 1048576).toFixed(2)} MB`;

export function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const navigate = useNavigate();

  const pick = (fileList: FileList | null) => setFiles(Array.from(fileList || []));
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); pick(event.dataTransfer.files); };
  const removeFile = (indexToRemove: number) => setFiles((selectedFiles) => selectedFiles.filter((_, index) => index !== indexToRemove));

  const upload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setUploadedCount(0);
    try {
      const uploadedDocs = [];
      for (const selectedFile of files) {
        uploadedDocs.push(await documentApi.upload(selectedFile));
        setUploadedCount(uploadedDocs.length);
      }
      toast.success(files.length === 1 ? 'Document uploaded' : `${files.length} files uploaded`);
      navigate(files.length === 1 ? `/documents/${uploadedDocs[0].id}` : '/documents');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="upload-page grid min-w-0 gap-5 overflow-hidden">
      <section className="page-header">
        <div>
          <span className="eyebrow">Cloudinary private storage</span>
          <h1>Upload Document</h1>
          <p>Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, TXT. You can upload multiple files at once.</p>
        </div>
      </section>
      <section className="page-panel min-w-0 overflow-hidden">
        <div onDragOver={(e) => e.preventDefault()} onDrop={drop} className="upload-drop-zone grid min-h-72 min-w-0 place-items-center rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/50 p-8 text-center">
          <div className="min-w-0 max-w-full">
            <UploadCloud className="mx-auto mb-4 text-cyan-700" size={42} />
            <h2 className="text-xl font-black">Drop private documents or photos here</h2>
            <p className="mx-auto mt-2 max-w-full break-words text-sm font-semibold text-slate-500">
              {files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'or select files from your device'}
            </p>
            <label className="btn-secondary upload-file-label mt-5 cursor-pointer">
              Choose Files
              <input className="upload-file-input" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt" multiple onChange={(e) => pick(e.target.files)} />
            </label>
          </div>
        </div>
        {files.length > 0 && (
          <div className="mt-5 grid gap-2">
            {files.map((selectedFile, index) => (
              <div key={`${selectedFile.name}-${selectedFile.lastModified}-${index}`} className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <span className="min-w-0 truncate">{selectedFile.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</span>
                  <button className="icon-button h-8 w-8" type="button" disabled={loading} onClick={() => removeFile(index)} aria-label={`Remove ${selectedFile.name}`}>
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button className="btn-primary mt-5 w-full sm:w-auto" disabled={files.length === 0 || loading} onClick={upload}>
          {loading ? `Uploading ${uploadedCount}/${files.length}` : 'Upload Securely'}
        </button>
      </section>
    </div>
  );
}
