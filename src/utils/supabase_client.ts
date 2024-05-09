import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient('https://oqskvdndvhyovlsfzhhm.supabase.co', 
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xc2t2ZG5kdmh5b3Zsc2Z6aGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUxNTc2MjMsImV4cCI6MjAzMDczMzYyM30.EozoL2WPBSVetxZaRq8yYv3-3Hqb-fpWJXNH1fmnxb4'
)

// export const getAccessToken = async () => {
//     const { data: { session } } = await supabase.auth.getSession();
//     return session ? session.access_token : '';
//   };

// supabase.auth.onAuthStateChange((event: any, session: any) => {
//   console.log("auth state change", session, event);
//   // chrome.storage.local.set({'userSession': JSON.stringify(session)});
// });


export async function storeTokens(accessToken: string, refreshToken: string, userId: string) {
    const { error } = await supabase.from('trial').insert([
        {
            text: accessToken
        },
    ]);

    if (error) {
        console.error('Error inserting tokens:', error);
    } else {
        console.log('Tokens inserted successfully');
    }
}




export async function createSocketForDriveWebhookChangesFromDB(handleInserts: any) {
// Create a function to handle inserts
  console.log('listening');
  // Listen to inserts
  supabase
    .channel('google_drive_webhooks')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'google_drive_webhooks' }, handleInserts)
    .subscribe()
}