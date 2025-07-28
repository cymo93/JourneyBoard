
# Feature Specifications & User Acceptance Criteria

This document details each feature of the JourneyBoard application, its intended user journey, and the criteria for its successful implementation.

---

### 1. Authentication System

-   **Files**: `src/components/AuthForm.tsx`, `src/components/AuthWrapper.tsx`, `src/hooks/useAuth.ts`
-   **User Journey**:
    1.  Users must authenticate before accessing any features of the application.
    2.  New users can create an account with email/password or sign in with Google.
    3.  Existing users can sign in with their credentials.
    4.  Users can reset their password via email if forgotten.
    5.  After successful authentication, users are redirected to the main trips page.
    6.  Users can sign out at any time.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ Authentication is required to access the application.
    -   ✅ Email/password registration and sign-in work correctly.
    -   ✅ Google authentication integration works seamlessly.
    -   ✅ Password reset functionality sends emails and allows password changes.
    -   ✅ Session persistence works across browser refreshes.
    -   ✅ Sign-out functionality clears the session properly.

---

### 2. My Trips Page (Homepage)

-   **File**: `src/app/page.tsx`
-   **User Journey**:
    1.  The authenticated user lands on the homepage and sees a grid of all their trips (owned, edited, or viewed).
    2.  Each trip is represented by a card with a title, dates, and a beautiful representative image.
    3.  The user can create a new trip by clicking the "Create New Trip" button, which opens a dialog.
    4.  In the dialog, the user enters a title and a start date, then clicks "Create Trip".
    5.  Upon creation, the user is automatically navigated to the detailed page for their new trip.
    6.  The user can click on any existing trip card to navigate to its detailed timeline page.
    7.  The user can hover over a trip card to reveal share and delete buttons.
    8.  Pending trip invitations are displayed at the top of the page.
    9.  Permission badges show whether the user owns, edits, or can view each trip.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ All trips the user has access to are displayed as cards.
    -   ✅ Each trip card displays the trip title, date range, and a beautiful background image.
    -   ✅ Each trip card has a dynamic background image from Pexels or a curated default image.
    -   ✅ The "Create New Trip" dialog successfully adds a new trip to Firestore.
    -   ✅ After creating a trip, the user is redirected to `/trips/[new_trip_id]`.
    -   ✅ Clicking a trip card navigates the user to `/trips/[trip_id]`.
    -   ✅ Share and delete buttons are available on trip cards.
    -   ✅ Pending invitations are displayed and can be accepted/declined.
    -   ✅ Permission badges correctly show user access levels.

---

### 3. Trip Timeline Page

-   **File**: `src/app/trips/[tripId]/page.tsx`
-   **User Journey**:
    1.  The user arrives from the "My Trips" page.
    2.  They see the trip title, overall date range, and a list of location cards arranged chronologically.
    3.  Each location card shows the location name, its duration, and a horizontal timeline of its dates.
    4.  The user can add a new date to a location by clicking the "+" button within that location's card. This shifts the dates of all subsequent locations.
    5.  The user can delete a date from a location (if it has more than one). This shifts the dates of all subsequent locations.
    6.  The user can add a new location to the trip.
    7.  The user can edit a location's name or delete the location entirely.
    8.  The user can click a "Share" button to share the trip with other users via email.
    9.  The user can click a "Delete" button to delete the trip (owners) or leave the trip (collaborators).
    10. The user can click on a location card (but not its buttons) to navigate to the detailed location planning page.
    11. The user can click "Find Hotels" to search for accommodation in each location.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ The page correctly loads and displays data for the specified `tripId`.
    -   ✅ Locations are displayed in chronological order.
    -   ✅ Adding/deleting dates correctly updates the UI and shifts subsequent location dates.
    -   ✅ A location must have at least one day; deleting the last day is prevented with a toast message.
    -   ✅ Deleting a location removes it and shifts subsequent locations' dates correctly.
    -   ✅ Location names can be edited and saved.
    -   ✅ The "Share" button opens a dialog for sharing trips with other users.
    -   ✅ The "Delete" button shows appropriate confirmation dialog based on user permissions.
    -   ✅ Clicking a location card navigates to `/trips/[tripId]/locations/[locationId]`.
    -   ✅ "Find Hotels" button opens Booking.com with location and dates pre-filled.

---

