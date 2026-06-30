export type AppearanceSettings = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  sidebarColor: string;
};

export const defaultAppearance: AppearanceSettings = {
  primaryColor: '#0891b2',
  backgroundColor: '#f6f8fc',
  textColor: '#0f172a',
  sidebarColor: '#edf7fb'
};

const storageKey = 'personalVault.appearance';

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export const loadAppearance = (): AppearanceSettings => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultAppearance;
    const parsed = JSON.parse(saved) as Partial<AppearanceSettings>;
    return {
      primaryColor: isHexColor(parsed.primaryColor || '') ? parsed.primaryColor! : defaultAppearance.primaryColor,
      backgroundColor: isHexColor(parsed.backgroundColor || '') ? parsed.backgroundColor! : defaultAppearance.backgroundColor,
      textColor: isHexColor(parsed.textColor || '') ? parsed.textColor! : defaultAppearance.textColor,
      sidebarColor: isHexColor(parsed.sidebarColor || '') ? parsed.sidebarColor! : defaultAppearance.sidebarColor
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
};

export const applyStoredAppearance = () => {
  applyAppearance(loadAppearance());
};
