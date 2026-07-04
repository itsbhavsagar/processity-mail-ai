import type { JWT } from "next-auth/jwt";

interface GoogleRefreshResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

export async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
  });

  const refreshed = (await response.json()) as GoogleRefreshResponse;

  if (!response.ok || !refreshed.access_token) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  return {
    ...token,
    accessToken: refreshed.access_token,
    accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
    error: undefined,
  };
}

export async function getAccessTokenFromRefreshToken(
  refreshToken: string,
): Promise<string> {
  const result = await refreshGoogleAccessToken({ refreshToken } as JWT);

  if (result.error || !result.accessToken) {
    throw new Error("Failed to obtain an access token from the refresh token.");
  }

  return result.accessToken;
}