### 4. Location Planning Page

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
    -   ✅ Users can add, edit, and delete activity notes for each day. Changes are saved to Firestore.
    -   ✅ The "Generate Suggestions" button correctly calls the Genkit flow with the full trip context.
    -   ✅ The AI suggestion card appears after the button is clicked.
    -   ✅ The AI's response is displayed in the text area. The loading state is clearly indicated.
    -   ✅ The user can type in the input field to refine AI suggestions on subsequent requests.

---

### 5. Trip Sharing & Collaboration

-   **Files**: `src/components/ShareTripDialog.tsx`, `src/components/PendingInvitations.tsx`
-   **User Journey**:
    1.  Trip owners can click "Share" on any trip to open the sharing dialog.
    2.  They enter an email address and select permission level (edit or view).
    3.  An invitation is created and the recipient receives a notification.
    4.  Recipients see pending invitations on their homepage.
    5.  They can accept or decline invitations.
    6.  Accepted invitations grant access to the shared trip with appropriate permissions.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ Trip owners can share trips with other users via email.
    -   ✅ Permission levels (edit/view) are correctly applied.
    -   ✅ Invitations are stored in Firestore and displayed to recipients.
    -   ✅ Recipients can accept or decline invitations.
    -   ✅ Accepted invitations grant appropriate access to shared trips.
    -   ✅ Real-time updates work for all collaborators.

---

### 6. Trip Deletion & Management

-   **File**: `src/components/DeleteTripDialog.tsx`
-   **User Journey**:
    1.  Users can click "Delete" on any trip they have access to.
    2.  A confirmation dialog appears with different text based on user permissions.
    3.  Owners see a "Delete Trip" option that permanently removes the trip for all collaborators.
    4.  Collaborators see a "Leave Trip" option that removes their access but keeps the trip available to others.
    5.  Users must type a confirmation phrase to proceed.
    6.  After confirmation, the action is executed and the user is redirected appropriately.

-   **User Acceptance Criteria (UAC)**:
    -   ✅ Different dialog text appears based on user permissions.
    -   ✅ Owners can permanently delete trips for all collaborators.
    -   ✅ Collaborators can leave trips without affecting other users.
    -   ✅ Confirmation phrase requirement prevents accidental deletions.
    -   ✅ Appropriate redirects occur after successful actions.

---

### 7. Enhanced Image System

-   **Files**: `src/components/TripImage.tsx`, `src/lib/defaultImages.ts`
-   **User Journey**: This is a background feature that enhances the visual experience.
-   **User Acceptance Criteria (UAC)**:
    -   ✅ Trip cards display beautiful, curated images from Pexels or default travel images.
    -   ✅ Images load with smooth animations and proper fallbacks.
    -   ✅ Location banners show high-quality landscape images.
    -   ✅ Image selection is intelligent and context-aware.
    -   ✅ Loading states and error handling work seamlessly.

---

### 8. Pexels Image Integration

-   **File**: `src/app/actions.ts`
-   **User Journey**: This is a background feature. The user experiences it through the dynamic images on the "My Trips" and "Location" pages.
-   **User Acceptance Criteria (UAC)**:
    -   ✅ The Pexels API key is stored securely in `.env.local` and is never exposed to the client.
    -   ✅ Server actions handle all API requests to Pexels.
    -   ✅ The app fetches different image resolutions (`large` vs. `large2x`) for different contexts (trip card vs. location banner) to optimize performance.
    -   ✅ The "refresh" functionality fetches a new, random image to avoid repetition.
    -   ✅ The Next.js image config in `next.config.ts` is correctly configured to allow the `images.pexels.com` domain.

---

### 9. AI Suggestion Generation

-   **File**: `src/ai/flows/suggestActivitiesFlow.ts`
-   **User Journey**: The user interacts with this feature via the "Generate Suggestions" button on the location page.
-   **User Acceptance Criteria (UAC)**:
    -   ✅ The Genkit flow is defined with clear input and output schemas (Zod).
    -   ✅ The flow's prompt correctly uses Handlebars templating to inject dynamic context (location name, trip duration, itinerary, user prompt, etc.).
    -   ✅ The prompt instructs the AI to consider the trip's pacing (e.g., energy levels at the start vs. end of the trip).
    -   ✅ The AI's output is formatted as a simple, day-by-day text list as specified in the prompt.
    -   ✅ The flow successfully returns the generated text to the client-side component.
