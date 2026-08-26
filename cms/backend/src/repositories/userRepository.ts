import { storagePaths } from "../config/storagePaths.js";
import type { UserRecord } from "../types/auth.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

interface UsersStore {
  users: UserRecord[];
}

function readUsersFile(): UsersStore {
  const data = readJsonFile<UsersStore>(storagePaths.users, { users: [] });
  if (!data || !Array.isArray(data.users)) {
    throw new Error("Armazenamento de usuários inválido.");
  }

  const users = data.users;
  if (!users.some((user) => user.isOwner)) {
    const firstAdmin = users
      .filter((user) => user.role === "admin" && user.active !== false)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (firstAdmin) firstAdmin.isOwner = true;
  }
  return { users };
}

function writeUsersFile(data: UsersStore): void {
  writeJsonFile(storagePaths.users, data);
}

export const userRepository = {
  list(): UserRecord[] {
    return readUsersFile().users;
  },
  findByEmail(email: string): UserRecord | null {
    return (
      readUsersFile().users.find(
        (user) => user.email === email && user.active !== false
      ) ?? null
    );
  },
  findAnyByEmail(email: string): UserRecord | null {
    return readUsersFile().users.find((user) => user.email === email) ?? null;
  },
  findById(id: string): UserRecord | null {
    return readUsersFile().users.find((user) => user.id === id) ?? null;
  },
  create(user: UserRecord): UserRecord {
    const data = readUsersFile();
    data.users.push(user);
    writeUsersFile(data);
    return user;
  },
  update(id: string, patch: Partial<UserRecord>): UserRecord | null {
    const data = readUsersFile();
    const index = data.users.findIndex((user) => user.id === id);
    if (index < 0) return null;
    const next = { ...data.users[index]!, ...patch };
    data.users[index] = next;
    writeUsersFile(data);
    return next;
  },
  delete(id: string): boolean {
    const data = readUsersFile();
    const nextUsers = data.users.filter((user) => user.id !== id);
    if (nextUsers.length === data.users.length) return false;
    writeUsersFile({ users: nextUsers });
    return true;
  },
  hasAny(): boolean {
    return readUsersFile().users.length > 0;
  },
};
