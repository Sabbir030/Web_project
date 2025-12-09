// const fetch = require('node-fetch'); // Built-in fetch used in Node 18+

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  try {
    console.log('--- 1. Register Merchant ---');
    const merchantRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Merchant One',
        email: 'merchant' + Date.now() + '@test.com',
        password: 'password',
        role: 'merchant',
        phone: '01700000000',
        address: 'Dhaka'
      })
    });
    const merchantData = await merchantRes.json();
    console.log('Merchant Registered:', merchantData.user.id);

    console.log('\n--- 2. Register Courier ---');
    const courierRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Courier One',
        email: 'courier' + Date.now() + '@test.com',
        password: 'password',
        role: 'courier',
        phone: '01800000000',
        address: 'Dhaka'
      })
    });
    const courierData = await courierRes.json();
    console.log('Courier Registered:', courierData.user.id);

    console.log('\n--- 3. Create Bid (Merchant) ---');
    const bidRes = await fetch(`${BASE_URL}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: merchantData.user.id,
        product: 'Laptop',
        pickup: 'Gulshan',
        drop: 'Banani',
        maxPrice: 500,
        expectedTime: '2025-12-20 10:00'
      })
    });
    const bidData = await bidRes.json();
    console.log('Bid Created:', bidData.id);

    console.log('\n--- 4. List Open Bids (Courier) ---');
    const bidsRes = await fetch(`${BASE_URL}/bids`);
    const bids = await bidsRes.json();
    console.log('Open Bids Count:', bids.length);

    console.log('\n--- 5. Submit Proposal (Courier) ---');
    const proposalRes = await fetch(`${BASE_URL}/bids/${bidData.id}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courierId: courierData.user.id,
        price: 450,
        eta: 'Today 5PM'
      })
    });
    const proposalData = await proposalRes.json();
    console.log('Proposal Submitted:', proposalData.id);

    console.log('\n--- 6. Accept Proposal (Merchant) ---');
    const acceptRes = await fetch(`${BASE_URL}/bids/proposals/${proposalData.id}/accept`, {
      method: 'POST'
    });
    const acceptData = await acceptRes.json();
    console.log('Proposal Accepted, Delivery ID:', acceptData.deliveryId);

    console.log('\n--- 7. Update Status (Courier) ---');
    const statusRes = await fetch(`${BASE_URL}/deliveries/${acceptData.deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Picked Up' })
    });
    console.log('Status Update:', await statusRes.json());

    console.log('\n--- 8. Track Delivery (Public) ---');
    const trackRes = await fetch(`${BASE_URL}/tracking/${acceptData.deliveryId}`);
    const trackData = await trackRes.json();
    console.log('Tracking Info:', trackData.status, trackData.timeline);

    console.log('\n--- VERIFICATION COMPLETE ---');

  } catch (error) {
    console.error('Verification Failed:', error);
  }
}

run();
