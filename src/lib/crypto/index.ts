import _sodium from "libsodium-wrappers";

let sodium: typeof _sodium;

/**
 * Initializes the libsodium WASM module.
 * Must be called and awaited before any other crypto functions are used.
 */
export async function initCrypto() {
  await _sodium.ready;
  sodium = _sodium;
}

const SALT_BYTES = 16;
const KEY_BYTES = 32;
const NONCE_BYTES = 24;
const MAC_BYTES = 16;

/**
 * Derives a strong symmetric key from a user password and a vault-specific salt
 * using Argon2id, the current standard for password hashing.
 *
 * @param password The user's master password
 * @param salt A 16-byte random salt unique to the vault
 * @returns A 32-byte symmetric key for XChaCha20-Poly1305
 */
export function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  if (salt.length !== SALT_BYTES) {
    throw new Error(`Salt must be exactly ${SALT_BYTES} bytes.`);
  }

  if (typeof sodium.crypto_pwhash !== "function") {
    throw new Error(
      "Argon2id KDF is unavailable in the current libsodium build. Install an Argon2id-capable build such as libsodium-wrappers-sumo.",
    );
  }

  return sodium.crypto_pwhash(
    KEY_BYTES,
    password,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

/**
 * Generates a random salt for a new vault.
 * @returns A random 16-byte salt
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_BYTES);
  return globalThis.crypto.getRandomValues(salt);
}

/**
 * Encrypts a payload (e.g., Loro CRDT snapshot) using XChaCha20-Poly1305.
 *
 * @param payload The binary data to encrypt
 * @param key The 32-byte symmetric key (derived from password)
 * @returns A Uint8Array containing [24-byte nonce] + [ciphertext/mac]
 */
export function encryptData(payload: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== KEY_BYTES) {
    throw new Error(`Key must be exactly ${KEY_BYTES} bytes.`);
  }

  // Generate a random 24-byte nonce for XChaCha20
  const nonce = new Uint8Array(NONCE_BYTES);
  globalThis.crypto.getRandomValues(nonce);

  // Encrypt payload
  const ciphertext = sodium.crypto_secretbox_easy(payload, nonce, key);

  // Prepend nonce to ciphertext for storage
  const result = new Uint8Array(nonce.length + ciphertext.length);
  result.set(nonce, 0);
  result.set(ciphertext, nonce.length);

  return result;
}

/**
 * Decrypts a payload encrypted with XChaCha20-Poly1305.
 *
 * @param encryptedData The binary data containing [24-byte nonce] + [ciphertext/mac]
 * @param key The 32-byte symmetric key
 * @returns The original decrypted Uint8Array
 */
export function decryptData(encryptedData: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== KEY_BYTES) {
    throw new Error(`Key must be exactly ${KEY_BYTES} bytes.`);
  }

  if (encryptedData.length < NONCE_BYTES + MAC_BYTES) {
    throw new Error("Encrypted data is too short to be valid.");
  }

  // Extract nonce and ciphertext
  const nonce = encryptedData.slice(0, NONCE_BYTES);
  const ciphertext = encryptedData.slice(NONCE_BYTES);

  // Decrypt payload
  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  return decrypted;
}
