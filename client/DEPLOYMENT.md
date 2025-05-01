# Frontend Deployment Guide (Firebase Hosting)

## Prerequisites
- Firebase account
- Firebase CLI installed and initialized on your local machine
- Node.js and npm installed

## Setup

1. Update your production API endpoint in `.env.production`:
   Replace `[YOUR-PROJECT-ID]` with your actual Google Cloud project ID in the VITE_API_URL.

2. Initialize Firebase for your project (if not already done):
   ```bash
   firebase login
   firebase init
   ```
   
   When prompted:
   - Select "Hosting: Configure and deploy Firebase Hosting sites"
   - Select your Firebase project
   - Specify "dist" as your public directory
   - Configure as a single-page app: Yes
   - Set up automatic builds and deploys with GitHub: No (optional)

## Deploy to Firebase Hosting

1. Build and deploy your application with a single command:
   ```bash
   npm run deploy
   ```

2. After successful deployment, your site will be available at:
   `https://[YOUR-PROJECT-ID].web.app`

## Additional Configuration

### Custom Domain (Optional)

To use a custom domain with Firebase Hosting:

1. Go to your Firebase console > Hosting > Add custom domain
2. Follow the prompts to verify domain ownership
3. Add the DNS records provided by Firebase to your domain provider

### Environment-Specific Builds (Optional)

For different environments (staging, production), you can create additional environment files:

- `.env.staging`
- `.env.production`

And update your package.json scripts:

```json
"scripts": {
  "build:staging": "vite build --mode staging",
  "build:production": "vite build --mode production",
  "deploy:staging": "npm run build:staging && firebase use staging && firebase deploy --only hosting",
  "deploy:production": "npm run build:production && firebase use production && firebase deploy --only hosting"
}
```

### Continuous Deployment (Optional)

To set up GitHub Actions for automatic deployment:

1. Create a `.github/workflows/firebase-deploy.yml` file
2. Configure it to run the build and deployment process on pushes to the main branch
3. Add Firebase token as a GitHub secret for authentication