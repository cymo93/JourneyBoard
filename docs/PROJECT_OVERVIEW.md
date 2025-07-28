
# Project Documentation: JourneyBoard

## 1. High-Level Summary

**JourneyBoard** is a web-based, AI-powered travel planning application. It allows users to create multi-location trip itineraries, visualize them on a timeline, and receive intelligent suggestions for activities. The core experience is designed to be highly visual, interactive, and intuitive, leveraging AI to reduce the cognitive load of travel planning.

The application is built as a single-page application (SPA) using a modern web stack.

## 2. Target Audience

The primary users are individuals or small groups planning personal or leisure trips. They value a simple, clean interface and appreciate smart features that help them organize their thoughts and discover new activities.

## 3. Core Purpose & Vision

The vision for JourneyBoard is to be more than just a note-taking app for travel. It aims to be an intelligent travel partner that understands the context of a user's entire trip to provide relevant, timely, and personalized suggestions. It prioritizes a seamless user experience where planning feels less like a chore and more like part of the adventure itself.

## 4. Technology Stack

The application is built on a predefined tech stack optimized for modern web development and AI integration.

- **Frontend Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Components**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Library**: [ShadCN UI](https://ui.shadcn.com/) - A collection of accessible and composable components.
- **AI Integration**: [Genkit (by Firebase)](https://firebase.google.com/docs/genkit) - A framework for building production-ready AI-powered features.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Service**: [Pexels API](https://www.pexels.com/api/) for dynamic, high-quality imagery.
- **State Management**: Client-side state is managed using a combination of React hooks (`useState`, `useEffect`) and browser `localStorage` for data persistence.
