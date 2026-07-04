import { getAccessTokenFromRefreshToken } from "@/features/auth/server/refresh-google-access-token";
import {
  listExpiring,
  updateHistoryId,
  updateWatchExpiration,
} from "@/features/gmail/server/gmail-sync.repository";
import { watchMailbox } from "@/features/gmail/services/gmail-service";

const RENEW_WINDOW_MS = 24 * 60 * 60 * 1000;

function resolveTopicName(): string {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const topic = process.env.GMAIL_PUBSUB_TOPIC;

  if (!project || !topic) {
    throw new Error(
      "GOOGLE_CLOUD_PROJECT and GMAIL_PUBSUB_TOPIC must be configured.",
    );
  }

  return `projects/${project}/topics/${topic}`;
}

export async function registerWatch(
  email: string,
  accessToken: string,
): Promise<void> {
  const { historyId, expiration } = await watchMailbox(
    accessToken,
    resolveTopicName(),
  );

  await updateHistoryId(email, historyId);
  await updateWatchExpiration(email, expiration);
}

export async function renewExpiringWatches(): Promise<{
  renewed: number;
  failed: number;
}> {
  const rows = await listExpiring(new Date(Date.now() + RENEW_WINDOW_MS));

  let renewed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const accessToken = await getAccessTokenFromRefreshToken(
        row.refreshToken,
      );
      await registerWatch(row.email, accessToken);
      renewed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[gmail-watch] renew failed for ${row.email}:`, error);
    }
  }

  return { renewed, failed };
}
