// Types pour Cloudflare Workers
export interface DurableObjectState {
  storage: DurableObjectStorage;
  blockConcurrencyWhile(callback: () => Promise<void>): Promise<void>;
  id: DurableObjectId;
  waitUntil(promise: Promise<any>): void;
}

export interface DurableObjectStorage {
  get<T = any>(key: string): Promise<T | undefined>;
  get<T = any>(keys: string[]): Promise<Map<string, T>>;
  put<T>(key: string, value: T): Promise<void>;
  put<T>(entries: Record<string, T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  list(
    options?: DurableObjectStorageListOptions
  ): Promise<Map<string, unknown>>;
  transaction<T>(closure: () => Promise<T>): Promise<T>;
}

export interface DurableObjectStorageListOptions {
  prefix?: string;
  start?: string;
  end?: string;
  reverse?: boolean;
  limit?: number;
}

export interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
  name?: string;
}

// Types pour les erreurs
export class DurableObjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DurableObjectError";
  }
}

export class DurableObjectStorageError extends DurableObjectError {
  constructor(message: string) {
    super(message);
    this.name = "DurableObjectStorageError";
  }
}

export class DurableObjectStateError extends DurableObjectError {
  constructor(message: string) {
    super(message);
    this.name = "DurableObjectStateError";
  }
}
