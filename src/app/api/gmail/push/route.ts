import { OAuth2Client } from "google-auth-library";

import { getAccessTokenFromRefreshToken } from "@/features/auth/server/refresh-google-access-token";
import {
  findByEmail,
  updateHistoryId,
} from "@/features/gmail/server/gmail-sync.repository";
import {
  GmailApiError,
  getMessageMetadata,
  getProfile,
  listHistory,
} from "@/features/gmail/services/gmail-service";
import { publish } from "@/server/realtime/inbox-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const oauthClient = new OAuth2Client();

interface PubSubPushBody {
  message?: {
    data?: string;
  };
}

interface GmailNotification {
  emailAddress?: string;
  historyId?: string | number;
}

async function isVerifiedPubSubRequest(request: Request): Promise<boolean> {
  const audience = process.env.GMAIL_PUSH_AUDIENCE;
  const serviceAccount = process.env.GMAIL_PUSH_SA_EMAIL;

  if (!audience || !serviceAccount) {
    console.error(
      "[gmail-push] GMAIL_PUSH_AUDIENCE / GMAIL_PUSH_SA_EMAIL are not configured.",
    );
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return false;
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience,
    });
    const payload = ticket.getPayload();
    return Boolean(
      payload && payload.email === serviceAccount && payload.email_verified,
    );
  } catch (error) {
    console.error("[gmail-push] OIDC verification failed:", error);
    return false;
  }
}

function decodeNotification(body: PubSubPushBody): GmailNotification | null {
  const data = body.message?.data;
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(data, "base64").toString("utf8"),
    ) as GmailNotification;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  console.log("[realtime] push: request received"); // TEMP DIAGNOSTIC

  if (!(await isVerifiedPubSubRequest(request))) {
    console.warn("[realtime] push: OIDC/auth check failed -> 401"); // TEMP DIAGNOSTIC
    return new Response("Unauthorized", { status: 401 });
  }

  let body: PubSubPushBody;
  try {
    body = (await request.json()) as PubSubPushBody;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const notification = decodeNotification(body);
  const emailAddress = notification?.emailAddress;

  console.log(
    `[realtime] push: decoded notification email=${emailAddress ?? "none"} historyId=${notification?.historyId ?? "none"}`,
  ); // TEMP DIAGNOSTIC

  if (!emailAddress) {
    return new Response("Bad Request", { status: 400 });
  }

  const record = await findByEmail(emailAddress);
  if (!record) {
    console.warn(
      `[realtime] push: no GmailSync record for ${emailAddress} (ack + drop)`,
    ); // TEMP DIAGNOSTIC
    // Unknown mailbox — ack so Pub/Sub stops redelivering.
    return new Response(null, { status: 204 });
  }

  // No baseline yet: adopt the incoming historyId and wait for the next change.
  if (!record.historyId) {
    if (notification?.historyId != null) {
      await updateHistoryId(emailAddress, String(notification.historyId));
    }
    return new Response(null, { status: 204 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessTokenFromRefreshToken(record.refreshToken);
  } catch (error) {
    console.error(`[gmail-push] token mint failed for ${emailAddress}:`, error);
    return new Response("Retry", { status: 500 });
  }

  let history;
  try {
    history = await listHistory(accessToken, record.historyId);
  } catch (error) {
    // Too-old historyId (history gap): reset the baseline and ack.
    if (error instanceof GmailApiError && error.status === 404) {
      try {
        const profile = await getProfile(accessToken);
        await updateHistoryId(emailAddress, profile.historyId);
      } catch (resetError) {
        console.error(
          `[gmail-push] baseline reset failed for ${emailAddress}:`,
          resetError,
        );
      }
      return new Response(null, { status: 204 });
    }

    console.error(
      `[gmail-push] history.list failed for ${emailAddress}:`,
      error,
    );
    return new Response("Retry", { status: 500 });
  }

  if (history.addedMessages.length > 0) {
    const newest = history.addedMessages[history.addedMessages.length - 1];

    try {
      const metadata = await getMessageMetadata(accessToken, newest.id);
      await updateHistoryId(emailAddress, history.historyId);

      console.log(
        `[realtime] push: publishing inbox-changed email=${emailAddress} thread=${metadata.threadId}`,
      ); // TEMP DIAGNOSTIC

      publish(emailAddress, {
        type: "inbox-changed",
        threadId: metadata.threadId,
        sender: metadata.sender,
        subject: metadata.subject,
      });

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error(
        `[gmail-push] metadata/publish failed for ${emailAddress}:`,
        error,
      );
      return new Response("Retry", { status: 500 });
    }
  }

  console.log(
    `[realtime] push: history had no added messages for ${emailAddress} (nothing to publish)`,
  ); // TEMP DIAGNOSTIC
  await updateHistoryId(emailAddress, history.historyId);

  return new Response(null, { status: 204 });
}
