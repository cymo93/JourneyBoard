
# Feature Specifications & User Acceptance Criteria

This document details each feature of the JourneyBoard application, its intended user journey, and the criteria for its successful implementation.

---

### 1. My Trips Page (Homepage)

-   **File**: `src/app/page.tsx`
-   **User Journey**:
    1.  The user lands on the homepage and sees a grid of all their planned trips.
    2.  Each trip is represented by a card with a title, dates, and a representative image.
    3.  The user can create a new trip by clicking the "Create New Trip" button, which opens a dialog.
    4.  In the dialog, the user enters a title and a start date, then clicks "Create Trip".
    5.  Upon creation, the user is automatically navigated to the detailed page for their new trip.
    6.  The user can click on any existing trip card to navigate to its detailed timeline page.
    7.  The user can hover over a trip card's image to reveal a "refresh" icon, allowing them to fetch a new image from Pexels.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ All trips stored in `localStorage` are displayed as cards.
    -   ✅ If no trips are in `localStorage`, initial sample data is loaded and displayed.
    -   ✅ Each trip card displays the trip title, date range, and a list of locations.
    -   ✅ Each trip card has a dynamic background image fetched from Pexels based on its first location. Placeholder images are shown during loading.
    -   ✅ The "Create New Trip" dialog successfully adds a new trip object to the state and `localStorage`.
    -   ✅ After creating a trip, the user is redirected to `/trips/[new_trip_id]`.
    -   ✅ Clicking a trip card navigates the user to `/trips/[trip_id]`.
    -   ✅ The "refresh image" button successfully fetches a new image from Pexels and updates the UI and `localStorage`.

---

### 2. Trip Timeline Page

-   **File**: `src/app/trips/[tripId]/page.tsx`
-   **User Journey**:
    1.  The user arrives from the "My Trips" page.
    2.  They see the trip title, overall date range, and a list of location cards arranged chronologically.
    3.  Each location card shows the location name, its duration, and a horizontal timeline of its dates.
    4.  The user can add a new date to a location by clicking the "+" button within that location's card. This shifts the dates of all subsequent locations.
    5.  The user can delete a date from a location (if it has more than one). This shifts the dates of all subsequent locations.
    6.  The user can add a new location to the trip.
    7.  The user can edit a location's name or delete the location entirely.
    8.  The user can click a "Share" button to copy the trip's URL to their clipboard.
    9.  The user can click on a location card (but not its buttons) to navigate to the detailed location planning page.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ The page correctly loads and displays data for the specified `tripId`.
    -   ✅ Locations are displayed in chronological order.
    -   ✅ Adding/deleting dates correctly updates the UI and shifts subsequent location dates.
    -   ✅ A location must have at least one day; deleting the last day is prevented with a toast message.
    -   ✅ Deleting a location removes it and shifts subsequent locations' dates correctly.
    -   ✅ Location names can be edited and saved.
    -   ✅ The "Share" button copies the current URL to the clipboard and shows a confirmation toast.
    -   ✅ Clicking a location card navigates to `/trips/[tripId]/locations/[locationId]`.

---

### 3. Location Planning Page

-   **File**: `src/app/trips/[tripId]/locations/[locationId]/page.tsx`
-   **User Journey**:
    1.  The user arrives from the Trip Timeline page.
    2.  They see a large, dynamic banner image of the location at the top. The banner shrinks as the user scrolls down.
    3.  The location name and its date range are displayed prominently over the banner.
    4.  Below the banner, they see a grid of cards, one for each day of their stay in that location.
    5.  Inside each date card, the user can add activities by typing in a `Textarea`.
    6.  Pressing `Enter` in an activity note creates a new activity line below it. Pressing `Backspace` on an empty line deletes it.
    7.  The user can click the "Generate Suggestions" button in the header.
    8.  An "AI-Powered Suggestions" card appears below. The user can provide additional text input to refine the AI's suggestions.
    9.  The AI generates a day-by-day plan which is displayed in a read-only text area, from which the user can copy text to paste into their daily activity notes.
    10. The user can click the banner image to view the original on Pexels, and the location title to view it on Google Maps.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ The page correctly loads and displays data for the specified `locationId`.
    -   ✅ A high-quality banner image from Pexels is fetched and displayed. It shrinks on scroll.
    -   ✅ The location title links to Google Maps. The banner image links to Pexels.
    -   ✅ Date cards are displayed chronologically.
    -   ✅ Users can add, edit, and delete activity notes for each day. Changes are saved to `localStorage`.
    -   ✅ The "Generate Suggestions" button correctly calls the Genkit flow with the full trip context.
    -   ✅ The AI suggestion card appears after the button is clicked.
    -   ✅ The AI's response is displayed in the text area. The loading state is clearly indicated.
    -   ✅ The user can type in the input field to refine AI suggestions on subsequent requests.

---
### 4. Pexels Image Integration

-   **File**: `src/app/actions.ts`
-   **User Journey**: This is a background feature. The user experiences it through the dynamic images on the "My Trips" and "Location" pages.
-   **User Acceptance Criteria (UAC)**:
    -   ✅ The Pexels API key is stored securely in `.env.local` and is never exposed to the client.
    -   ✅ Server actions handle all API requests to Pexels.
    -   ✅ The app fetches different image resolutions (`large` vs. `large2x`) for different contexts (trip card vs. location banner) to optimize performance.
    -   ✅ The "refresh" functionality fetches a new, random image to avoid repetition.
    -   ✅ The Next.js image config in `next.config.ts` is correctly configured to allow the `images.pexels.com` domain.

---

### 5. AI Suggestion Generation

-   **File**: `src/ai/flows/suggestActivitiesFlow.ts`
-   **User Journey**: The user interacts with this feature via the "Generate Suggestions" button on the location page.
-   **User Acceptance Criteria (UAC)**:
    -   ✅ The Genkit flow is defined with clear input and output schemas (Zod).
    -   ✅ The flow's prompt correctly uses Handlebars templating to inject dynamic context (location name, trip duration, itinerary, user prompt, etc.).
    -   ✅ The prompt instructs the AI to consider the trip's pacing (e.g., energy levels at the start vs. end of the trip).
    -   ✅ The AI's output is formatted as a simple, day-by-day text list as specified in the prompt.
    -   ✅ The flow successfully returns the generated text to the client-side component.
