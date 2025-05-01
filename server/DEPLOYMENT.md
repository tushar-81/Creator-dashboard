# Backend Deployment Guide (Google Cloud Run)

## Prerequisites
- Google Cloud Platform account
- Google Cloud CLI installed and initialized on your local machine
- Firebase CLI installed for frontend deployment

## Setup Environment
1. Create a production `.env` file using the example:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your production values:
   ```
   MONGO_URI=mongodb+srv://your-production-mongodb-uri
   JWT_SECRET=your-strong-production-jwt-secret
   TWITTER_BEARER_TOKEN=your-twitter-bearer-token
   REDDIT_CLIENT_ID=your-reddit-client-id
   REDDIT_CLIENT_SECRET=your-reddit-client-secret
   ```

## Deploy to Google Cloud Run

1. Update your Google Cloud project ID in the deploy script in `package.json`:
   Replace `[YOUR-PROJECT-ID]` with your actual Google Cloud project ID.

2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
   ```

3. Set environment variables in Google Cloud Run:
   ```bash
   gcloud run services update creator-dashboard-api \
     --set-env-vars="MONGO_URI=mongodb+srv://your-production-mongodb-uri" \
     --set-env-vars="JWT_SECRET=your-strong-production-jwt-secret" \
     --set-env-vars="TWITTER_BEARER_TOKEN=your-twitter-bearer-token" \
     --set-env-vars="REDDIT_CLIENT_ID=your-reddit-client-id" \
     --set-env-vars="REDDIT_CLIENT_SECRET=your-reddit-client-secret"
   ```

4. Deploy the API with one command:
   ```bash
   npm run deploy
   ```

5. The deployment will output a service URL. Use this URL as your API endpoint in the frontend.

## Additional Configuration

### Custom Domain (Optional)
To map a custom domain to your Cloud Run service:

1. Verify domain ownership in Google Cloud Console
2. Map the domain to your service:
   ```bash
   gcloud beta run domain-mappings create --service=creator-dashboard-api --domain=api.yourdomain.com
   ```

3. Add the provided DNS records to your domain's DNS settings

### Scaling Configuration (Optional)
```bash
gcloud run services update creator-dashboard-api \
  --min-instances=1 \
  --max-instances=10 \
  --memory=512Mi
```