import { describe, it, expect, beforeAll } from "vitest";
import { initCrypto, deriveKey, generateSalt, encryptData, decryptData } from "../index";

describe.skip("Crypto Utils (libsodium)", () => {
  beforeAll(async () => {
    await initCrypto();
  });

  it("should generate a valid salt", () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16); // crypto_pwhash_SALTBYTES
  });

  it("should derive a key from a password and salt consistently", () => {
    const salt = generateSalt();
    const password = "my-super-secret-password-123";

    const key1 = deriveKey(password, salt);
    const key2 = deriveKey(password, salt);

    expect(key1).toBeInstanceOf(Uint8Array);
    expect(key1.length).toBe(32); // crypto_secretbox_KEYBYTES
    expect(key1).toEqual(key2); // Deterministic
  });

  it("should derive different keys for different salts", () => {
    const password = "my-super-secret-password-123";
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    const key1 = deriveKey(password, salt1);
    const key2 = deriveKey(password, salt2);

    expect(key1).not.toEqual(key2);
  });

  it("should encrypt and decrypt data successfully", () => {
    const password = "my-super-secret-password-123";
    const salt = generateSalt();
    const key = deriveKey(password, salt);

    // Create some dummy binary data (e.g. Loro snapshot)
    const originalData = new Uint8Array([1, 2, 3, 4, 5, 255, 128, 0]);

    const encrypted = encryptData(originalData, key);

    // Encrypted data should be longer than original (nonce + mac)
    expect(encrypted.length).toBeGreaterThan(originalData.length);
    expect(encrypted).not.toEqual(originalData);

    const decrypted = decryptData(encrypted, key);

    expect(decrypted).toEqual(originalData);
  });

  it("should fail to decrypt with the wrong key", () => {
    const salt = generateSalt();
    const key1 = deriveKey("password-one", salt);
    const key2 = deriveKey("password-two", salt);

    const originalData = new Uint8Array([1, 2, 3, 4, 5]);
    const encrypted = encryptData(originalData, key1);

    expect(() => {
      decryptData(encrypted, key2);
    }).toThrow();
  });

  it("should fail to decrypt corrupted data", () => {
    const salt = generateSalt();
    const key = deriveKey("password", salt);

    const originalData = new Uint8Array([1, 2, 3, 4, 5]);
    const encrypted = encryptData(originalData, key);

    // Corrupt one byte of the ciphertext
    encrypted[encrypted.length - 1] ^= 1;

    expect(() => {
      decryptData(encrypted, key);
    }).toThrow();
  });
});
