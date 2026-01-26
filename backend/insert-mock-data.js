// Node.js v20+ has built-in fetch

const API_URL = 'http://localhost:4006';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

const mockDevices = [
    // Dell Latitude 5420 (5 devices)
    { asset_id: 'DELL-LAT-001', model: 'Dell Latitude 5420', serial_number: 'SN-LAT-001', manufacturer: 'Dell', status: 'ready_for_sale', current_location: 'رف A-1' },
    { asset_id: 'DELL-LAT-002', model: 'Dell Latitude 5420', serial_number: 'SN-LAT-002', manufacturer: 'Dell', status: 'ready_for_sale', current_location: 'رف A-1' },
    { asset_id: 'DELL-LAT-003', model: 'Dell Latitude 5420', serial_number: 'SN-LAT-003', manufacturer: 'Dell', status: 'ready_for_sale', current_location: 'رف A-2' },
    { asset_id: 'DELL-LAT-004', model: 'Dell Latitude 5420', serial_number: 'SN-LAT-004', manufacturer: 'Dell', status: 'ready_for_sale', current_location: 'رف A-2' },
    { asset_id: 'DELL-LAT-005', model: 'Dell Latitude 5420', serial_number: 'SN-LAT-005', manufacturer: 'Dell', status: 'ready_for_sale', current_location: 'رف A-3' },

    // HP EliteBook 840 G8 (3 devices)
    { asset_id: 'HP-EB-001', model: 'HP EliteBook 840 G8', serial_number: 'SN-HP-001', manufacturer: 'HP', status: 'ready_for_sale', current_location: 'رف B-1' },
    { asset_id: 'HP-EB-002', model: 'HP EliteBook 840 G8', serial_number: 'SN-HP-002', manufacturer: 'HP', status: 'ready_for_sale', current_location: 'رف B-1' },
    { asset_id: 'HP-EB-003', model: 'HP EliteBook 840 G8', serial_number: 'SN-HP-003', manufacturer: 'HP', status: 'ready_for_sale', current_location: 'رف B-2' },

    // Lenovo ThinkPad X1 Carbon (4 devices)
    { asset_id: 'LEN-X1-001', model: 'Lenovo ThinkPad X1 Carbon', serial_number: 'SN-LEN-001', manufacturer: 'Lenovo', status: 'ready_for_sale', current_location: 'رف C-1' },
    { asset_id: 'LEN-X1-002', model: 'Lenovo ThinkPad X1 Carbon', serial_number: 'SN-LEN-002', manufacturer: 'Lenovo', status: 'ready_for_sale', current_location: 'رف C-1' },
    { asset_id: 'LEN-X1-003', model: 'Lenovo ThinkPad X1 Carbon', serial_number: 'SN-LEN-003', manufacturer: 'Lenovo', status: 'ready_for_sale', current_location: 'رف C-2' },
    { asset_id: 'LEN-X1-004', model: 'Lenovo ThinkPad X1 Carbon', serial_number: 'SN-LEN-004', manufacturer: 'Lenovo', status: 'ready_for_sale', current_location: 'رف C-2' },

    // MacBook Pro 14" (2 devices)
    { asset_id: 'MAC-PRO-001', model: 'MacBook Pro 14"', serial_number: 'SN-MAC-001', manufacturer: 'Apple', status: 'ready_for_sale', current_location: 'رف D-1' },
    { asset_id: 'MAC-PRO-002', model: 'MacBook Pro 14"', serial_number: 'SN-MAC-002', manufacturer: 'Apple', status: 'ready_for_sale', current_location: 'رف D-1' },

    // Asus ROG Zephyrus G14 (1 device - to test single item)
    { asset_id: 'ASUS-ROG-001', model: 'Asus ROG Zephyrus G14', serial_number: 'SN-ASUS-001', manufacturer: 'Asus', status: 'ready_for_sale', current_location: 'رف E-1' },
];

async function insertMockData() {
    console.log('Starting mock data insertion...');

    for (const device of mockDevices) {
        try {
            const response = await fetch(`${API_URL}/api/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                },
                body: JSON.stringify(device),
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✓ Created device: ${device.asset_id} - ${device.model}`);
            } else {
                const error = await response.json();
                console.error(`✗ Failed to create ${device.asset_id}:`, error.error || response.statusText);
            }
        } catch (error) {
            console.error(`✗ Error creating ${device.asset_id}:`, error.message);
        }
    }

    console.log('\nMock data insertion completed!');
    console.log('Summary:');
    console.log('- 5x Dell Latitude 5420');
    console.log('- 3x HP EliteBook 840 G8');
    console.log('- 4x Lenovo ThinkPad X1 Carbon');
    console.log('- 2x MacBook Pro 14"');
    console.log('- 1x Asus ROG Zephyrus G14');
}

// Check if AUTH_TOKEN is provided
if (!AUTH_TOKEN) {
    console.error('ERROR: AUTH_TOKEN environment variable is required');
    console.log('Usage: AUTH_TOKEN=your_token_here node insert-mock-data.js');
    process.exit(1);
}

insertMockData();
