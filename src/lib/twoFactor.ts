import { toDataURL } from "qrcode";
import { authenticator } from "otplib";

/**
 * Generate a random secret for TOTP authentication
 * @returns A Base32 encoded secret string
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a TOTP authentication URL for QR codes
 * @param params Object with accountName, issuer, and secret
 * @returns The otpauth URL for QR code generation
 */
export function generateOTPAuthURL(params: { 
  accountName: string; 
  issuer: string; 
  secret: string;
}): string {
  const { accountName, issuer, secret } = params;
  return authenticator.keyuri(accountName, issuer, secret);
}

/**
 * Generate a QR code data URL from an OTP auth URL
 * @param otpAuthUrl The OTP auth URL to encode in the QR code
 * @returns A data URL string containing the QR code image
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    return await toDataURL(otpAuthUrl);
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Validate a TOTP token against a secret
 * @param token The token provided by the user
 * @param secret The secret used to generate the token
 * @returns boolean indicating whether the token is valid
 */
export function verifyToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

/**
 * Generate recovery codes for 2FA backup
 * @param count Number of recovery codes to generate (default: 10)
 * @returns Array of recovery code strings
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < count; i++) {
    let code = '';
    // Generate a code with format: XXXX-XXXX-XXXX (where X is an alphanumeric character)
    for (let j = 0; j < 12; j++) {
      if (j === 4 || j === 8) {
        code += '-';
      }
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    codes.push(code);
  }
  
  return codes;
} 