
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Sparkles, Loader2, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';
import Image from 'next/image';
import { getPexelsImageForLocationPage } from '@/app/actions';
import { suggestActivities, type SuggestActivitiesInput } from '@/ai/flows/suggestActivitiesFlow';
import { Input } from '@/components/ui/input';
import { getTrip, updateTrip, Trip as FirestoreTrip, getCachedLocationImage, cacheLocationImage, subscribeToTripUpdates } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

type Activity = {
  id: string;
  notes: string;
  type: 'text' | 'link' | 'checklist';
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
        type: act.type || 'text'
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
        type: act.type || 'text'
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
  const [focusedActivityId, setFocusedActivityId] = useState<string | null>(null);
  const [activityTexts, setActivityTexts] = useState<Record<string, string>>({});
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [newNoteTexts, setNewNoteTexts] = useState<Record<string, string>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

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
            const bannerImage = await getPexelsImageForLocationPage(`${foundLocation.name} landscape`);
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
    if (!trip || !trip.id) {
      console.error('❌ No trip or trip ID for saving');
      return;
    }
    
    try {
      console.log('🔄 Saving to Firestore...', { 
        tripId: trip.id, 
        locationId: newLocation.id,
        activitiesCount: newLocation.dateBlocks.reduce((sum, db) => sum + db.activities.length, 0)
      });
      
      const allLocations = [...trip.tripData.locations];
      const locationIndex = allLocations.findIndex((loc: Location) => loc.id === locationId);
      
      if (locationIndex !== -1) {
        // Update the specific location
        allLocations[locationIndex] = newLocation;
        
        // Convert Date objects back to strings for Firestore
        const firestoreLocations = allLocations.map(loc => ({
          ...loc,
          dateBlocks: loc.dateBlocks.map(db => ({
            ...db,
            date: db.date instanceof Date ? db.date.toISOString() : db.date,
            activities: db.activities.map(act => ({
              ...act,
              type: act.type || 'text'
            }))
          }))
        }));
        
        console.log('🔄 Updating trip with locations:', firestoreLocations.length);
        await updateTrip(trip.id, { tripData: { locations: firestoreLocations } });
        console.log('✅ Firestore save completed successfully');
      } else {
        console.error('❌ Location not found in trip locations');
      }
    } catch (error) {
      console.error('❌ Error updating Firestore:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw so the blur handler can handle it
    }
  };

  // Modern Notion-style note-taking functions
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
      setActivityTexts(prev => ({ ...prev, [newActivityId]: '' }));
      setFocusedActivityId(newActivityId);
      updateFirestore(newLocation);
      
      // Auto-focus the new textarea after a short delay
      setTimeout(() => {
        const textarea = textareaRefs.current[newActivityId];
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  };

  const handleActivityTextChange = (activityId: string, text: string) => {
    setActivityTexts(prev => ({ ...prev, [activityId]: text }));
    
    // Clear existing timeout
    if (saveTimeouts.current[activityId]) {
      clearTimeout(saveTimeouts.current[activityId]);
    }
    
    // Set new timeout for auto-save (debounced)
    saveTimeouts.current[activityId] = setTimeout(async () => {
      // Find the dateBlockId for this activity
      const dateBlockId = location?.dateBlocks.find(block => 
        block.activities.some(act => act.id === activityId)
      )?.id;
      
      if (dateBlockId) {
        console.log('🔄 Auto-saving note after typing pause:', { activityId, text });
        await handleActivityBlur(dateBlockId, activityId);
      }
    }, 2000); // Auto-save after 2 seconds of no typing
  };

  const handleActivityBlur = async (dateBlockId: string, activityId: string) => {
    if (!location) return;
    
    // Clear any pending auto-save timeout since we're saving now
    if (saveTimeouts.current[activityId]) {
      clearTimeout(saveTimeouts.current[activityId]);
      delete saveTimeouts.current[activityId];
    }
    
    const text = activityTexts[activityId] || '';
    console.log('💾 Saving note:', { activityId, text, dateBlockId });
    
    // If empty text, delete the activity instead
    if (!text.trim()) {
      console.log('🗑️ Empty text - deleting activity');
      await handleDeleteActivity(dateBlockId, activityId);
      setFocusedActivityId(null);
      return;
    }
    
    // Prevent multiple saves for the same activity
    if (savingActivityId === activityId) {
      console.log('⏸️ Already saving this activity, skipping');
      return;
    }
    
    const newLocation = deepCopyAndParseDatesSingle(location);
    const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
    
    if (dateBlock) {
      const activity = dateBlock.activities.find((act: Activity) => act.id === activityId);
      if (activity) {
        const oldNotes = activity.notes || '';
        if (oldNotes !== text.trim()) {
          console.log('💾 Note changed, saving:', { old: oldNotes, new: text.trim() });
          setSavingActivityId(activityId);
          
          // Store original for rollback
          const originalLocation = location;
          
          // Optimistic update
          activity.notes = text.trim();
          setLocation(newLocation);
          
          try {
            await updateFirestore(newLocation);
            console.log('✅ Note saved successfully');
          } catch (error) {
            console.error('❌ Save failed:', error);
            
            // Rollback on failure
            setLocation(originalLocation);
            setActivityTexts(prev => ({ ...prev, [activityId]: oldNotes }));
            
            toast({
              title: "Save Failed",
              description: "Your note couldn't be saved. Please try again.",
              variant: "destructive",
            });
          } finally {
            setSavingActivityId(null);
          }
        } else {
          console.log('⏸️ Note unchanged, skipping save');
        }
      }
    }
    
    setFocusedActivityId(null);
  };

  const handleActivityKeyDown = (e: React.KeyboardEvent, dateBlockId: string, activityId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Save current activity and create a new one
      handleActivityBlur(dateBlockId, activityId);
      setTimeout(() => handleAddActivity(dateBlockId), 50);
    }
  };

  const handleActivityFocus = (activityId: string) => {
    setFocusedActivityId(activityId);
  };

  const handleNewNoteChange = (dateBlockId: string, text: string) => {
    // Just update the temporary state, don't create the note yet
    setNewNoteTexts(prev => ({ ...prev, [dateBlockId]: text }));
  };

  const handleNewNoteBlur = async (dateBlockId: string) => {
    const text = newNoteTexts[dateBlockId]?.trim();
    if (text) {
      console.log('💾 Creating new note on blur:', { dateBlockId, text });
      
      const newActivityId = crypto.randomUUID();
      const originalLocation = location!;
      
      try {
        // Optimistic update
        const newLocation = deepCopyAndParseDatesSingle(location!);
        const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
        
        if (dateBlock) {
          dateBlock.activities.push({ 
            id: newActivityId, 
            notes: text, 
            type: 'text' 
          });
          
          setLocation(newLocation);
          setActivityTexts(prev => ({ ...prev, [newActivityId]: text }));
          setNewNoteTexts(prev => ({ ...prev, [dateBlockId]: '' })); // Clear the temporary text
          
          await updateFirestore(newLocation);
          console.log('✅ New note created successfully');
        }
      } catch (error) {
        console.error('❌ Failed to create new note:', error);
        
        // Rollback on failure
        setLocation(originalLocation);
        setNewNoteTexts(prev => ({ ...prev, [dateBlockId]: text })); // Restore the text
        
        // Remove from activity texts if it was added
        setActivityTexts(prev => {
          const newTexts = { ...prev };
          delete newTexts[newActivityId];
          return newTexts;
        });
        
        toast({
          title: "Failed to Create Note",
          description: "Your note couldn't be created. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewNoteKeyDown = (e: React.KeyboardEvent, dateBlockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNewNoteBlur(dateBlockId); // Create the note on Enter
    }
  };

  const handleDeleteActivity = async (dateBlockId: string, activityId: string) => {
    if (!location) return;
    
    // Show loading state
    setDeletingActivityId(activityId);
    
    // Store original state for rollback
    const originalLocation = location;
    
    try {
      // Optimistic update - remove from UI immediately
      const newLocation = deepCopyAndParseDatesSingle(location);
      const dateBlock = newLocation.dateBlocks.find((db: DateBlock) => db.id === dateBlockId);
      
      if (dateBlock) {
        dateBlock.activities = dateBlock.activities.filter((act: Activity) => act.id !== activityId);
        setLocation(newLocation);
        
        // Remove from local state too
        setActivityTexts(prev => {
          const newTexts = { ...prev };
          delete newTexts[activityId];
          return newTexts;
        });
        
        // Clear any pending save timeouts
        if (saveTimeouts.current[activityId]) {
          clearTimeout(saveTimeouts.current[activityId]);
          delete saveTimeouts.current[activityId];
        }
        
        // Save to database
        await updateFirestore(newLocation);
        console.log('✅ Note deleted successfully');
        
        toast({
          title: "Note deleted",
          description: "Your note has been removed.",
        });
      }
    } catch (error) {
      console.error('❌ Delete failed:', error);
      
      // Rollback on failure
      setLocation(originalLocation);
      
      toast({
        title: "Delete Failed",
        description: "Couldn't delete the note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingActivityId(null);
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

  // Sync activity texts with location data
  useEffect(() => {
    if (location) {
      console.log('🔄 Syncing activity texts with location data:', location);
      const texts: Record<string, string> = {};
      location.dateBlocks.forEach(block => {
        block.activities.forEach(activity => {
          texts[activity.id] = activity.notes || '';
          console.log('📝 Activity:', { id: activity.id, notes: activity.notes });
        });
      });
      setActivityTexts(texts);
      console.log('📝 Activity texts set:', texts);
    }
  }, [location]);

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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDateBlocks.map((block) => (
              <div key={block.id} className="bg-white rounded-lg border shadow-sm p-4 h-fit hover:shadow-md transition-shadow group">
                {/* Date Header */}
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {format(block.date, 'EEEE, MMM d')}
                  </h3>
                </div>
                
                {/* Notes List */}
                <div className="space-y-2">
                  {/* Existing notes */}
                  {block.activities.filter(activity => activity.notes && activity.notes.trim() !== '').map((activity) => (
                    <div key={activity.id} className="group flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md">
                      <div className={`w-1 h-1 rounded-full mt-2.5 flex-shrink-0 ${savingActivityId === activity.id ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <textarea
                        ref={(el) => {
                          textareaRefs.current[activity.id] = el as any;
                          if (el) {
                            // Auto-size this specific textarea when it mounts
                            setTimeout(() => {
                              el.style.height = 'auto';
                              el.style.height = el.scrollHeight + 'px';
                            }, 0);
                          }
                        }}
                        value={activityTexts[activity.id] !== undefined ? activityTexts[activity.id] : (activity.notes || '')}
                        onChange={(e) => {
                          handleActivityTextChange(activity.id, e.target.value);
                          // Auto-resize on change
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        onFocus={() => handleActivityFocus(activity.id)}
                        onBlur={() => handleActivityBlur(block.id, activity.id)}
                        onKeyDown={(e) => handleActivityKeyDown(e, block.id, activity.id)}
                        placeholder="Add a note..."
                        className="flex-1 border-0 bg-transparent text-sm placeholder-gray-400 focus:outline-none text-gray-700 py-0.5 resize-none min-h-[20px] leading-relaxed"
                        rows={1}
                      />
                      <button
                        onClick={() => handleDeleteActivity(block.id, activity.id)}
                        disabled={deletingActivityId === activity.id}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingActivityId === activity.id ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                  
                  {/* Always show one empty note line at the bottom */}
                  <div className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md">
                    <div className="w-1 h-1 rounded-full bg-gray-300 mt-2.5 flex-shrink-0"></div>
                    <textarea
                      value={newNoteTexts[block.id] || ''}
                      onChange={(e) => {
                        handleNewNoteChange(block.id, e.target.value);
                        // Auto-resize on change
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      onBlur={() => handleNewNoteBlur(block.id)}
                      onKeyDown={(e) => handleNewNoteKeyDown(e, block.id)}
                      placeholder="Add a note..."
                      className="flex-1 border-0 bg-transparent text-sm placeholder-gray-400 focus:outline-none text-gray-700 py-0.5 resize-none min-h-[20px] leading-relaxed"
                      rows={1}
                    />
                  </div>
                </div>
              </div>
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
