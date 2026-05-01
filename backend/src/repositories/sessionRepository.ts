import { storagePaths } from "../config/storagePaths.js";
import type { Session } from "../types/auth.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

type SessionStore = Record<string, Session>;

function readStore(): SessionStore {
  return readJsonFile<SessionStore>(storagePaths.sessions, {});
}

function writeStore(store: SessionStore): void {
  writeJsonFile(storagePaths.sessions, store);
}

function pruneExpired(store: SessionStore): SessionStore {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(store).filter(([, session]) => session.expiresAt > now)
  );
}

export const sessionRepository = {
  save(session: Session): void {
    const store = pruneExpired(readStore());
    store[session.id] = session;
    writeStore(store);
  },
  find(id: string): Session | null {
    const store = readStore();
    const session = store[id];
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      delete store[id];
      writeStore(store);
      return null;
    }
    return session;
  },
  delete(id: string): void {
    const store = readStore();
    delete store[id];
    writeStore(store);
  },
};
