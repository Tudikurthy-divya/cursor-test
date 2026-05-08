/** Trimmed OAuth Web Client ID from env; empty if unset. */
export const GOOGLE_CLIENT_ID = (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim();
export const HAS_GOOGLE_AUTH = GOOGLE_CLIENT_ID.length > 0;
