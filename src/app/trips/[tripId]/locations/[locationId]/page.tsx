
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getPexelsImageForLocationPage, testPexelsAPI } from '@/app/actions';
import { suggestActivities, type SuggestActivitiesInput } from '@/ai/flows/suggestActivitiesFlow';
import { Input } from '@/components/ui/input';
import { getTrip, updateTrip, Trip as FirestoreTrip, getCachedLocationImage, cacheLocationImage } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

type Activity = {
  id: string;
  notes: string;
};

type DateBlock = {
  id: string;
  date: Date;
  activities: Activity[];
};

type Location = {
  id: string;
  name: string;
  dateBlocks: DateBlock[];
};

type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  tripData: {
    locations: Location[];
  };
};

const deepCopyAndParseDates = (locationToCopy: Location): Location => {
    const newLocation = JSON.parse(JSON.stringify(locationToCopy));
    return {
        ...newLocation,
        dateBlocks: newLocation.dateBlocks.map((db: any) => ({
            ...db,
            date: new Date(db.date)
        }))
    };
};

export default function LocationPage() {
  const params = useParams();
  const { tripId, locationId } = params;
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [maxActivities, setMaxActivities] = useState(0);
  const [banner, setBanner] = useState<{url: string, alt: string, photographerUrl: string} | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [suggestions, setSuggestions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);


  useEffect(() => {
    if (tripId && locationId) {
      loadLocation();
    }
  }, [tripId, locationId]);

  const loadLocation = async () => {
    try {
      setIsLoading(true);
      const firestoreTrip = await getTrip(tripId as string);
      
      if (firestoreTrip) {
        const currentLocation = firestoreTrip.tripData.locations.find(l => l.id === locationId);
        if (currentLocation) {
          const parsedLocation = {
            ...currentLocation,
            dateBlocks: currentLocation.dateBlocks.map(db => ({
              ...db,
              date: new Date(db.date),
              activities: (db.activities || []).map((activity: any) => 
                typeof activity === 'string' 
                  ? { id: crypto.randomUUID(), notes: activity }
                  : activity
              )
            }))
          };
          setLocation(parsedLocation);
        }
        
        const localTrip: Trip = {
          id: firestoreTrip.id!,
          title: firestoreTrip.title,
          startDate: firestoreTrip.startDate,
          endDate: firestoreTrip.endDate,
          tripData: { locations: [] } // We don't need all locations here
        };
        setTrip(localTrip);
      } else {
        toast({
          title: "Error",
          description: "Trip not found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading location:', error);
      toast({
        title: "Error",
        description: "Failed to load location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location?.name) {
      loadBannerImage(location.name);
    }
  }, [location?.name]);

  const loadBannerImage = async (locationName: string) => {
    try {
      console.log('Loading banner for location:', locationName);
      
      // First, try to get cached image
      const cachedImage = await getCachedLocationImage(locationName);
      if (cachedImage) {
        console.log('Using cached image for:', locationName);
        setBanner({
          url: cachedImage.imageUrl,
          alt: cachedImage.alt,
          photographerUrl: cachedImage.photographerUrl
        });
        return;
      }
      
      // If no cached image, fetch from Pexels
      console.log('Fetching new image from Pexels for:', locationName);
      const bannerData = await getPexelsImageForLocationPage(`${locationName} iconic landscape`);
      
      if (bannerData) {
        console.log('Banner loaded from Pexels:', bannerData);
        setBanner(bannerData);
        
        // Cache the image for future use
        await cacheLocationImage(locationName, {
          url: bannerData.url,
          alt: bannerData.alt,
          photographerUrl: bannerData.photographerUrl
        });
      } else {
        console.log('No banner data received from Pexels, using fallback');
        setBanner(null);
      }
    } catch (error) {
      console.error('Error loading banner:', error);
      setBanner(null);
    }
  };
  
  useEffect(() => {
    if (location) {
      const max = Math.max(...location.dateBlocks.map(db => db.activities.length), 0);
      setMaxActivities(max);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateFirestore = async (newLocationData: Location | null) => {
    if (!newLocationData || !trip) return;

    try {
      const firestoreTrip = await getTrip(trip.id);
      if (firestoreTrip) {
        const updatedLocations = firestoreTrip.tripData.locations.map(loc => {
          if (loc.id === locationId) {
            return {
              ...loc,
              dateBlocks: newLocationData.dateBlocks.map(db => ({
                ...db,
                date: db.date.toISOString(),
                activities: db.activities.map(activity => activity.notes)
              }))
            };
          }
          return loc;
        });

        await updateTrip(trip.id, {
          tripData: {
            locations: updatedLocations
          }
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddActivity = (dateBlockId: string) => {
    if (!location) return;

    const newActivityId = crypto.randomUUID();
    const newLocation = deepCopyAndParseDates(location); 
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);

    if (dateBlock) {
        dateBlock.activities.push({ id: newActivityId, notes: '' });
        setLocation(newLocation);
        updateFirestore(newLocation);
        
        setTimeout(() => {
            const newTextarea = document.querySelector(`[data-activity-id='${newActivityId}'] textarea`) as HTMLTextAreaElement | null;
            newTextarea?.focus();
        }, 0);
    }
  };
  
  const handleAddNewActivityAfter = (dateBlockId: string, currentActivityId: string) => {
    if (!location) return;
    const newActivityId = crypto.randomUUID();
    const newLocation = deepCopyAndParseDates(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);

    if (dateBlock) {
      const currentIndex = dateBlock.activities.findIndex((act: Activity) => act.id === currentActivityId);
      if (currentIndex > -1) {
        dateBlock.activities.splice(currentIndex + 1, 0, { id: newActivityId, notes: '' });
        setLocation(newLocation);
        updateFirestore(newLocation);

        setTimeout(() => {
          const newTextarea = document.querySelector(`[data-activity-id='${newActivityId}'] textarea`) as HTMLTextAreaElement | null;
          newTextarea?.focus();
        }, 0);
      }
    }
  };

  const handleActivityChange = (dateBlockId: string, activityId: string, value: string) => {
    if (!location) return;

    const newLocation = deepCopyAndParseDates(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);

    if (dateBlock) {
        const activity = dateBlock.activities.find((act: Activity) => act.id === activityId);
        if (activity) {
            activity.notes = value;
            setLocation(newLocation);
            updateFirestore(newLocation);
        }
    }
  };
  
  const handleActivityKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, dateBlockId: string, activityId: string) => {
    const target = e.target as HTMLTextAreaElement;
    if (e.key === 'Backspace' && target.value === '') {
        e.preventDefault();
        handleDeleteActivity(dateBlockId, activityId);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAddNewActivityAfter(dateBlockId, activityId);
    }
    
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleDeleteActivity = (dateBlockId: string, activityId: string) => {
    if (!location) return;

    const newLocation = deepCopyAndParseDates(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    if(dateBlock) {
        const activityIndex = dateBlock.activities.findIndex((act: Activity) => act.id === activityId);
        
        if (activityIndex > -1) {
          dateBlock.activities.splice(activityIndex, 1);
          setLocation(newLocation);
          updateFirestore(newLocation);
          
          setTimeout(() => {
            const focusableElements = Array.from(document.querySelectorAll(`[data-date-block-id='${dateBlock.id}'] textarea`));
            if (focusableElements.length > 0) {
              const elementToFocus = (activityIndex > 0 ? focusableElements[activityIndex - 1] : focusableElements[0]) as HTMLElement;
              elementToFocus?.focus();
            } else {
              const placeholder = document.querySelector(`[data-date-block-id='${dateBlock.id}'] [data-placeholder='true']`) as HTMLElement;
              placeholder?.focus();
            }
          }, 0);
        }
    }
  };
  
  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }
  };

  const handleGenerateSuggestions = useCallback(async () => {
    if (!trip || !location) return;
    
    setShowSuggestions(true);
    setIsGenerating(true);
    setSuggestions('');

    const tripItinerary = trip.tripData.locations.map(l => l.name);
    const totalTripDays = (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24) + 1;
    const locationIndex = trip.tripData.locations.findIndex(l => l.id === location.id);
    let locationPositionInTrip = 'middle';
    if (locationIndex === 0) locationPositionInTrip = 'start';
    if (locationIndex === trip.tripData.locations.length - 1) locationPositionInTrip = 'end';

    const input: SuggestActivitiesInput = {
        locationName: location.name,
        locationDays: location.dateBlocks.length,
        totalTripDays,
        tripItinerary,
        locationPositionInTrip,
        userPrompt: userPrompt || undefined,
    };

    try {
        const result = await suggestActivities(input);
        setSuggestions(result.suggestions);
    } catch (error) {
        console.error("Error generating suggestions:", error);
        setSuggestions("Sorry, I couldn't generate suggestions at this time. Please try again.");
    } finally {
        setIsGenerating(false);
    }

  }, [trip, location, userPrompt]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip || !location) {
    return <div>Loading location details...</div>;
  }

  const sortedDateBlocks = [...location.dateBlocks].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const cardHeightActivities = Math.min(Math.max(1, maxActivities), 5);
  const cardMinHeight = `${120 + cardHeightActivities * 40}px`;


  return (
    <div className="min-h-screen w-full bg-background font-sans text-foreground flex flex-col">
      <header className={`sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'h-60' : 'h-80'}`}>
        <div className="absolute inset-0">
          {banner?.url ? (
            <a href={banner.photographerUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <Image 
                  src={banner.url}
                  alt={banner.alt || `${location.name} banner`}
                  fill
                  className="object-cover"
                  priority
              />
            </a>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl font-bold mb-2">{location.name}</div>
                <div className="text-xl opacity-80">Loading beautiful landscape...</div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between py-6">
            <div>
                <Button variant="link" className="text-white/90 p-0 h-auto hover:text-white" asChild>
                    <Link href={`/trips/${tripId}`}>
                        <ChevronLeft className="w-4 h-4 mr-1"/>
                        Back to {trip.title}
                    </Link>
                </Button>
            </div>
            <div>
                 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`} target="_blank" rel="noopener noreferrer">
                    <h1 className="text-5xl font-bold text-white font-headline tracking-tight drop-shadow-lg hover:underline">{location.name}</h1>
                </a>
                <div className="flex justify-between items-end mt-2">
                    {sortedDateBlocks.length > 0 && (
                      <p className="text-white/80 text-lg drop-shadow-sm">
                          {format(sortedDateBlocks[0].date, "MMM d, yyyy")} - {format(sortedDateBlocks[sortedDateBlocks.length-1].date, "MMM d, yyyy")}
                      </p>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateSuggestions} disabled={isGenerating} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4 text-orange-400"/>
                                    Generate Suggestions
                                </>
                            ) }
                        </Button>
                        <Button 
                            onClick={async () => {
                                console.log('Testing Pexels API...');
                                const result = await testPexelsAPI();
                                console.log('Test result:', result);
                                if (result.success) {
                                    toast({
                                        title: "Pexels API Test",
                                        description: "API connection successful! Check console for details.",
                                    });
                                } else {
                                    toast({
                                        title: "Pexels API Test",
                                        description: `API test failed: ${result.error}`,
                                        variant: "destructive",
                                    });
                                }
                            }} 
                            variant="outline" 
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                            Test Pexels API
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background z-10 -mt-4 rounded-t-2xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-6 pb-4">
            {sortedDateBlocks.map((block) => (
              <Card key={block.id} data-date-block-id={block.id} className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] flex-shrink-0 flex flex-col transition-all duration-300" style={{ minHeight: cardMinHeight }}>
                <CardHeader>
                  <CardTitle className="text-lg">{format(block.date, 'EEEE, MMM d')}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden pt-0">
                   <div className={`flex-1 space-y-2 ${block.activities.length > 5 ? 'overflow-y-auto' : 'overflow-y-hidden'} pr-2 -mr-2`}>
                       {block.activities.length === 0 && (
                         <div className="space-y-1 group relative">
                             <Textarea
                               placeholder="What's the plan?"
                               className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2 h-auto min-h-[36px] resize-none bg-secondary/30 rounded-md"
                               value=""
                               onFocus={() => handleAddActivity(block.id)}
                               readOnly
                               data-placeholder="true"
                             />
                         </div>
                       )}
                       {block.activities.map((activity) => (
                          <div key={activity.id} data-activity-id={activity.id} className="space-y-1 group relative">
                                <Textarea
                                  placeholder="What's the plan?"
                                  className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2 h-auto min-h-[36px] resize-none bg-transparent hover:bg-secondary/30 focus:bg-secondary/30 rounded-md"
                                  value={activity.notes}
                                  onChange={(e) => handleActivityChange(block.id, activity.id, e.target.value)}
                                  onKeyDown={(e) => handleActivityKeyDown(e, block.id, activity.id)}
                                  ref={autoResizeTextarea}
                                  rows={1}
                                />
                          </div>
                       ))}
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>

           {showSuggestions && (
            <Card className="mt-8 p-6 bg-secondary/30">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Sparkles className="text-orange-500"/>
                        AI-Powered Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="user-prompt" className="text-sm font-medium text-foreground/80 mb-2 block">
                                Any specific requests? (e.g., "kid-friendly", "focus on museums", "only free activities")
                            </label>
                            <Input
                                id="user-prompt"
                                placeholder="Tell the AI what you're looking for..."
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSuggestions()}
                                disabled={isGenerating}
                            />
                        </div>
                        {(isGenerating || suggestions) && (
                            <div className="pt-4">
                                <label className="text-sm font-medium text-foreground/80 mb-2 block">
                                    Here are some ideas to get you started:
                                </label>
                                <Textarea
                                    readOnly
                                    value={isGenerating ? "Thinking..." : suggestions}
                                    className="w-full h-64 bg-background font-mono text-sm"
                                    placeholder="AI suggestions will appear here..."
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
           )}
        </div>
      </main>
    </div>
  );
}
