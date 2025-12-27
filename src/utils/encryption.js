/**
 * Encryption Utilities for Admin Credentials
 * Uses Web Crypto API for secure encryption/decryption
 */

// Generate a cryptographic key from a password
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate random bytes
function generateRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to ArrayBuffer
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Encrypt sensitive data
 * @param {string} plaintext - The data to encrypt
 * @param {string} secretKey - The encryption key (from environment)
 * @returns {Promise<string>} - Encrypted data as hex string (salt:iv:ciphertext)
 */
export async function encryptData(plaintext, secretKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production') {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);
  const key = await deriveKey(secretKey, salt);
  
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    plaintextBuffer
  );
  
  // Format: salt:iv:ciphertext (all in hex)
  return `${bufferToHex(salt)}:${bufferToHex(iv)}:${bufferToHex(ciphertext)}`;
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - The encrypted data (salt:iv:ciphertext format)
 * @param {string} secretKey - The encryption key
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decryptData(encryptedData, secretKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production') {
  const [saltHex, ivHex, ciphertextHex] = encryptedData.split(':');
  
  const salt = hexToBuffer(saltHex);
  const iv = hexToBuffer(ivHex);
  const ciphertext = hexToBuffer(ciphertextHex);
  
  const key = await deriveKey(secretKey, salt);
  
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Hash a password for storage (one-way)
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The stored hash
 * @returns {Promise<boolean>} - Whether the password matches
 */
export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Generate a secure random password
 * @param {number} length - Password length
 * @returns {string} - Random password
 */
export function generateSecurePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = generateRandomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

export default {
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword,
  generateSecurePassword
};
