# Creator-Dashboard Deployment Guide

This guide contains instructions for deploying the Creator-Dashboard application, with:
- Backend: Node.js + Express.js (Google Cloud Run)
- Frontend: React.js + Tailwind CSS (Firebase Hosting)

## Project Structure

```
Creator-dashboard/
├── client/           # React frontend application
└── server/           # Node.js backend API
```

## Prerequisites

Before proceeding with deployment, ensure you have:

1. A Google Cloud Platform account 
2. A Firebase account (can use the same Google account)
3. Google Cloud CLI installed and configured
4. Firebase CLI installed and authenticated
5. Node.js and npm installed

## Step 1: Deploy Backend (Google Cloud Run)

Detailed instructions are available in [server/DEPLOYMENT.md](server/DEPLOYMENT.md).

Quick summary:

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit the .env file with your production values
   ```

3. Update the project ID in package.json:
   Edit the `deploy` script in package.json and replace `[YOUR-PROJECT-ID]` with your actual GCP project ID.

4. Deploy to Google Cloud Run:
   ```bash
   npm run deploy
   ```

5. Note the service URL that is output after successful deployment (you'll need it for the frontend).

## Step 2: Deploy Frontend (Firebase Hosting)

Detailed instructions are available in [client/DEPLOYMENT.md](client/DEPLOYMENT.md).

Quick summary:

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Update the API URL in .env.production:
   Edit the `.env.production` file and replace the API URL with your Cloud Run service URL.

3. Initialize Firebase (if not already done):
   ```bash
   firebase login
   firebase init hosting
   ```

4. Deploy to Firebase Hosting:
   ```bash
   npm run deploy
   ```

## Step 3: Verify Deployment

1. Test the frontend application at your Firebase URL: `https://[YOUR-PROJECT-ID].web.app`
2. Ensure it can connect to the backend API successfully

## Additional Configurations

### Custom Domains

- For the backend: Follow the custom domain setup in [server/DEPLOYMENT.md](server/DEPLOYMENT.md)
- For the frontend: Configure custom domains through Firebase Hosting console

### Continuous Integration/Deployment

Consider setting up GitHub Actions or Cloud Build for automated deployments:
- Set up triggers on main branch pushes
- Store sensitive credentials as secrets

### Monitoring and Logging

- Set up Google Cloud Monitoring for backend services
- Configure Firebase Analytics for frontend usage tracking

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure the backend has proper CORS configuration for your frontend domain
2. **Authentication failures**: Verify JWT_SECRET is properly set in the backend environment
3. **API connection issues**: Check network rules and ensure the frontend has the correct API URL

For more information, refer to the respective deployment guides for [backend](server/DEPLOYMENT.md) and [frontend](client/DEPLOYMENT.md).