import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient('https://oqskvdndvhyovlsfzhhm.supabase.co', 
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xc2t2ZG5kdmh5b3Zsc2Z6aGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUxNTc2MjMsImV4cCI6MjAzMDczMzYyM30.EozoL2WPBSVetxZaRq8yYv3-3Hqb-fpWJXNH1fmnxb4',
{
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    }
}
);

export async function createSocketForDriveWebhookChangesFromDB(handleInserts: any) {
  supabase
    .channel('google_drive_webhooks')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'google_drive_webhooks' }, handleInserts)
    .subscribe()
}