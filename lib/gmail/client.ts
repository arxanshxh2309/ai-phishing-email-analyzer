import { google } from "googleapis";
import { getRefreshToken } from "./tokenStore";

/** Thrown when the stored Gmail connection is missing or has expired/been revoked. */
export class GmailAuthError extends Error {}

export async function getGmailClient(userId: string) {
  const refreshToken = await getRefreshToken(userId);
  if (!refreshToken) {
    throw new GmailAuthError("No Gmail connection found. Please connect Gmail first.");
  }

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    // Eagerly mint an access token so an expired/revoked refresh token
    // (Google's Testing-mode tokens expire after 7 days) surfaces here as a
    // clear reconnect prompt, rather than failing deep inside a later call.
    await oauth2Client.getAccessToken();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("invalid_grant")) {
      throw new GmailAuthError("Your Gmail connection has expired. Please reconnect.");
    }
    throw err;
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
}
