# Creator Dashboard

A comprehensive dashboard application for content creators and administrators to manage content, users, analytics, and reports.

## Features

### User Features
- **Authentication**: Secure login and registration for content creators
- **Dashboard**: Personalized dashboard for creators to manage their content and analytics
- **Feed**: Content feed with posts from various platforms
- **Content Management**: Create, edit, and delete content across multiple platforms
- **Analytics**: Track engagement metrics and audience insights

### Admin Features
- **User Management**: View, edit, and manage user accounts
- **Content Moderation**: Review and moderate reported content
- **Analytics Dashboard**: Platform-wide analytics and statistics
- **Reports Management**: Handle user reports and content flags
- **Settings Management**: Configure system settings and preferences

### Technical Features
- **React Frontend**: Built with React 18 and Vite for a fast, modern UI
- **Express Backend**: RESTful API server using Express
- **MongoDB Database**: Scalable document-based storage
- **Authentication**: JWT-based authentication system with role-based access control
- **React Query**: Efficient server state management and caching
- **Responsive Design**: Tailwind CSS for a responsive UI that works on all devices
- **API Integration**: Connect with LinkedIn and Reddit services

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas connection)

### Installation

1. Clone the repository
```bash
git clone https://your-repo-url/Creator-dashboard.git
cd Creator-dashboard
```

2. Install frontend dependencies
```bash
cd client
npm install
```

3. Install backend dependencies
```bash
cd ../server
npm install
```

4. Set up environment variables

For the server, create a `.env` file in the server directory:
```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/creator-dashboard
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

5. Set up the database

- Start MongoDB locally or connect to Atlas
- Run the admin seeding script (optional):
```bash
npm run seed-admin
```

### Running Locally

1. Start the backend server
```bash
cd server
npm run dev
```

2. Start the frontend development server
```bash
cd client
npm run dev
```

3. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Deployment

### Backend Deployment

1. Set up environment variables for production:
```
NODE_ENV=production
PORT=8000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
```

2. Build and start the server:
```bash
cd server
npm start
```

### Frontend Deployment

1. Build the frontend application:
```bash
cd client
npm run build
```

2. Deploy the generated `dist` folder to your hosting service of choice (Vercel, Netlify, etc.)

3. Configure the production API endpoint in your frontend environment



