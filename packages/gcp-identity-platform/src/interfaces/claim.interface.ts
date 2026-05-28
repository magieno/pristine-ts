/**
 * The standard claims found on a verified Firebase ID token. Custom claims (set via
 * `admin.auth().setCustomUserClaims(...)`) appear as additional fields beyond these.
 */
export interface ClaimInterface {
  /** Issuer — `https://securetoken.google.com/{projectId}`. */
  iss: string;
  /** Audience — the Firebase project id. */
  aud: string;
  /** The auth time, in seconds since epoch. */
  auth_time: number;
  /** Issued-at time, in seconds since epoch. */
  iat: number;
  /** Expiry, in seconds since epoch. */
  exp: number;
  /** The Firebase user id. */
  sub: string;
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  /** Firebase-specific claims (sign_in_provider, identities, etc.). */
  firebase?: {
    identities?: { [key: string]: any };
    sign_in_provider?: string;
    [key: string]: any;
  };

  [customClaim: string]: any;
}
