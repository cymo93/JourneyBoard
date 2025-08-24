
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Sparkles, Loader2, MapPin, Plus, Trash2, Edit3, Check, X, Wifi, WifiOff } from 'lucide-react';
import Image from 'next/image';
import { getPexelsImageForLocationPage } from '@/app/actions';
import { suggestActivities, type SuggestActivitiesInput } from '@/ai/flows/suggestActivitiesFlow';
import { Input } from '@/components/ui/input';
import { getTrip, updateTrip, Trip as FirestoreTrip, getCachedLocationImage, cacheLocationImage, subscribeToTripUpdates } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { LinkParser } from '@/components/LinkParser';
import { QuickLinkHelper } from '@/components/QuickLinkHelper';

type Activity = {
  id: string;
  notes: string;
  type: 'text' | 'link' | 'checklist';
  completed?: boolean;
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

const deepCopyAndParseDates = (locationsToCopy: any[]): Location[] => {
  return locationsToCopy.map((loc: any) => ({
    ...loc,
    dateBlocks: loc.dateBlocks.map((db: any) => ({
      ...db,
      date: new Date(db.date),
      activities: db.activities?.map((act: any) => ({
        ...act,
        type: act.type || 'text',
        completed: act.completed || false
      })) || []
    }))
  }));
};

const deepCopyAndParseDatesSingle = (locationToCopy: any): Location => {
  return {
    ...locationToCopy,
    dateBlocks: locationToCopy.dateBlocks.map((db: any) => ({
      ...db,
      date: new Date(db.date),
      activities: db.activities?.map((act: any) => ({
        ...act,
        type: act.type || 'text',
        completed: act.completed || false
      })) || []
    }))
  };
};

export default function LocationPage() {
  const params = useParams();
  const { tripId, locationId } = params;
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [banner, setBanner] = useState<{url: string, alt: string, photographerUrl: string} | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [suggestions, setSuggestions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // New state for modern note-taking
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Real-time collaboration state
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [collaborationStatus, setCollaborationStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (tripId && locationId && !Array.isArray(tripId) && !Array.isArray(locationId)) {
      setupRealTimeCollaboration();
      
      // Safety timeout to ensure loading state is cleared
      const loadingTimeout = setTimeout(() => {
        console.log('⏰ Loading timeout - forcing isLoading to false');
        setIsLoading(false);
        if (!location) {
          console.log('🔄 No location loaded after timeout, trying fallback');
          loadLocation();
        }
      }, 8000); // 8 second timeout
      
      return () => {
        clearTimeout(loadingTimeout);
        if (unsubscribeRef.current) {
          console.log('🔴 Cleaning up real-time listener for location:', locationId);
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
    
    // Cleanup real-time listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔴 Cleaning up real-time listener for location:', locationId);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tripId, locationId]); // Note: location is not included to avoid infinite loops

  const setupRealTimeCollaboration = () => {
    if (!tripId || !locationId || Array.isArray(tripId) || Array.isArray(locationId)) return;
    
    console.log('🔴 Setting up real-time collaboration for location:', locationId);
    setCollaborationStatus('connecting');
    
    try {
      // Set up real-time listener for the trip
      const unsubscribe = subscribeToTripUpdates(
        tripId,
        (updatedTrip) => {
          if (updatedTrip) {
            console.log('🟢 Real-time update received for trip:', updatedTrip.title);
            setCollaborationStatus('connected');
            setIsCollaborating(true);
            setLastUpdateTime(new Date());
            
            // Process the updated trip data
            const parsedLocations = updatedTrip.tripData?.locations ? deepCopyAndParseDates(updatedTrip.tripData.locations) : [];
            const foundLocation = parsedLocations.find((loc: Location) => loc.id === locationId);
            
            if (foundLocation) {
              setLocation(foundLocation);
              setTrip(updatedTrip as any);
              
              // Clear loading state when real-time data arrives
              setIsLoading(false);
              
              // Show collaboration notification
              if (lastUpdateTime && updatedTrip.updatedAt) {
                const lastUpdate = updatedTrip.updatedAt.toDate ? updatedTrip.updatedAt.toDate() : new Date(updatedTrip.updatedAt);
                if (lastUpdate > lastUpdateTime) {
                  toast({
                    title: "Collaboration Update",
                    description: "Location has been updated by another user",
                  });
                }
              }
            } else {
              console.log('❌ Location not found in real-time update, falling back to regular loading');
              setCollaborationStatus('disconnected');
              setIsCollaborating(false);
              loadLocation();
            }
          } else {
            console.log('🔴 Trip not found in real-time listener, falling back to regular loading');
            setCollaborationStatus('disconnected');
            setIsCollaborating(false);
            loadLocation();
          }
        },
        (error) => {
          console.error('❌ Real-time collaboration error:', error);
          setCollaborationStatus('disconnected');
          setIsCollaborating(false);
          toast({
            title: "Collaboration Error",
            description: "Lost connection to real-time updates, loading location data...",
            variant: "destructive",
          });
          // Fallback to regular loading when real-time fails
          loadLocation();
        }
      );
      
      unsubscribeRef.current = unsubscribe;
      console.log('✅ Real-time collaboration setup complete for location');
      
    } catch (error) {
      console.error('❌ Failed to setup real-time collaboration:', error);
      setCollaborationStatus('disconnected');
      setIsCollaborating(false);
      // Fallback to regular loading
      loadLocation();
    }
  };

  const loadLocation = async () => {
    if (!tripId || !locationId || Array.isArray(tripId) || Array.isArray(locationId)) {
      console.log('❌ Invalid tripId or locationId, clearing loading state');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Loading location fallback for:', { tripId, locationId });
      setIsLoading(true);
      const firestoreTrip = await getTrip(tripId);
      
      if (firestoreTrip) {
        console.log('✅ Trip found, processing locations');
        const parsedLocations = firestoreTrip.tripData?.locations ? deepCopyAndParseDates(firestoreTrip.tripData.locations) : [];
        const foundLocation = parsedLocations.find((loc: Location) => loc.id === locationId);
        
        if (foundLocation) {
          console.log('✅ Location found:', foundLocation.name);
          setLocation(foundLocation);
          setTrip(firestoreTrip as any);
          
          // Load banner image
          const cachedImage = await getCachedLocationImage(foundLocation.name);
          if (cachedImage) {
            setBanner({
              url: cachedImage.imageUrl,
              alt: cachedImage.alt,
              photographerUrl: cachedImage.photographerUrl
            });
          } else {
            const bannerImage = await getPexelsImageForLocationPage(foundLocation.name);
            if (bannerImage) {
              setBanner(bannerImage);
              await cacheLocationImage(foundLocation.name, {
                url: bannerImage.url,
                alt: bannerImage.alt,
                photographerUrl: bannerImage.photographerUrl
              });
            }
          }
        } else {
          console.log('❌ Location not found in trip');
          toast({
            title: "Location Not Found",
            description: "This location doesn't exist in the trip.",
            variant: "destructive",
          });
        }
      } else {
        console.log('❌ Trip not found');
        toast({
          title: "Trip Not Found",
          description: "This trip doesn't exist or you don't have access to it.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error loading location:', error);
      toast({
        title: "Error",
        description: "Failed to load location. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🔄 Clearing loading state in loadLocation finally block');
      setIsLoading(false);
    }
  };

  const updateFirestore = async (newLocation: Location) => {
    if (!trip) return;
    
    try {
      const newTrip = deepCopyAndParseDates(trip.tripData.locations);
      const locationIndex = newTrip.findIndex((loc: Location) => loc.id === locationId);
      
      if (locationIndex !== -1) {
        newTrip[locationIndex] = newLocation;
        
        // Convert Date objects back to strings for Firestore
        const firestoreLocations = newTrip.map(loc => ({
          ...loc,
          dateBlocks: loc.dateBlocks.map(db => ({
            ...db,
            date: db.date.toISOString(),
            activities: db.activities.map(act => ({
              ...act,
              type: act.type || 'text',
              completed: act.completed || false
            }))
          }))
        }));
        
        await updateTrip(trip.id!, { tripData: { locations: firestoreLocations } });
      }
    } catch (error) {
      console.error('Error updating Firestore:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Modern note-taking functions
  const handleAddActivity = (dateBlockId: string) => {
    if (!location) return;
    
    const newActivityId = crypto.randomUUID();
    const newLocation = deepCopyAndParseDatesSingle(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    
    if (dateBlock) {
      dateBlock.activities.push({ 
        id: newActivityId, 
        notes: '', 
        type: 'text' 
      });
      setLocation(newLocation);
      updateFirestore(newLocation);
      
      // Start editing the new activity
      setEditingActivityId(newActivityId);
      setEditingText('');
    }
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setEditingText(activity.notes);
  };

  const handleSaveEdit = (dateBlockId: string, activityId: string) => {
    if (!location || editingText.trim() === '') return;
    
    const newLocation = deepCopyAndParseDatesSingle(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    
    if (dateBlock) {
      const activity = dateBlock.activities.find((act: Activity) => act.id === activityId);
      if (activity) {
        activity.notes = editingText.trim();
        setLocation(newLocation);
        updateFirestore(newLocation);
      }
    }
    
    setEditingActivityId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingActivityId(null);
    setEditingText('');
  };

  const handleDeleteActivity = (dateBlockId: string, activityId: string) => {
    if (!location) return;
    
    const newLocation = deepCopyAndParseDatesSingle(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    
    if (dateBlock) {
      dateBlock.activities = dateBlock.activities.filter((act: Activity) => act.id !== activityId);
      setLocation(newLocation);
      updateFirestore(newLocation);
    }
  };

  const handleToggleComplete = (dateBlockId: string, activityId: string) => {
    if (!location) return;
    
    const newLocation = deepCopyAndParseDatesSingle(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    
    if (dateBlock) {
      const activity = dateBlock.activities.find((act: Activity) => act.id === activityId);
      if (activity) {
        activity.completed = !activity.completed;
        setLocation(newLocation);
        updateFirestore(newLocation);
      }
    }
  };

  const handleAddLinkToActivity = (dateBlockId: string, activityId: string, linkString: string) => {
    if (!location) return;
    
    const newLocation = deepCopyAndParseDatesSingle(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    
    if (dateBlock) {
      const activity = dateBlock.activities.find((act: Activity) => act.id === activityId);
      if (activity) {
        activity.notes = linkString;
        setLocation(newLocation);
        updateFirestore(newLocation);
      }
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!location || !trip) return;
    
    try {
      setIsGenerating(true);
      
      const totalTripDays = Math.floor((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const tripItinerary = trip.tripData.locations.map(l => l.name);
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
        userPrompt: userPrompt || undefined
      };
      
      const result = await suggestActivities(input);
      setSuggestions(result.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location || !trip) {
    return <div>Location not found</div>;
  }

  const sortedDateBlocks = [...location.dateBlocks].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
                <div className="text-xl opacity-80">
                  {location.name} • {sortedDateBlocks.length} day{sortedDateBlocks.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm opacity-60 mt-2">Beautiful landscape images coming soon</div>
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
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Real-time collaboration status */}
      <div className="bg-background border-b z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              collaborationStatus === 'connected' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : collaborationStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {collaborationStatus === 'connected' ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Live Collaboration
                </>
              ) : collaborationStatus === 'connecting' ? (
                <>
                  <Wifi className="w-4 h-4 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Offline
                </>
              )}
            </div>
            
            {lastUpdateTime && (
              <div className="text-xs text-muted-foreground">
                Last update: {lastUpdateTime.toLocaleTimeString()}
              </div>
            )}
            
            {isCollaborating && (
              <div className="text-xs text-green-600 font-medium">
                ✓ Real-time updates enabled
              </div>
            )}
          </div>
        </div>
      </div>
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background z-10 -mt-4 rounded-t-2xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDateBlocks.map((block) => (
              <Card key={block.id} className="flex flex-col h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-foreground/90">
                    {format(block.date, 'EEEE, MMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Activities List */}
                  <div className="space-y-2">
                    {block.activities.map((activity) => (
                      <div key={activity.id} className="group relative">
                        {editingActivityId === activity.id ? (
                          // Edit Mode
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              placeholder="What's the plan?"
                              className="min-h-[80px] resize-none border-2 border-blue-200 focus:border-blue-400 focus:ring-0"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(block.id, activity.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className={`p-3 rounded-lg border transition-all duration-200 ${
                            activity.completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}>
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleComplete(block.id, activity.id)}
                                className={`mt-1 flex-shrink-0 w-4 h-4 rounded border-2 transition-colors ${
                                  activity.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {activity.completed && (
                                  <Check className="w-full h-full text-white text-xs" />
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <div className={`${activity.completed ? 'line-through text-gray-500' : 'text-foreground'}`}>
                                  {activity.notes ? (
                                    <div className="whitespace-pre-wrap break-words">
                                      <LinkParser text={activity.notes} />
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">Empty note</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <QuickLinkHelper
                                  onAddLink={(linkString) => handleAddLinkToActivity(block.id, activity.id, linkString)}
                                  locationName={location.name}
                                  trigger={
                                    <button
                                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                      title="Add Google Maps link"
                                    >
                                      <MapPin className="h-3 w-3" />
                                    </button>
                                  }
                                />
                                <button
                                  onClick={() => handleStartEdit(activity)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                                  title="Edit note"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(block.id, activity.id)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete note"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Add New Activity Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddActivity(block.id)}
                    className="w-full border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {showSuggestions && (
            <Card className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl flex items-center gap-2 text-orange-800">
                  <Sparkles className="text-orange-500"/>
                  AI-Powered Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="user-prompt" className="text-sm font-medium text-orange-800 mb-2 block">
                      Any specific requests? (e.g., "kid-friendly", "focus on museums", "only free activities")
                    </label>
                    <Input
                      id="user-prompt"
                      placeholder="Tell the AI what you're looking for..."
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateSuggestions()}
                      disabled={isGenerating}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                  {(isGenerating || suggestions) && (
                    <div className="pt-4">
                      <label className="text-sm font-medium text-orange-800 mb-2 block">
                        Here are some ideas to get you started:
                      </label>
                      <Textarea
                        readOnly
                        value={isGenerating ? "Thinking..." : suggestions}
                        className="w-full h-64 bg-white border-orange-200 font-mono text-sm"
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
