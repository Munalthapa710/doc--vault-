export type AppearanceSettings = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
  fontFamily: string;
};

export const defaultAppearance: AppearanceSettings = {
  primaryColor: '#0891b2',
  backgroundColor: '#f6f8fc',
  textColor: '#0f172a',
  sidebarColor: '#edf7fb',
  fontFamily: 'system'
};

const storageKey = 'personalVault.appearance';

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);
const allowedFonts = new Set(['system', 'inter', 'serif', 'mono']);

export const loadAppearance = (): AppearanceSettings => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultAppearance;
    const parsed = JSON.parse(saved) as Partial<AppearanceSettings>;
    return {
      primaryColor: isHexColor(parsed.primaryColor || '') ? parsed.primaryColor! : defaultAppearance.primaryColor,
      backgroundColor: isHexColor(parsed.backgroundColor || '') ? parsed.backgroundColor! : defaultAppearance.backgroundColor,
      textColor: isHexColor(parsed.textColor || '') ? parsed.textColor! : defaultAppearance.textColor,
      sidebarColor: isHexColor(parsed.sidebarColor || '') ? parsed.sidebarColor! : defaultAppearance.sidebarColor,
      fontFamily: allowedFonts.has(parsed.fontFamily || '') ? parsed.fontFamily! : defaultAppearance.fontFamily
    };
  } catch {
    return defaultAppearance;
  }
};

export const saveAppearance = (settings: AppearanceSettings) => {
  localStorage.setItem(storageKey, JSON.stringify(settings));
  applyAppearance(settings);
};

export const resetAppearance = () => {
  localStorage.removeItem(storageKey);
  applyAppearance(defaultAppearance);
};

export const applyAppearance = (settings: AppearanceSettings) => {
  const root = document.documentElement;
  root.style.setProperty('--app-primary', settings.primaryColor);
  root.style.setProperty('--app-background', settings.backgroundColor);
  root.style.setProperty('--app-text', settings.textColor);
  root.style.setProperty('--app-sidebar', settings.sidebarColor);
  root.style.setProperty('--app-font-family', resolveFontFamily(settings.fontFamily));
};

export const applyStoredAppearance = () => {
  applyAppearance(loadAppearance());
};

const resolveFontFamily = (font: string) => {
  if (font === 'inter') return '"Inter", "Segoe UI", Arial, sans-serif';
  if (font === 'serif') return 'Georgia, "Times New Roman", serif';
  if (font === 'mono') return '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
  return '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, ui-sans-serif, system-ui, sans-serif';
};
