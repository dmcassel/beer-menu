import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export interface GoogleUser {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Verify Google ID token and extract user information
 */
export async function verifyGoogleToken(token: string): Promise<GoogleUser> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid token payload");
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw new Error("Failed to verify Google token");
  }
}

/**
 * Generate authorization URL for Google OAuth
 */
export function getGoogleAuthUrl(): string {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getGoogleTokens(code: string) {
  const { tokens } = await client.getToken(code);
  return tokens;
}
