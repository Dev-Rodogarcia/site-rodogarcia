import { storagePaths } from "../config/storagePaths.js";
import type { UserRecord } from "../types/auth.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

interface UsersStore {
  users: UserRecord[];
}

function readUsersFile(): UsersStore {
  const data = readJsonFile<UsersStore>(storagePaths.users, { users: [] });
  return { users: Array.isArray(data.users) ? data.users : [] };
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
  findById(id: string): UserRecord | null {
    return readUsersFile().users.find((user) => user.id === id) ?? null;
  },
  create(user: UserRecord): UserRecord {
    const data = readUsersFile();
    data.users.push(user);
    writeUsersFile(data);
    return user;
  },
  hasAny(): boolean {
    return readUsersFile().users.length > 0;
  },
};
