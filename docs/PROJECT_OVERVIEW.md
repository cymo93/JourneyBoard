
# Project Documentation: JourneyBoard

## 1. High-Level Summary

**JourneyBoard** is a web-based, AI-powered travel planning application. It allows users to create multi-location trip itineraries, visualize them on a timeline, and receive intelligent suggestions for activities. The core experience is designed to be highly visual, interactive, and intuitive, leveraging AI to reduce the cognitive load of travel planning.

The application is built as a single-page application (SPA) using a modern web stack with cloud-based data persistence and user authentication. It features a sophisticated image system that provides beautiful, contextually relevant visuals for trips and locations.

## 2. Target Audience

The primary users are individuals or small groups planning personal or leisure trips. They value a simple, clean interface and appreciate smart features that help them organize their thoughts and discover new activities. The app now supports collaborative trip planning, allowing users to share trips with friends and family.

## 3. Core Purpose & Vision

The vision for JourneyBoard is to be more than just a note-taking app for travel. It aims to be an intelligent travel partner that understands the context of a user's entire trip to provide relevant, timely, and personalized suggestions. It prioritizes a seamless user experience where planning feels less like a chore and more like part of the adventure itself. The app now supports real-time collaboration, making it perfect for group travel planning.

## 4. Technology Stack

The application is built on a predefined tech stack optimized for modern web development and AI integration.

- **Frontend Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Components**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Library**: [ShadCN UI](https://ui.shadcn.com/) - A collection of accessible and composable components.
- **AI Integration**: [Genkit (by Firebase)](https://firebase.google.com/docs/genkit) - A framework for building production-ready AI-powered features.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Services**: 
  - [Pexels API](https://www.pexels.com/api/) for dynamic, high-quality imagery
  - Intelligent default image system with theme-based fallbacks
- **Authentication & Database**: [Firebase](https://firebase.google.com/) - Authentication, Firestore database, and hosting.
- **State Management**: Client-side state is managed using React hooks (`useState`, `useEffect`) with Firebase Firestore for data persistence and real-time synchronization.
- **Cloud Hosting**: [Vercel](https://vercel.com/) for production deployment.

## 5. Recent Major Updates

### 5.1 Image System Overhaul (Latest)
- **Problem Solved**: Trip cards were showing ugly grey placeholders and visual conflicts
- **Solution**: Implemented intelligent default image system with theme-based selection
- **Implementation**: 
  - 10 different themes (asia, europe, america, africa, australia, beach, mountains, forest, desert, city)
  - Keyword-based theme detection from trip titles and locations
  - Synchronous fallback system to avoid TypeScript conflicts
  - Clean gradient backgrounds with location information when images fail

### 5.2 Pexels API Integration
- **Problem Solved**: Location pages lacked visual appeal with plain backgrounds
- **Solution**: Dynamic image fetching from Pexels API for location banners
- **Implementation**:
  - Server-side API calls to avoid exposing API keys
  - Firestore-based image caching to reduce API calls
  - Intelligent query generation based on location names
  - Fallback system for API failures

### 5.3 Collaborative Features
- **Problem Solved**: Users couldn't share trips with friends and family
- **Solution**: Complete sharing system with invitation management
- **Implementation**:
  - Trip ownership and permission levels (owner, editor, viewer)
  - Email-based invitation system
  - Pending invitations UI
  - Accept/decline functionality

### 5.4 Firebase Migration
- **Problem Solved**: Data was stored locally and lost on browser refresh
- **Solution**: Complete migration to Firebase Authentication and Firestore
- **Implementation**:
  - User authentication with email/password and Google OAuth
  - Password reset functionality
  - Real-time data synchronization
  - Secure data access with Firestore rules

## 6. Current Status

### 6.1 Fully Implemented Features
- ✅ User authentication (email/password, Google OAuth, password reset)
- ✅ Trip creation and management
- ✅ Location-based trip planning with date continuity
- ✅ Activity planning and notes
- ✅ Collaborative trip sharing
- ✅ Intelligent default image system
- ✅ Pexels API integration for location banners
- ✅ Cloud deployment on Vercel
- ✅ Responsive design for mobile and desktop

### 6.2 Known Issues
- **Pexels API Rate Limiting**: API calls are limited and may fail during high usage
- **Image Caching**: Some images may not cache properly on first load
- **Default Image Variety**: All themes currently use the same fallback image (limitation of simplified system)

### 6.3 Technical Requirements
- **Environment Variables**: 
  - `PEXELS_API_KEY`: Required for location banner images
  - Firebase configuration variables
- **Firestore Indexes**: Composite indexes required for trip queries
- **Firestore Rules**: Security rules configured for collaborative features

## 7. Enhancement Recommendations

### 7.1 Short-term Improvements
- **Image System**: Implement dynamic Pexels fetching for default images with Firestore caching
- **Error Handling**: Better error messages for API failures
- **Loading States**: Improved loading animations for image fetching
- **Image Optimization**: Implement Next.js Image optimization for better performance

### 7.2 Medium-term Features
- **Offline Support**: Service worker for offline trip viewing
- **Export Functionality**: PDF/print-friendly trip summaries
- **Calendar Integration**: Sync with Google Calendar/Apple Calendar
- **Map Integration**: Visual map view of trip locations

### 7.3 Long-term Vision
- **AI-Powered Suggestions**: Activity recommendations based on location and preferences
- **Social Features**: Public trip sharing and discovery
- **Mobile App**: Native iOS/Android applications
- **Advanced Analytics**: Trip statistics and insights
