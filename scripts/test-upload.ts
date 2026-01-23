// Quick test script to upload report via Edge Function
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://xwgmqhaemvoaviwzrnci.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Z21xaGFlbXZvYXZpd3pybmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODk4MTAsImV4cCI6MjA4Mjk2NTgxMH0.yn483Lvg_7I2NO-8SeKA-zdUIv9nmBlcdwYUPS3uBJs';

async function testUpload() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Login
    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@laapak.com',
        password: '620163Z-z'
    });

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    console.log('Logged in successfully!');
    const token = authData.session?.access_token;
    console.log('Token:', token?.substring(0, 50) + '...');

    // Read the report file
    const reportPath = '/media/saif/brain/Projects/inventoryERD/Report_Precision_5530_ERP-1_20260122_195718.json';
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const assetId = reportData.metadata.asset_id;

    console.log(`\nUploading report for asset: ${assetId}`);

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/device-specs-upload/${assetId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
    });

    const result = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
}

testUpload().catch(console.error);
