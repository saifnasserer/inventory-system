const API_URL = 'http://localhost:4006';

async function verifyIntegration() {
    console.log('Testing ERP Integration...');

    try {
        // 1. Test Login
        console.log('\n1. Testing Login...');
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@laapak.com', // Using the existing admin user
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        if (loginData.success) {
            console.log('✓ Login successful');
            console.log('✓ Offline Token received:', loginData.offline_token ? 'Yes' : 'No');
            console.log('✓ Max Devices:', loginData.max_devices);

            const token = loginData.token;
            const offlineToken = loginData.offline_token;

            // 2. Test Sync
            console.log('\n2. Testing License Sync...');
            const syncRes = await fetch(`${API_URL}/api/license/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    offline_token: offlineToken,
                    scanned_devices: ['dev_hash_1', 'dev_hash_2'],
                    flags: ['none']
                })
            });

            const syncData = await syncRes.json();
            if (syncData.success) {
                console.log('✓ Sync successful');
                console.log('✓ New Offline Token received:', syncData.new_offline_token ? 'Yes' : 'No');
                console.log('✓ Synced Count:', syncData.synced_count);
            } else {
                console.error('✗ Sync failed:', syncData.error);
            }
        } else {
            console.error('✗ Login failed:', loginData.error);
            console.log('Note: Ensure the server is running and the credentials are correct.');
        }
    } catch (error) {
        console.error('✗ Error during verification:', error.message);
    }
}

verifyIntegration();
