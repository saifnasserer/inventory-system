// Quick test script to upload report via Backend API
const fs = require('fs');
const path = require('path');

const backendUrl = 'http://82.112.253.29:4006';

async function testUpload() {
    console.log('Logging in...');

    // Login to get token
    const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'admin@laapak.com',
            password: '620163Z-z'
        })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.success) {
        console.error('Auth error:', loginData.error || 'Login failed');
        return;
    }

    console.log('Logged in successfully!');
    const token = loginData.token;
    console.log('Token:', token.substring(0, 50) + '...');

    // Read the report file
    const reportPath = '/media/saif/brain/Projects/inventoryERD/Report_Precision_5530_ERP-1_20260122_195718.json';
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    // Generate a random UUID for report_id to avoid unique constraint errors
    const randomUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    reportData.metadata.report_id = randomUUID;

    const assetId = reportData.metadata.asset_id;

    console.log(`\nUploading report for asset: ${assetId}`);

    // Call the Upload Endpoint
    const response = await fetch(`${backendUrl}/api/diagnostic_reports/upload/${assetId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
    });

    const result = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
}

testUpload().catch(console.error);
