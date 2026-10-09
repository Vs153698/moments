/**
 * Session state (F7.1 / KAN-109, C1.3 / KAN-113): stores the rotating token
 * pair returned by social and OTP sign-in. The auth gate reads access token
 * presence; refresh token persistence lets the app rotate on expiry.
 */
import { useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "moments-session" });
const ACCESS_TOKEN_KEY = "access-token";
const REFRESH_TOKEN_KEY = "refresh-token";

export type SessionStatus = "loading" | "signedIn" | "signedOut";

export function getAccessToken(): string | undefined {
  return storage.getString(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return storage.getString(REFRESH_TOKEN_KEY);
}

export function setSession(accessToken: string, refreshToken: string): void {
  storage.set(ACCESS_TOKEN_KEY, accessToken);
  storage.set(REFRESH_TOKEN_KEY, refreshToken);
}

export function signOut(): void {
  storage.delete(ACCESS_TOKEN_KEY);
  storage.delete(REFRESH_TOKEN_KEY);
}

export function useSession(): { status: SessionStatus; accessToken?: string; refreshToken?: string } {
  const [state, setState] = useState<{ status: SessionStatus; accessToken?: string; refreshToken?: string }>({
    status: "loading",
  });
  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    setState(
      accessToken && refreshToken
        ? { status: "signedIn", accessToken, refreshToken }
        : { status: "signedOut" },
    );
  }, []);
  return state;
}
