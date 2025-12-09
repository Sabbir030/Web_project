# Web Project - Parcel Nexus / Curior IUB

This is a Node.js/Express backend project for a courier/delivery management system.

## Features
- **Authentication**: User login and registration.
- **Bids**: Manage delivery bids.
- **Deliveries**: Track and manage shipments.
- **Payments**: Handle payment transactions.
- **Tracking**: Real-time parcel tracking.

## Deployment on Vercel

This project is optimized for **zero-config deployment** on Vercel.

1.  **Push to GitHub**: Make sure your latest code is on GitHub (already done).
2.  **Import Project in Vercel**:
    - Go to your Vercel Dashboard.
    - Click **"Add New..."** -> **"Project"**.
    - Select your repository (`Web_project`).
    - **Framework Preset**: Select `Other` (or leave default).
    - **Root Directory**: Leave it as `./` (Root).
    - Click **Deploy**.

That's it! Vercel will automatically detect `vercel.json` and `server.js` and start your API.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the server:
    ```bash
    npm start
    ```
    The server runs on port `9090` by default.

## API Endpoints
- `/api/auth`
- `/api/bids`
- `/api/deliveries`
- `/api/payments`
- `/api/tracking`
