# **App Name**: JourneyBoard

## Core Features:

- **Authentication System**: User registration, login, password reset, and Google authentication via Firebase.
- **Calendar Interface**: Display a calendar interface for planning trips, visually showing dates, travel days, and duration of stays.
- **Location Management**: Allow users to add locations row-by-row to the calendar to organize their trip.
- **Date Addition**: Enable users to add date blocks within each location row by clicking an 'Add Date' button.
- **Travel Day Overlap**: Automatically create the first day block of every new location using the last day of the previous location, signalling a travel day overlap.
- **Dynamic Date Calculation**: Automatically re-compute the number of nights and the end date as dates are added or removed.
- **Hotel Integration**: Open a partner site using the row's first and last dates as check-in and check-out dates, facilitating hotel bookings.
- **Collaborative Planning**: Share trips with other users with edit or view permissions.
- **Real-time Synchronization**: All changes are synchronized across devices and collaborators in real-time.
- **AI-Powered Suggestions**: Generate intelligent activity suggestions for each location using Genkit AI.
- **Intelligent Image System**: Dynamic, high-quality images from Pexels API with intelligent fallbacks and theme-based defaults.
- **Trip Management**: Create, edit, delete, and share trips with comprehensive permission management.

## Technology Stack:

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components
- **Authentication**: Firebase Authentication (email/password + Google)
- **Database**: Firebase Firestore with real-time listeners
- **AI Integration**: Firebase Genkit with Gemini AI
- **Image Services**: 
  - Pexels API for dynamic travel imagery
  - Intelligent default image system with theme-based selection
  - Firestore-based image caching for performance
- **Deployment**: Vercel with automatic GitHub integration
- **Icons**: Lucide React for consistent iconography

## Style Guidelines:

- **Primary color**: A muted blue (#6699CC) evoking a sense of calm and trustworthiness, suitable for travel planning.
- **Background color**: Light gray (#F0F0F0), almost white, to provide a clean and unobtrusive backdrop that helps the calendar stand out.
- **Accent color**: A warm orange (#E67E22) is used to highlight key actions, like 'Add Date', and important dates.
- **Body font**: 'Inter', a sans-serif font for clean and readable display of location names, dates and descriptions.
- **Headline font**: 'Space Grotesk', sans-serif to give a slightly more techy and modern feel for headers, especially the Trip Title in the header.
- **Use a clean, grid-based layout** to present the calendar in an organized and intuitive manner.
- **Employ simple, clear icons** to represent actions such as 'Add Date' and external links like 'Find Hotels'.
- **Responsive design** that works seamlessly across desktop, tablet, and mobile devices.
- **Accessibility-first approach** with proper ARIA labels, keyboard navigation, and screen reader support.
- **Image System**: Beautiful, contextually relevant images with smooth loading states and intelligent fallbacks.

## User Experience:

- **Intuitive Navigation**: Clear, consistent navigation patterns throughout the application.
- **Real-time Feedback**: Immediate visual feedback for all user actions with toast notifications.
- **Loading States**: Smooth loading animations and skeleton screens for better perceived performance.
- **Error Handling**: Graceful error handling with helpful error messages and recovery options.
- **Mobile-First**: Optimized touch interactions and responsive design for mobile users.
- **Visual Appeal**: High-quality images and smooth animations that enhance the travel planning experience.
- **Collaborative Features**: Seamless sharing and real-time collaboration with clear permission management.

## Current Implementation Status:

### ✅ Fully Implemented
- **Authentication**: Complete Firebase Auth integration with email/password and Google OAuth
- **Trip Management**: Create, edit, delete, and share trips with comprehensive permissions
- **Location Planning**: Full location and date management with automatic date continuity
- **Collaborative Features**: Trip sharing, invitations, and real-time synchronization
- **Image System**: Intelligent default images and Pexels API integration with caching
- **AI Integration**: Genkit-powered activity suggestions for locations
- **Cloud Deployment**: Production-ready deployment on Vercel with Firebase backend

### 🔄 Recent Improvements
- **Image System Overhaul**: Resolved visual conflicts and implemented intelligent fallbacks
- **Pexels API Integration**: Dynamic location banners with proper authentication and caching
- **Error Handling**: Comprehensive error handling and diagnostic tools
- **Performance**: Optimized image loading and caching strategies

### 📋 Known Limitations
- **Default Image Variety**: All themes currently use the same fallback image (simplified implementation)
- **API Rate Limiting**: Pexels API calls are limited and may fail during high usage
- **Offline Support**: Limited offline functionality without additional implementation

## Future Enhancements:

- **Dynamic Default Images**: Fetch unique Pexels images for each theme
- **Advanced AI Features**: Real-time suggestions and itinerary optimization
- **Calendar Integration**: Sync with Google Calendar and other calendar services
- **Export Functionality**: PDF and print-friendly trip summaries
- **Mobile App**: Native iOS/Android applications
- **Social Features**: Public trip sharing and discovery