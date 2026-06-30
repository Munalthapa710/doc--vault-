import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const dismissedKey = 'personal_vault_install_dismissed';

const isStandalone = () => (
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
);

export function PWAInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(dismissedKey) === 'true');
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
      localStorage.setItem(dismissedKey, 'true');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
    dismiss();
  };

  if (!promptEvent || dismissed || installed) {
    return null;
  }

  return (
    <div className="pwa-install-prompt" role="status">
      <div>
        <strong>Install Aawaran IMS</strong>
        <span>Open faster from your home screen.</span>
      </div>
      <button type="button" className="pwa-install-action" onClick={install}>
        <Download size={16} />
        Install
      </button>
      <button type="button" className="pwa-install-close" onClick={dismiss} aria-label="Dismiss install prompt">
        <X size={16} />
      </button>
    </div>
  );
}
