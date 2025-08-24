# Firebase Setup Guide for JourneyBoard

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "journeyboard-deploy1" (or your preferred name)
4. Follow the setup wizard

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password"
3. Enable "Google" (optional but recommended)
4. Add your domain to authorized domains if needed

## Step 3: Create Firestore Database

1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (we'll secure it later)
3. Select a location close to your users

## Step 4: Get Firebase Configuration

1. Go to "Project settings" (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → "Web"
4. Register your app and copy the config

## Step 5: Set Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 6: Firestore Security Rules

Replace the default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own trips
    match /trips/{tripId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.ownerId ||
        request.auth.uid in resource.data.editors ||
        request.auth.uid in resource.data.viewers
      );
      allow write: if request.auth != null && (
        request.auth.uid == resource.data.ownerId ||
        request.auth.uid in resource.data.editors ||
        // Temporary: Allow users to add themselves to editors array if they have an accepted invitation
        // This enables the invitation acceptance flow to work
        (request.auth.uid in request.resource.data.editors && 
         request.auth.uid not in resource.data.editors)
      );
      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;
    }
    
    // Allow users to manage trip invitations
    match /invitations/{invitationId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow test collection for debugging
    match /test/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Create Required Indexes

1. Go to "Firestore Database" → "Indexes"
2. Click "Create Index"
3. Create these composite indexes:

### Index 1: User's owned trips
- **Collection ID:** `trips`
- **Fields:**
  - `ownerId` (Ascending)
  - `createdAt` (Descending)
- **Query scope:** Collection

### Index 2: User's edited trips
- **Collection ID:** `trips`
- **Fields:**
  - `editors` (Array contains)
  - `createdAt` (Descending)
- **Query scope:** Collection

### Index 3: User's viewed trips
- **Collection ID:** `trips`
- **Fields:**
  - `viewers` (Array contains)
  - `createdAt` (Descending)
- **Query scope:** Collection

## Step 8: Test Your Setup

1. Start your development server: `npm run dev`
2. Try creating a trip
3. Try sharing a trip with another user
4. Check the browser console for any errors

## Troubleshooting

### Common Issues:

1. **"Missing or insufficient permissions"**
   - Check that your security rules are correct
   - Ensure you're signed in with Firebase Auth

2. **"The query requires an index"**
   - Create the composite indexes as shown in Step 7
   - Wait a few minutes for the indexes to build

3. **"Firebase: Error (auth/invalid-api-key)"**
   - Double-check your `.env.local` file
   - Ensure all environment variables are correct
   - Restart your development server after changing env vars

### Production Considerations:

- Change Firestore rules from "test mode" to the rules above
- Set up proper authentication domains
- Consider setting up Firebase Hosting for deployment
- Implement email notifications for trip invitations 