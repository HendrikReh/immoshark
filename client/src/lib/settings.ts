import type { CsvImportProfile } from "@immoshark/shared";

const PREFIX = "immoshark_";
const PROFILES_KEY = "csv_profiles";

export function getSetting<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setSetting<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getProfiles(): CsvImportProfile[] {
  return getSetting<CsvImportProfile[]>(PROFILES_KEY, []);
}

export function getDefaultProfile(): CsvImportProfile | null {
  return getProfiles().find((p) => p.isDefault) ?? null;
}

export function saveProfile(profile: CsvImportProfile): void {
  const profiles = getProfiles();
  if (profile.isDefault) {
    for (const p of profiles) p.isDefault = false;
  }
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  setSetting(PROFILES_KEY, profiles);
}

export function deleteProfile(id: string): void {
  setSetting(PROFILES_KEY, getProfiles().filter((p) => p.id !== id));
}
