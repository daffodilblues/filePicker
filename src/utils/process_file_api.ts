import { Request, Response } from 'express';
import superagent from 'superagent';
import { supabase } from './supabase_client';

export async function callProcessFileAPI(fileMetadata: any) {
    console.log(fileMetadata);
    const { data: { session } } = await supabase.auth.getSession();
    const provider_token = session?.provider_token;
    try {
        const response = await superagent.post('https://sfagl7ugp5.execute-api.ap-south-1.amazonaws.com/process_drive_entity')
            .send({
                file_metadata: fileMetadata,
                provider_token: provider_token
            })
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${session?.access_token}`);
        return response.body;
    } catch (error) {
        console.error('Failed to process file:', error);
        throw error;
    }
}

