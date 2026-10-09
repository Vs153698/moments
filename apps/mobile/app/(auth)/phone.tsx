import { router } from "expo-router";
import { useEffect, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest } from "expo-auth-session";
import {
  ApiClient,
  ApiClientError,
  useAppleSignIn,
  useGoogleSignIn,
  useRequestOtp,
  type AppleSignInResponse,
  type GoogleSignInResponse,
} from "@moments/api-client";
import { SignInScreen } from "../../src/screens/SignInScreen";
import { consumePendingRoute } from "../../src/auth/pending-route";
import { setSession } from "../../src/auth/session";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

function completeSocialSignIn(result: GoogleSignInResponse | AppleSignInResponse) {
  if (!result.accessToken || !result.refreshToken) {
    throw new Error("Invalid response from server.");
  }
  setSession(result.accessToken, result.refreshToken);
  const pending = consumePendingRoute();
  if (pending) {
    router.replace(pending as never);
    return;
  }
  if (result.isNewUser) {
    router.replace("/(auth)/profile-setup");
    return;
  }
  router.replace("/(tabs)");
}

function isAppleCancelError(error: unknown): boolean {
  const code = (error as { code?: string }).code;
  return code === "ERR_CANCELED" || code === "ERR_REQUEST_CANCELED";
}

/**
 * S2a Sign in / Sign up route (KAN-33): wires the screen to real Google
 * (expo-auth-session), Apple (expo-apple-authentication) and phone OTP APIs.
 */
export default function PhoneScreen() {
  const client = new ApiClient(process.env.EXPO_PUBLIC_API_URL ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | "phone" | null>(null);
  const [restoreSheetVisible, setRestoreSheetVisible] = useState(false);

  const requestOtp = useRequestOtp(client);
  const googleSignIn = useGoogleSignIn(client);
  const appleSignIn = useAppleSignIn(client);

  const [, googleResponse, promptGoogleAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      redirectUri: "moments:/oauth2redirect/google",
      scopes: ["openid", "profile", "email"],
      responseType: "id_token",
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "success" && googleResponse.params.id_token) {
      setLoadingProvider("google");
      googleSignIn
        .mutateAsync({ idToken: googleResponse.params.id_token })
        .then(completeSocialSignIn)
        .catch(handleApiError)
        .finally(() => setLoadingProvider(null));
      return;
    }
    if (googleResponse.type === "cancel" || googleResponse.type === "dismiss") {
      setLoadingProvider(null);
      return;
    }
    setError("Google sign-in failed. Please try again.");
    setLoadingProvider(null);
  }, [googleResponse, googleSignIn]);

  const handleGoogle = async () => {
    setError(null);
    setLoadingProvider("google");
    try {
      await promptGoogleAsync();
      // Result is handled in the useEffect above.
    } catch (err) {
      setLoadingProvider(null);
      handleApiError(err);
    }
  };

  const handleApple = async () => {
    setError(null);
    setLoadingProvider("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const result = await appleSignIn.mutateAsync({ idToken: credential.identityToken });
        completeSocialSignIn(result);
      }
    } catch (err) {
      if (!isAppleCancelError(err)) {
        handleApiError(err);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSendOtp = async (phone: string) => {
    setError(null);
    setLoadingProvider("phone");
    try {
      await requestOtp.mutateAsync({ phone });
      router.push({ pathname: "/(auth)/otp", params: { phone } });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  function handleApiError(err: unknown) {
    if (err instanceof ApiClientError) {
      if (err.body.code === "ACCOUNT_SUSPENDED") {
        router.push("/(auth)/support");
        return;
      }
      if (err.body.code === "ACCOUNT_DELETED") {
        setRestoreSheetVisible(true);
        return;
      }
      setError(err.body.message);
      return;
    }
    if (err instanceof Error) {
      setError(err.message);
      return;
    }
    setError("Something went wrong. Please try again.");
  }

  return (
    <SignInScreen
      onContinueWithGoogle={handleGoogle}
      onContinueWithApple={handleApple}
      onSendOtp={handleSendOtp}
      loadingProvider={loadingProvider}
      error={error}
      restoreSheetVisible={restoreSheetVisible}
      onCloseRestoreSheet={() => setRestoreSheetVisible(false)}
      onRestoreAccount={() => router.push("/(auth)/support")}
    />
  );
}
