'use server';
/**
 * @fileOverview An AI flow for suggesting travel activities.
 *
 * - suggestActivities - A function that generates activity suggestions for a given location within a trip.
 * - SuggestActivitiesInput - The input type for the suggestActivities function.
 * - SuggestActivitiesOutput - The return type for the suggestActivities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestActivitiesInputSchema = z.object({
  locationName: z.string().describe('The name of the location for which to suggest activities.'),
  locationDays: z.number().describe('The number of days the user is spending in this location.'),
  totalTripDays: z.number().describe('The total number of days in the entire trip.'),
  tripItinerary: z.array(z.string()).describe('An ordered list of all locations in the trip.'),
  locationPositionInTrip: z.string().describe('The position of this location in the trip (e.g., "start", "middle", "end").'),
  userPrompt: z.string().optional().describe('Optional additional context or requests from the user.'),
});
export type SuggestActivitiesInput = z.infer<typeof SuggestActivitiesInputSchema>;

const SuggestActivitiesOutputSchema = z.object({
  suggestions: z.string().describe('A day-by-day list of suggested activities, formatted as plain text.'),
});
export type SuggestActivitiesOutput = z.infer<typeof SuggestActivitiesOutputSchema>;


export async function suggestActivities(input: SuggestActivitiesInput): Promise<SuggestActivitiesOutput> {
  return suggestActivitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActivitiesPrompt',
  input: {schema: SuggestActivitiesInputSchema},
  output: {schema: SuggestActivitiesOutputSchema},
  prompt: `You are a world-class travel planner. Your task is to generate a detailed, day-by-day itinerary for a user's stay in a specific location, based on the context of their entire trip.

**Trip Context:**
- **Current Location:** {{{locationName}}}
- **Duration in this Location:** {{{locationDays}}} days
- **Total Trip Duration:** {{{totalTripDays}}} days
- **Full Itinerary:** {{{tripItinerary}}}
- **Position in Trip:** This location is at the {{{locationPositionInTrip}}} of the trip.

**Your Task:**
Create a suggested itinerary for the {{{locationDays}}} days in {{{locationName}}}.
- Be mindful of the trip's pacing. If this is the beginning of the trip, suggest higher-energy activities. If it's near the end, suggest more relaxing options to avoid burnout.
- Consider the other locations. Avoid suggesting activities that are very similar to what they might experience in other cities on their itinerary.
- If the user has provided additional requests, prioritize them.

**User's Additional Requests:**
{{#if userPrompt}}
"{{{userPrompt}}}"
{{else}}
"None provided."
{{/if}}

**Output Format:**
- Provide the output as a single block of plain text.
- Start each day with "Day X:" on a new line.
- Use bullet points (-) for each suggestion under the day.
- Do not include any introductory or concluding sentences. Just provide the itinerary.

Example Output:
Day 1:
- Suggestion 1
- Suggestion 2
Day 2:
- Suggestion 3
- Suggestion 4
`,
});

const suggestActivitiesFlow = ai.defineFlow(
  {
    name: 'suggestActivitiesFlow',
    inputSchema: SuggestActivitiesInputSchema,
    outputSchema: SuggestActivitiesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
