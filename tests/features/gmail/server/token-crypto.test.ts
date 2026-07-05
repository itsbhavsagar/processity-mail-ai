import { decryptToken, encryptToken } from "@/features/gmail/server/token-crypto";

// A deterministic, valid 32-byte base64 key for the round-trip tests.
const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

describe("token-crypto", () => {
  const originalKey = process.env.TOKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
  });

  it("round-trips a token back to its original plaintext", () => {
    const plaintext = "ya29.super-secret-refresh-token";
    expect(decryptToken(encryptToken(plaintext))).toBe(plaintext);
  });

  it("uses a random IV so repeated encryptions differ but still decrypt equally", () => {
    const plaintext = "same-token";
    const a = encryptToken(plaintext);
    const b = encryptToken(plaintext);

    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe(plaintext);
    expect(decryptToken(b)).toBe(plaintext);
  });

  it("throws when the encryption key is missing or the wrong length", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encryptToken("x")).toThrow(/TOKEN_ENCRYPTION_KEY is not configured/);

    process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(() => encryptToken("x")).toThrow(/32-byte key/);
  });

  it("rejects a tampered payload via the GCM auth tag", () => {
    const payload = encryptToken("integrity-matters");
    const bytes = Buffer.from(payload, "base64");
    bytes[bytes.length - 1] ^= 0xff; // flip a byte of the ciphertext

    expect(() => decryptToken(bytes.toString("base64"))).toThrow();
  });
});
