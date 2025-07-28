
# Technical Debt, Known Issues, and Future Improvements

This document outlines the current limitations of the JourneyBoard application and suggests potential areas for future development. It is intended to give a new development agent a transparent overview of the project's state.

## 1. Core Architectural Limitations

### **State Management & Data Persistence**

-   **The Biggest Shortcoming**: The entire application relies on `localStorage` for data persistence.
    -   **Problem**: This means all user data is confined to a single browser on a single device. There is no account system, no cloud backup, and no way to share or collaborate on trips. This is the most significant piece of technical debt and the primary blocker to making the application publicly available and shareable.
    -   **Improvement Path**: The highest-priority future work is to implement a proper backend and database solution. The following steps should be taken by the next agent to make the application production-ready:
        1.  **Implement Authentication**: Add a user authentication system. A service like **Firebase Authentication** is recommended to manage user sign-up, login, and session management.
        2.  **Implement a Cloud Database**: Replace all `localStorage` logic with a cloud database. **Firestore** is recommended. A `trips` collection should be created, where each document represents a trip and is associated with a `userId` from the authentication system.
        3.  **Refactor State Logic**: All instances of `localStorage.getItem('trips')` and `localStorage.setItem('trips')` must be removed. They should be replaced with API calls to the new backend to fetch and save trip data from Firestore. This will involve:
            -   Fetching trips for the currently logged-in user when the main page loads.
            -   Updating the Firestore document for a trip whenever a change is made (e.g., adding a location, changing a date, updating an activity).

## 2. Known Issues & Minor Bugs

-   **Sub-Optimal Date Shifting**: When a date is added or removed from a location, all subsequent locations have their dates shifted forward or backward by one day.
    -   **Problem**: This logic is simplistic. It assumes a linear trip. It doesn't account for complex travel days or non-sequential location planning. A user might want to insert a day in the middle of a location without affecting the start date of the next location.
    -   **Improvement Path**: Refactor the date-shifting logic to be more intelligent or give the user more direct control over how date changes propagate through their itinerary.

-   **Initial Data Loading**: The `initialTrips` data is hardcoded in `src/app/page.tsx`.
    -   **Problem**: This is not ideal for a real application. It serves as a good demo but is inflexible.
    -   **Improvement Path**: Once a database is implemented, this should be replaced with a check for a logged-in user and fetching their trips from the database. For new users, a template or a clean slate should be presented.

## 3. Potential Future Features & Enhancements

### **UX/UI Improvements**

-   **Drag-and-Drop Reordering**:
    -   Allow users to reorder locations on the Trip Timeline page via drag-and-drop.
    -   Allow users to reorder `DateBlock` cards within a location.
    -   Allow users to reorder activity items within a day.

-   **"Suggest Durations" Feature**: The button exists on the Trip Timeline page but has no functionality.
    -   **Improvement Path**: Implement an AI flow that suggests the optimal number of days to spend in each location based on the user's interests and the locations themselves. The flow could update the `dateBlocks` for each location automatically.

-   **Budgeting Feature**:
    -   Add a section for tracking trip expenses, either per-location or per-day.

-   **Booking Integrations**:
    -   The "Find Hotels" button currently links to a pre-filled Booking.com search. This could be enhanced.
    -   Integrate with flight and hotel booking APIs to show real-time prices or allow booking directly within the app.

### **AI Enhancements**

-   **Real-time AI Suggestions**: Instead of clicking a button, the AI could proactively offer suggestions as a user adds activities.
-   **Image Generation**: Instead of fetching images from Pexels, use a generative image model (like `gemini-2.0-flash-preview-image-generation`) to create a unique cover image for each trip based on its title and locations.
-   **Itinerary Optimization**: Create an AI flow that can review a user's entire plan and suggest optimizations (e.g., "The museum you planned for Tuesday is closed that day, I suggest moving it to Wednesday."). This would require the AI to have access to tools that can check real-world data like opening hours.
-   **Multi-Modal Input**: Allow users to upload a photo of a landmark and have the AI identify it and suggest related activities.
