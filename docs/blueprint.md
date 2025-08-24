# **App Name**: JourneyBoard

## Core Features:

- **Authentication System**: User registration, login, password reset, and Google authentication via Firebase.
- **Calendar Interface**: Display a calendar interface for planning trips, visually showing dates, travel days, and duration of stays.
- **Location Management**: Allow users to add locations row-by-row to the calendar to organize their trip.
- **Date Addition**: Enable users to add date blocks within each location row by clicking an 'Add Date' button.
- **Travel Day Overlap**: Automatically create the first day block of every new location using the last day of the previous location, signalling a travel day overlap.
- **Dynamic Date Calculation**: Automatically re-compute the number of nights and the end date as dates are added or removed.
- **Hotel Integration**: Open Hotels.com using the row's first and last dates as check-in and check-out dates, facilitating hotel bookings.
- **Collaborative Planning**: Share trips with other users with edit or view permissions.
- **Real-time Synchronization**: All changes are synchronized across devices and collaborators in real-time.
- **AI-Powered Suggestions**: Generate intelligent activity suggestions for each location using Genkit AI.
- **Intelligent Image System**: Dynamic, high-quality images from Pexels API with intelligent fallbacks and theme-based defaults.
- **Trip Management**: Create, edit, delete, and share trips with comprehensive permission management.
- **Enhanced Trip Cards**: Beautiful trip cards with days/nights calculation, location-specific images, and streamlined actions.
- **Onboarding Experience**: Sample trips for new users with proper management and deletion capabilities.
- **Navigation**: Intuitive navigation with clickable header and consistent user experience.

## Technology Stack:

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components
- **Authentication**: Firebase Authentication (email/password + Google)
- **Database**: Firebase Firestore with real-time listeners
- **AI Integration**: Firebase Genkit with Gemini AI
- **Image Services**: 
  - Pexels API for dynamic travel imagery
  - Intelligent default image system with theme-based selection
  - Dynamic location-based image fetching for trip cards
  - Firestore-based image caching for performance
- **API Architecture**: Next.js API routes for secure client-side external API calls
- **Deployment**: Vercel with automatic GitHub integration
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date formatting and calculations

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
- **Hover Effects**: Smooth scaling and enhanced shadows for better interaction feedback.
- **Visual Hierarchy**: Enhanced spacing, typography, and color contrast throughout the application.

## User Experience:

- **Intuitive Navigation**: Clear, consistent navigation patterns throughout the application with clickable header.
- **Real-time Feedback**: Immediate visual feedback for all user actions with toast notifications.
- **Loading States**: Smooth loading animations and skeleton screens for better perceived performance.
- **Error Handling**: Graceful error handling with helpful error messages and recovery options.
- **Mobile-First**: Optimized touch interactions and responsive design for mobile users.
- **Visual Appeal**: High-quality images and smooth animations that enhance the travel planning experience.
- **Collaborative Features**: Seamless sharing and real-time collaboration with clear permission management.
- **Enhanced Trip Cards**: Beautiful cards with days/nights information, location-specific images, and streamlined actions.
- **Onboarding**: Sample trips help new users understand the app's capabilities with proper management.

## Current Implementation Status:

### ✅ Fully Implemented
- **Authentication**: Complete Firebase Auth integration with email/password and Google OAuth
- **Trip Management**: Create, edit, delete, and share trips with comprehensive permissions
- **Location Planning**: Full location and date management with automatic date continuity
- **Collaborative Features**: Trip sharing, invitations, and real-time synchronization
- **Image System**: Intelligent default images, Pexels API integration, and dynamic location-based trip images
- **AI Integration**: Genkit-powered activity suggestions for locations
- **Cloud Deployment**: Production-ready deployment on Vercel with Firebase backend
- **Enhanced UI/UX**: Improved trip cards with days/nights calculation and streamlined actions
- **Navigation**: Clickable header for easy navigation back to home page
- **Onboarding**: Sample trip management with enhanced delete functionality

### 🔄 Recent Major Improvements
- **Enhanced Trip Card UI/UX**: Complete overhaul with days/nights calculation, smooth hover effects, and streamlined actions
- **Dynamic Location-Based Trip Images**: Trip cards now display images specific to trip destinations
- **Onboarding Trip Management**: Special handling for sample trips with enhanced delete functionality
- **Navigation Improvements**: Clickable JourneyBoard header for better navigation
- **API Route Architecture**: Proper separation of client and server concerns for production compatibility
- **Pexels API Integration**: Dynamic location banners with proper authentication and caching
- **Error Handling**: Comprehensive error handling and diagnostic tools
- **Performance**: Optimized image loading and caching strategies

### 📋 Known Limitations
- **Default Image Variety**: All themes currently use the same fallback image (simplified implementation)
- **API Rate Limiting**: Pexels API calls are limited and may fail during high usage
- **Offline Support**: Limited offline functionality without additional implementation
- **Image Optimization**: Not using Next.js Image optimization features (future improvement)

## Future Enhancements:

### Short-term (1-3 months)
- **Dynamic Default Images**: Fetch unique Pexels images for each theme with Firestore caching
- **Image Optimization**: Implement Next.js Image optimization for better performance
- **Mobile Enhancements**: Touch-friendly interactions and gestures
- **Loading States**: Improved loading animations and skeleton screens

### Medium-term (3-6 months)
- **Offline Support**: Service worker for offline trip viewing
- **Export Functionality**: PDF/print-friendly trip summaries
- **Calendar Integration**: Sync with Google Calendar/Apple Calendar
- **Map Integration**: Visual map view of trip locations
- **Advanced AI**: Real-time suggestions and itinerary optimization

### Long-term (6+ months)
- **AI-Powered Insights**: Advanced analytics and trip optimization
- **Social Features**: Public trip sharing and discovery
- **Mobile App**: Native iOS/Android applications
- **Advanced Integrations**: Booking platforms, weather, transportation
- **Multi-language Support**: Internationalization for global users

## Technical Achievements:

- **Production-Ready Architecture**: Scalable, secure, and performant application
- **Real-time Collaboration**: Seamless sharing and synchronization across devices
- **Intelligent Image System**: Multiple fallback layers ensure beautiful visuals always display
- **API Security**: All external API keys properly secured server-side
- **Performance Optimization**: Efficient caching and loading strategies
- **User Experience**: Polished interface with smooth animations and intuitive interactions
- **Scalability**: Architecture supports growth to thousands of users