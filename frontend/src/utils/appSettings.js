const SETTINGS_STORAGE_KEY = 'pos_app_settings';

export const DEFAULT_APP_SETTINGS = {
  gstEnabled: true,
  gstRate: 18,
  restaurantName: 'AI POS Restaurant',
  restaurantPhone: '+91-0000000000',
};

export function loadAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_APP_SETTINGS };
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      gstEnabled: typeof parsed?.gstEnabled === 'boolean'
        ? parsed.gstEnabled
        : DEFAULT_APP_SETTINGS.gstEnabled,
      gstRate: Number.isFinite(Number(parsed?.gstRate))
        ? Number(parsed.gstRate)
        : DEFAULT_APP_SETTINGS.gstRate,
    };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings) {
  const normalized = {
    ...DEFAULT_APP_SETTINGS,
    ...settings,
    gstEnabled: typeof settings?.gstEnabled === 'boolean'
      ? settings.gstEnabled
      : DEFAULT_APP_SETTINGS.gstEnabled,
    gstRate: Number.isFinite(Number(settings?.gstRate)) ? Number(settings.gstRate) : DEFAULT_APP_SETTINGS.gstRate,
  };

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
