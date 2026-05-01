import { storagePaths } from "../config/storagePaths.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

function listRepository<T>(filePath: string) {
  return {
    read(): T[] {
      return readJsonFile<T[]>(filePath, []);
    },
    write(items: T[]): void {
      writeJsonFile(filePath, items);
    },
  };
}

export const contactRepository = listRepository<Record<string, unknown>>(
  storagePaths.contacts
);
export const quoteRepository = listRepository<Record<string, unknown>>(
  storagePaths.quotes
);
export const popupLeadRepository = listRepository<Record<string, unknown>>(
  storagePaths.popupLeads
);
export const popupEventRepository = listRepository<Record<string, unknown>>(
  storagePaths.popupEvents
);
export const leadRepository = listRepository<Record<string, unknown>>(
  storagePaths.leads
);
export const trackingEventRepository = listRepository<Record<string, unknown>>(
  storagePaths.trackingEvents
);
export const auditLogRepository = listRepository<Record<string, unknown>>(
  storagePaths.auditLog
);
export const mediaLibraryRepository = listRepository<Record<string, unknown>>(
  storagePaths.mediaLibrary
);

export const popupConfigRepository = {
  read<T extends Record<string, unknown>>(defaults: T): T {
    return { ...defaults, ...readJsonFile<Partial<T>>(storagePaths.popupConfig, {}) };
  },
  write<T>(config: T): void {
    writeJsonFile(storagePaths.popupConfig, config);
  },
};

export const analyticsRepository = {
  read(): { events: unknown[]; sessions: unknown[] } {
    return readJsonFile<{ events: unknown[]; sessions: unknown[] }>(
      storagePaths.analytics,
      { events: [], sessions: [] }
    );
  },
  write(data: { events: unknown[]; sessions: unknown[] }): void {
    writeJsonFile(storagePaths.analytics, data);
  },
};

export const analyticsConfigRepository = {
  read(): Record<string, unknown> {
    return readJsonFile<Record<string, unknown>>(storagePaths.analyticsConfig, {});
  },
  write(data: Record<string, unknown>): void {
    writeJsonFile(storagePaths.analyticsConfig, data);
  },
};

export const seoSettingsRepository = {
  read<T extends Record<string, unknown>>(defaults: T): T {
    return { ...defaults, ...readJsonFile<Partial<T>>(storagePaths.seoSettings, {}) };
  },
  write<T>(data: T): void {
    writeJsonFile(storagePaths.seoSettings, data);
  },
};

export const consentSettingsRepository = {
  read<T extends Record<string, unknown>>(defaults: T): T {
    return { ...defaults, ...readJsonFile<Partial<T>>(storagePaths.consentSettings, {}) };
  },
  write<T>(data: T): void {
    writeJsonFile(storagePaths.consentSettings, data);
  },
};

export const mediaSlotsRepository = {
  read<T extends Record<string, unknown>>(defaults: T): T {
    return { ...defaults, ...readJsonFile<Partial<T>>(storagePaths.mediaSlots, {}) };
  },
  write<T>(data: T): void {
    writeJsonFile(storagePaths.mediaSlots, data);
  },
};
