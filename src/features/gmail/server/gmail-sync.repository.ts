import type { GmailSync } from "@prisma/client";

import {
  decryptToken,
  encryptToken,
} from "@/features/gmail/server/token-crypto";
import { prisma } from "@/server/db/prisma";

export interface GmailSyncRecord {
  email: string;
  googleSub: string;
  refreshToken: string;
  historyId: string | null;
  watchExpiration: Date | null;
}

function toRecord(row: GmailSync): GmailSyncRecord {
  return {
    email: row.email,
    googleSub: row.googleSub,
    refreshToken: decryptToken(row.refreshTokenEnc),
    historyId: row.historyId,
    watchExpiration: row.watchExpiration,
  };
}

export async function upsertUser(input: {
  email: string;
  googleSub: string;
  refreshToken: string;
}): Promise<void> {
  const refreshTokenEnc = encryptToken(input.refreshToken);

  await prisma.gmailSync.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      googleSub: input.googleSub,
      refreshTokenEnc,
    },
    update: {
      googleSub: input.googleSub,
      refreshTokenEnc,
    },
  });
}

export async function findByEmail(
  email: string,
): Promise<GmailSyncRecord | null> {
  const row = await prisma.gmailSync.findUnique({ where: { email } });
  return row ? toRecord(row) : null;
}

export async function updateHistoryId(
  email: string,
  historyId: string,
): Promise<void> {
  await prisma.gmailSync.update({
    where: { email },
    data: { historyId },
  });
}

export async function updateWatchExpiration(
  email: string,
  watchExpiration: Date,
): Promise<void> {
  await prisma.gmailSync.update({
    where: { email },
    data: { watchExpiration },
  });
}

export async function listExpiring(before: Date): Promise<GmailSyncRecord[]> {
  const rows = await prisma.gmailSync.findMany({
    where: {
      OR: [{ watchExpiration: null }, { watchExpiration: { lte: before } }],
    },
  });

  return rows.map(toRecord);
}
