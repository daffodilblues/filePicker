// googleClient.ts
// import { google, drive_v3 } from 'googleapis';
// import { OAuth2Client } from 'google-auth-library';

// let oAuth2Client: OAuth2Client | null = null;

// // Initialize the OAuth2 client using credentials obtained via Supabase
// export const initializeGoogleClient = async (accessToken: string, refreshToken: string): Promise<void> => {
//     oAuth2Client = new google.auth.OAuth2();
//     oAuth2Client.setCredentials({
//         access_token: accessToken,
//         refresh_token: refreshToken,
//     });
// };

// export const getDriveClient = (): drive_v3.Drive => {
//     if (!oAuth2Client) throw new Error('OAuth client is not initialized');
//     return google.drive({ version: 'v3', auth: oAuth2Client });
// };
export {}