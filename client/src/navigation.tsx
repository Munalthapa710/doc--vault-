import { FileArchive, Gauge, Settings, UploadCloud } from 'lucide-react';

export const navGroups = [
  {
    label: 'Vault',
    items: [
      { path: '/', title: 'Dashboard', icon: Gauge },
      { path: '/documents', title: 'Documents', icon: FileArchive },
      { path: '/documents/upload', title: 'Upload', icon: UploadCloud }
    ]
  },
  {
    label: 'Security',
    items: [
      { path: '/settings', title: 'Settings', icon: Settings }
    ]
  }
];
