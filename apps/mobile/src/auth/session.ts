/**
 * Session state (F7.1 / KAN-109): the auth gate. The dev OTP login (KAN-112)
 * issues HMAC-signed tokens; here we only track presence + expose sign-in/out.
 * Real refresh/rotation lands with C1.3 (KAN-113).
 */
import { useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "moments-session" });
export const SESSION_KEY = "session-token";

export type SessionStatus = "loading" | "signedIn" | "signedOut";

export function getSessionToken(): string | undefined {
  return storage.getString(SESSION_KEY);
}

export function signIn(token: string): void {
  storage.set(SESSION_KEY, token);
}

export function signOut(): void {
  storage.delete(SESSION_KEY);
}

export function useSession(): { status: SessionStatus; token?: string } {
  const [state, setState] = useState<{ status: SessionStatus; token?: string }>({ status: "loading" });
  useEffect(() => {
    const token = getSessionToken();
    setState(token ? { status: "signedIn", token } : { status: "signedOut" });
  }, []);
  return state;
}
