/**
 * breezStorage.ts
 * Encryption/Decryption functions using Web Crypto API for secure storage of wallet data
 */

// Type definitions
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export interface StorageKey {
  key: CryptoKey;
  salt: Uint8Array;
}

/**
 * Generate a cryptographic key from a password using PBKDF2
 * @param password - The password to derive the key from
 * @param salt - Optional salt (will generate new one if not provided)
 * @param iterations - Number of PBKDF2 iterations (default: 100000)
 * @returns Promise containing the derived key and salt
 */
export async function deriveKey(
  password: string,
  salt?: Uint8Array,
  iterations: number = 100000
): Promise<StorageKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Generate salt if not provided
  const keySalt = salt || crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: keySalt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return { key, salt: keySalt };
}

/**
 * Encrypt data using AES-GCM
 * @param data - The data to encrypt (as string)
 * @param password - The password to use for encryption
 * @returns Promise containing encrypted data with IV and salt
 */
export async function encryptData(
  data: string,
  password: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Derive encryption key
  const { key, salt } = await deriveKey(password);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );
  
  // Convert to base64 for storage
  const ciphertext = arrayBufferToBase64(encryptedBuffer);
  const ivBase64 = arrayBufferToBase64(iv);
  const saltBase64 = arrayBufferToBase64(salt);
  
  return {
    ciphertext,
    iv: ivBase64,
    salt: saltBase64
  };
}

/**
 * Decrypt data using AES-GCM
 * @param encryptedData - The encrypted data object
 * @param password - The password to use for decryption
 * @returns Promise containing decrypted data as string
 */
export async function decryptData(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  // Convert base64 back to buffers
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedData.salt));
  
  // Derive decryption key using stored salt
  const { key } = await deriveKey(password, salt);
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv)
    },
    key,
    ciphertext
  );
  
  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Store encrypted data in localStorage
 * @param key - Storage key
 * @param data - Data to encrypt and store
 * @param password - Password for encryption
 */
export async function storeEncrypted(
  key: string,
  data: string,
  password: string
): Promise<void> {
  const encrypted = await encryptData(data, password);
  localStorage.setItem(key, JSON.stringify(encrypted));
}

/**
 * Retrieve and decrypt data from localStorage
 * @param key - Storage key
 * @param password - Password for decryption
 * @returns Promise containing decrypted data or null if not found
 */
export async function retrieveEncrypted(
  key: string,
  password: string
): Promise<string | null> {
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return null;
  }
  
  try {
    const encrypted: EncryptedData = JSON.parse(stored);
    return await decryptData(encrypted, password);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw new Error('Decryption failed - invalid password or corrupted data');
  }
}

/**
 * Remove encrypted data from localStorage
 * @param key - Storage key
 */
export function removeEncrypted(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Check if encrypted data exists in storage
 * @param key - Storage key
 * @returns boolean indicating if data exists
 */
export function hasEncrypted(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

// Utility functions

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random encryption password
 * @param length - Length of password (default: 32)
 * @returns Random password string
 */
export function generateRandomPassword(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array).substring(0, length);
}

/**
 * Hash data using SHA-256
 * @param data - Data to hash
 * @returns Promise containing hex string of hash
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
