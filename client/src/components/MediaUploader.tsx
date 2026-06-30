import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../api';

export function MediaUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'personal-vault');
      return (await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => {
      toast.success('Media uploaded');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Upload failed')
  });

  const uploadFile = (file?: File) => {
    if (file) mutation.mutate(file);
  };

  return (
    <div
      className={`mb-5 grid place-items-center rounded-lg border border-dashed p-8 text-center transition ${dragging ? 'border-slate-950 bg-slate-100 dark:border-white dark:bg-slate-800' : 'border-slate-300 dark:border-slate-700'}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        uploadFile(event.dataTransfer.files[0]);
      }}
    >
      <UploadCloud size={34} className="mb-3 text-saffron" />
      <strong>Drop media here</strong>
      <p className="mt-1 text-sm text-slate-500">Upload product images, invoices, purchase documents, and delivery notes to Cloudinary.</p>
      <button className="btn-secondary mt-4" type="button" onClick={() => inputRef.current?.click()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Uploading...' : 'Choose File'}
      </button>
      <input ref={inputRef} className="hidden" type="file" onChange={(event) => uploadFile(event.target.files?.[0])} />
    </div>
  );
}
