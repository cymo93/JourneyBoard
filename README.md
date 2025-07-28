# JourneyBoard

An AI-powered travel planning application built with Next.js, Firebase, and Genkit.

## Features

- **Trip Management**: Create and manage multi-location trips with visual timelines
- **AI-Powered Suggestions**: Get intelligent activity recommendations for each location
- **Dynamic Imagery**: High-quality travel images from Pexels API
- **User Authentication**: Secure user accounts with Firebase Authentication
- **Cloud Storage**: All data stored in Firestore for cross-device access

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JourneyBoard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md)
   - Create a `.env.local` file with your Firebase configuration

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:9002](http://localhost:9002)

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **Backend**: Firebase Authentication, Firestore
- **AI**: Genkit (Firebase AI)
- **Images**: Pexels API

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - Reusable UI components
- `src/lib/` - Firebase configuration and utilities
- `src/hooks/` - Custom React hooks
- `src/ai/` - Genkit AI flows
- `docs/` - Project documentation

## Documentation

- [Project Overview](./docs/PROJECT_OVERVIEW.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Feature Specifications](./docs/FEATURE_SPECIFICATIONS.md)
- [Technical Debt & Improvements](./docs/TECHNICAL_DEBT_AND_IMPROVEMENTS.md)
- [Firebase Setup Guide](./FIREBASE_SETUP.md)
