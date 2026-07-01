import { RotateCcw, Save, SwatchBook } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { defaultAppearance, loadAppearance, resetAppearance, saveAppearance, type AppearanceSettings } from '../theme';

const fields: Array<{ key: Exclude<keyof AppearanceSettings, 'fontFamily'>; label: string; description: string }> = [
  { key: 'primaryColor', label: 'Theme Color', description: 'Buttons, active menu items, highlights, and chart accents.' },
  { key: 'backgroundColor', label: 'Page Background', description: 'Main workspace background color.' },
  { key: 'textColor', label: 'Text Color', description: 'Primary readable text across the app.' },
  { key: 'sidebarColor', label: 'Sidebar Color', description: 'Left navigation background color.' }
];

const presets = ['#0891b2', '#0f766e', '#7c3aed', '#be123c', '#4338ca', '#15803d'];
const fontOptions = [
  { value: 'system', label: 'System Sans' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'sf-pro', label: 'San Francisco / SF Pro' },
  { value: 'playfair-display', label: 'Playfair Display' },
  { value: 'dm-sans', label: 'DM Sans' },
  { value: 'karla', label: 'Karla' },
  { value: 'overpass', label: 'Overpass' },
  { value: 'fira-sans-condensed', label: 'Fira Sans Condensed' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' }
];

const fontPreviewStack: Record<string, string> = {
  system: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, ui-sans-serif, system-ui, sans-serif',
  roboto: '"Roboto", Arial, sans-serif',
  'sf-pro': '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, ui-sans-serif, system-ui, sans-serif',
  'playfair-display': '"Playfair Display", Georgia, "Times New Roman", serif',
  'dm-sans': '"DM Sans", "Segoe UI", Arial, sans-serif',
  karla: '"Karla", "Segoe UI", Arial, sans-serif',
  overpass: '"Overpass", "Segoe UI", Arial, sans-serif',
  'fira-sans-condensed': '"Fira Sans Condensed", "Arial Narrow", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
};

export function AppearanceSettings() {
  const [settings, setSettings] = useState<AppearanceSettings>(() => loadAppearance());

  const update = (key: keyof AppearanceSettings, value: string) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveAppearance(next);
  };

  const save = () => {
    saveAppearance(settings);
    toast.success('Theme updated');
  };

  const reset = () => {
    resetAppearance();
    setSettings(defaultAppearance);
    toast.success('Theme reset');
  };

  return (
    <section className="page-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Appearance</span>
          <h2 className="panel-title mb-1">Website Theme</h2>
          <p className="text-sm text-slate-500">Change the main colors used by the website interface.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" type="button" onClick={reset}>
            <RotateCcw size={16} />
            Reset
          </button>
          <button className="btn-primary" type="button" onClick={save}>
            <Save size={16} />
            Save Theme
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="block text-sm font-black text-slate-700">{field.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{field.description}</span>
              <div className="mt-3 flex items-center gap-3">
                <input
                  className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  type="color"
                  value={settings[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                />
                <input
                  className="form-field"
                  value={settings[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  maxLength={7}
                />
              </div>
            </label>
          ))}
          <label className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="block text-sm font-black text-slate-700">Text Font</span>
            <span className="mt-1 block text-xs text-slate-500">Change the font used across the vault interface.</span>
            <select className="form-field mt-3" value={settings.fontFamily} onChange={(event) => update('fontFamily', event.target.value)}>
              {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <SwatchBook size={18} />
            <strong>Quick Theme Colors</strong>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {presets.map((color) => (
              <button
                key={color}
                className="h-10 rounded-xl border border-slate-200"
                type="button"
                style={{ background: color }}
                title={color}
                onClick={() => update('primaryColor', color)}
              />
            ))}
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="p-4" style={{ background: settings.sidebarColor }}>
              <div className="mb-3 flex items-center gap-2">
                <img className="h-9 w-9 object-contain" src="/vaultlogo.png" alt="Personal Vault" />
                <strong style={{ color: settings.textColor }}>Personal Vault</strong>
              </div>
              <div className="rounded-lg px-3 py-2 text-sm font-black text-white" style={{ background: settings.primaryColor }}>Active Menu</div>
            </div>
            <div
              className="p-4"
              style={{
                background: settings.backgroundColor,
                color: settings.textColor,
                fontFamily: fontPreviewStack[settings.fontFamily] || fontPreviewStack.system
              }}
            >
              <strong>Preview Card</strong>
              <p className="mt-1 text-sm opacity-75">This is how your selected colors feel in the app.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
