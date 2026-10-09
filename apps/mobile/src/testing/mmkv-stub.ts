/** In-memory MMKV stand-in for vitest (mirrors the surface app code uses). */
class FakeMMKV {
  private store = new Map<string, string | boolean | number>();

  getString(key: string): string | undefined {
    const value = this.store.get(key);
    return typeof value === "string" ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key);
    return typeof value === "boolean" ? value : undefined;
  }

  set(key: string, value: string | boolean | number): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

export const MMKV = FakeMMKV;
export type MMKVInterface = FakeMMKV;
