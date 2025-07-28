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
- **Beautiful Imagery**: Dynamic, high-quality images from Pexels API for trip cards and location banners.

## Technology Stack:

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components
- **Authentication**: Firebase Authentication (email/password + Google)
- **Database**: Firebase Firestore with real-time listeners
- **AI Integration**: Firebase Genkit with Gemini AI
- **Image Service**: Pexels API for dynamic travel imagery
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

## User Experience:

- **Intuitive Navigation**: Clear, consistent navigation patterns throughout the application.
- **Real-time Feedback**: Immediate visual feedback for all user actions with toast notifications.
- **Loading States**: Smooth loading animations and skeleton screens for better perceived performance.
- **Error Handling**: Graceful error handling with helpful error messages and recovery options.
- **Mobile-First**: Optimized touch interactions and responsive design for mobile users.