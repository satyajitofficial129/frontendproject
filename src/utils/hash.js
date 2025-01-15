// Import the CryptoJS library
import CryptoJS from 'crypto-js';

// Function to generate SHA-256 hash
export function generateHash(token) {
  // Generate the hash using SHA-256 and convert to hexadecimal format
  const hash = CryptoJS.SHA256(token).toString(CryptoJS.enc.Hex);
  return hash;
}
