
# Architecture Overview

This document provides a technical overview of the JourneyBoard application's architecture.

## 1. File Structure

The project follows a standard Next.js App Router structure.

-   **/src/app/**: Contains all the application's routes.
    -   `/page.tsx`: The main landing page, "My Trips".
    -   `/trips/[tripId]/page.tsx`: The detailed timeline view for a single trip.
    -   `/trips/[tripId]/locations/[locationId]/page.tsx`: The detailed planning page for a specific location within a trip.
    -   `/actions.ts`: Houses server-side functions (Next.js Server Actions) that can be called from client components, primarily for communicating with external APIs like Pexels.
    -   `/layout.tsx`: The root layout for the entire application.
    -   `/globals.css`: Global styles and Tailwind CSS theme configuration.
-   **/src/ai/**: Contains all Genkit-related code for AI features.
    -   `/genkit.ts`: Initializes and configures the global Genkit `ai` instance.
    -   `/flows/`: Directory for individual Genkit flows.
        -   `suggestActivitiesFlow.ts`: The flow responsible for generating activity suggestions.
-   **/src/components/ui/**: Contains all the reusable UI components from the ShadCN library.
-   **/src/hooks/**: Contains custom React hooks.
    -   `use-toast.ts`: Logic for the global toast notification system.
-   **/src/lib/**: Contains utility functions.
    -   `utils.ts`: Home to the `cn` utility for merging Tailwind classes.
-   **/public/**: For static assets (currently unused).
-   **Root Directory**:
    -   `next.config.ts`: Next.js configuration file.
    -   `tailwind.config.ts`: Tailwind CSS configuration file.
    -   `.env.local`: For storing secret environment variables like API keys. **This file is not checked into version control.**

## 2. State Management

The application's state management is intentionally simple and relies on client-side persistence.

-   **Primary Data Store**: All trip data (titles, locations, dates, activities) is stored in the browser's **`localStorage`**.
-   **Mechanism**:
    1.  On initial load, the app checks `localStorage` for an item named `'trips'`.
    2.  If it exists, the data is parsed and loaded into the component state (`useState`).
    3.  If it does not exist, `initialTrips` (hardcoded sample data) is used to populate the state and is then immediately saved to `localStorage`.
    4.  **Any modification** to the trip data (e.g., adding a location, changing a date, typing a note) triggers an update to the component's state.
    5.  A `useEffect` hook watches for changes in the state and immediately writes the entire updated data structure back to `localStorage`.
-   **Rationale**: This approach avoids the need for a backend database and user authentication, making the application lightweight and entirely client-side for rapid prototyping.
-   **Limitation**: Data is tied to the user's specific browser. It is not shareable or accessible across different devices. For the path to resolving this, see the `TECHNICAL_DEBT_AND_IMPROVEMENTS.md` document.

## 3. Server Actions (`/src/app/actions.ts`)

To securely interact with external APIs without exposing secret keys, the application uses Next.js Server Actions.

-   **Purpose**: These are functions that are guaranteed to run only on the server.
-   **Current Use**: The `getPexelsImage`, `getNewPexelsImage`, and `getPexelsImageForLocationPage` actions handle all communication with the Pexels API. They use the `PEXELS_API_KEY` stored in `.env.local` on the server, fetch image data, and return only the necessary information (like image URLs) to the client.

## 4. Genkit AI Flows (`/src/ai/flows/`)

AI-powered features are encapsulated within Genkit flows.

-   **Purpose**: Flows define a series of steps for an AI-powered task. They handle prompting, data formatting, and interaction with the underlying generative model (e.g., Gemini).
-   **Current Use**: `suggestActivitiesFlow.ts` defines the logic for generating travel suggestions. It takes structured trip context as input, formats it into a detailed prompt for the LLM, and specifies the desired output format using Zod schemas. This makes the AI's output predictable and easy to parse on the client.
