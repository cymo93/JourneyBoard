
# Architecture Overview

This document provides a technical overview of the JourneyBoard application's architecture.

## 1. File Structure

The project follows a standard Next.js App Router structure.

-   **/src/app/**: Contains all the application's routes.
    -   `/page.tsx`: The main landing page, "My Trips".
    -   `/trips/[tripId]/page.tsx`: The detailed timeline view for a single trip.
    -   `/trips/[tripId]/locations/[locationId]/page.tsx`: The detailed planning page for a specific location within a trip.
    -   `/auth/reset-password/page.tsx`: Custom password reset confirmation page.
    -   `/actions.ts`: Houses server-side functions (Next.js Server Actions) that can be called from client components, primarily for communicating with external APIs like Pexels.
    -   `/layout.tsx`: The root layout for the entire application.
    -   `/globals.css`: Global styles and Tailwind CSS theme configuration.
-   **/src/ai/**: Contains all Genkit-related code for AI features.
    -   `/genkit.ts`: Initializes and configures the global Genkit `ai` instance.
    -   `/flows/`: Directory for individual Genkit flows.
        -   `suggestActivitiesFlow.ts`: The flow responsible for generating activity suggestions.
-   **/src/components/**: Contains all React components.
    -   `/ui/`: Contains all the reusable UI components from the ShadCN library.
    -   `/AuthForm.tsx`: User authentication form with sign-in, sign-up, and Google auth.
    -   `/AuthWrapper.tsx`: Wrapper component that handles authentication state.
    -   `/ShareTripDialog.tsx`: Dialog for sharing trips with other users.
    -   `/PendingInvitations.tsx`: Component for displaying and managing trip invitations.
    -   `/DeleteTripDialog.tsx`: Confirmation dialog for deleting trips or leaving shared trips.
    -   `/TripImage.tsx`: Enhanced image component with loading states and intelligent fallbacks.
-   **/src/hooks/**: Contains custom React hooks.
    -   `/useAuth.ts`: Custom hook for Firebase Authentication state management.
    -   `/use-toast.ts`: Logic for the global toast notification system.
    -   `/use-mobile.tsx`: Hook for mobile device detection.
-   **/src/lib/**: Contains utility functions and Firebase configuration.
    -   `/firebase.ts`: Firebase app initialization and configuration.
    -   `/firestore.ts`: Firestore database operations and data models.
    -   `/defaultImages.ts`: Intelligent theme-based default image system.
    -   `/utils.ts`: Home to the `cn` utility for merging Tailwind classes.
-   **/public/**: For static assets (currently unused).
-   **Root Directory**:
    -   `next.config.ts`: Next.js configuration file.
    -   `tailwind.config.ts`: Tailwind CSS configuration file.
    -   `vercel.json`: Vercel deployment configuration.
    -   `.env.local`: For storing secret environment variables like API keys. **This file is not checked into version control.**

## 2. State Management & Data Persistence

The application now uses Firebase for robust, cloud-based data persistence and user authentication.

-   **Primary Data Store**: All trip data is stored in **Firebase Firestore** with real-time synchronization.
-   **Authentication**: Firebase Authentication handles user sign-up, sign-in, password reset, and Google authentication.
-   **Data Structure**: 
    -   `trips` collection: Stores trip documents with owner, editors, and viewers permissions
    -   `invitations` collection: Stores pending trip invitations for collaborative features
    -   `locationImages` collection: Caches Pexels images for location banners to reduce API calls
-   **Mechanism**:
    1.  Users must authenticate to access the application.
    2.  Trip data is fetched from Firestore based on user permissions (owned, edited, or viewed trips).
    3.  All modifications are immediately saved to Firestore with real-time updates.
    4.  Collaborative features allow users to share trips with specific permissions (edit/view).
-   **Benefits**: Data is now shareable, accessible across devices, and supports real-time collaboration.

## 3. Authentication System

-   **Firebase Authentication**: Handles user registration, login, and session management.
-   **AuthWrapper**: Wraps the entire application to ensure users are authenticated before accessing features.
-   **AuthForm**: Provides sign-in, sign-up, "forgot password", and Google authentication options.
-   **Session Management**: Automatic session persistence and secure token handling.

## 4. Image System Architecture

### 4.1 Default Image System (`/src/lib/defaultImages.ts`)
-   **Purpose**: Provides intelligent fallback images for trip cards when primary images fail or are unavailable.
-   **Implementation**: 
    -   Theme-based image selection with 10 different categories (asia, europe, america, africa, australia, beach, mountains, forest, desert, city)
    -   Keyword matching algorithm that analyzes trip titles and locations to determine appropriate themes
    -   Synchronous operation to avoid TypeScript conflicts between client and server components
    -   Fallback to high-quality Pexels images for each theme
-   **Usage**: Integrated into `TripImage` component for automatic fallback when primary images fail

### 4.2 Pexels API Integration (`/src/app/actions.ts`)
-   **Purpose**: Fetches dynamic, high-quality images for location page banners.
-   **Implementation**:
    -   Server-side API calls using Next.js Server Actions to protect API keys
    -   Intelligent query generation based on location names (e.g., "Vancouver iconic landscape")
    -   Firestore-based caching system to reduce API calls and improve performance
    -   Comprehensive error handling and fallback mechanisms
-   **Caching Strategy**: 
    -   Images are cached in Firestore `locationImages` collection
    -   Cache includes image URL, alt text, photographer attribution, and timestamp
    -   Reduces Pexels API usage and improves load times for repeat visits

### 4.3 TripImage Component (`/src/components/TripImage.tsx`)
-   **Purpose**: Robust image display with intelligent fallbacks and loading states.
-   **Features**:
    -   Loading animations with camera icon
    -   Error state with gradient background and location information
    -   Automatic fallback to theme-appropriate default images
    -   Placeholder detection for invalid or missing image URLs
    -   Proper z-index management to prevent visual conflicts

## 5. Collaborative Features

-   **Trip Sharing**: Users can share trips with other JourneyBoard users via email.
-   **Permission Levels**: Edit access (can modify trip) and view access (read-only).
-   **Invitation System**: Pending invitations are displayed and can be accepted/declined.
-   **Real-time Updates**: Changes are synchronized across all collaborators in real-time.

## 6. Server Actions (`/src/app/actions.ts`)

To securely interact with external APIs without exposing secret keys, the application uses Next.js Server Actions.

-   **Purpose**: These are functions that are guaranteed to run only on the server.
-   **Current Use**: 
    -   `getPexelsImageForLocationPage`: Fetches location-specific banner images
    -   `testPexelsAPI`: Diagnostic function for API connection testing
    -   All functions use proper Bearer token authentication for Pexels API
-   **Security**: API keys are stored server-side and never exposed to the client.

## 7. Genkit AI Flows (`/src/ai/flows/`)

AI-powered features are encapsulated within Genkit flows.

-   **Purpose**: Flows define a series of steps for an AI-powered task. They handle prompting, data formatting, and interaction with the underlying generative model (e.g., Gemini).
-   **Current Use**: `suggestActivitiesFlow.ts` defines the logic for generating travel suggestions. It takes structured trip context as input, formats it into a detailed prompt for the LLM, and specifies the desired output format using Zod schemas. This makes the AI's output predictable and easy to parse on the client.

## 8. Deployment & Hosting

-   **Vercel**: Production hosting with automatic deployments from GitHub.
-   **Environment Variables**: Securely managed through Vercel's environment variable system.
-   **Firebase Integration**: Firebase project configured for production use with proper security rules and indexes.

## 9. Technical Implementation Details

### 9.1 Image System Flow
1. **Trip Card Display**: `TripImage` component checks if primary image URL is valid
2. **Fallback Logic**: If invalid, uses theme-based default image from `defaultImages.ts`
3. **Location Banner**: Server action fetches from Pexels API with location-specific queries
4. **Caching**: Successful fetches are stored in Firestore for future use
5. **Error Handling**: Multiple fallback layers ensure images always display

### 9.2 Data Flow for Collaborative Features
1. **Trip Creation**: Owner creates trip with `ownerId` field
2. **Sharing**: Owner sends invitation via `ShareTripDialog`
3. **Invitation Storage**: Invitation stored in Firestore `invitations` collection
4. **Acceptance**: Recipient accepts invitation, gets added to trip's `editors` or `viewers` array
5. **Real-time Sync**: All collaborators see updates immediately

### 9.3 Error Handling Strategy
- **API Failures**: Graceful fallbacks to cached images or default themes
- **Authentication Errors**: Clear error messages and retry mechanisms
- **Network Issues**: Offline-friendly design with local state management
- **Data Validation**: Zod schemas ensure data integrity throughout the application
