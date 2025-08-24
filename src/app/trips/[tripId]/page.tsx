
"use client";

import { useState, useMemo, useEffect, useRef, type FC, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { addDays, format, differenceInDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  MapPin,
  Plane,
  Sparkles,
  ChevronLeft,
  Plus,
  Pencil,
  X,
  Share2,
  Trash2,
  Hotel,
  Upload,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getTrip, updateTrip, Trip as FirestoreTrip, subscribeToTripUpdates } from '@/lib/firestore';
import { ShareTripDialog } from '@/components/ShareTripDialog';
import { DeleteTripDialog } from '@/components/DeleteTripDialog';
import { PublishTripDialog } from '@/components/PublishTripDialog';
import { useAuth } from '@/hooks/useAuth';

type DateBlock = {
  id: string;
  date: Date;
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
  ownerId?: string;
  editors?: string[];
  viewers?: string[];
  locations?: string[];
  tripData: {
    locations: Location[];
  };
};

const DateBlockComponent: FC<{ 
  block: DateBlock; 
  isFirst: boolean; 
  isLast: boolean;
  onDelete: () => void;
}> = ({ block, isFirst, isLast, onDelete }) => {
  const dayOfMonth = format(block.date, 'd');
  const monthName = format(block.date, 'MMM');
  const dayName = format(block.date, 'EEE');
  const isHighlighted = isFirst || isLast;

  return (
    <div
      className={`relative w-24 h-24 rounded-lg flex flex-col items-center justify-center transition-all duration-300 p-2 text-center group
      ${isHighlighted ? 'bg-yellow-100 border border-yellow-400' : 'bg-card border'}`}
    >
      <button 
        onClick={onDelete} 
        className="absolute top-1 left-1 w-5 h-5 bg-card/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive hover:text-destructive-foreground"
        aria-label="Delete date"
      >
        <X className="w-3 h-3" />
      </button>

      {isHighlighted && <Plane className="absolute top-1.5 right-1.5 w-4 h-4 text-yellow-500" />}
      <div className="text-xs text-foreground/60 font-medium absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-0">{dayName}</div>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{dayOfMonth}</span>
        <span className="text-sm font-medium -mt-1 text-foreground/70">{monthName}</span>
      </div>
    </div>
  );
};


export default function JourneyBoardPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [tempLocationName, setTempLocationName] = useState('');
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [collaborationStatus, setCollaborationStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const { toast } = useToast();
  const { user } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const deepCopyAndParseDates = (locationsToCopy: any[]): Location[] => {
    return locationsToCopy.map((loc: any) => ({
      ...loc,
      dateBlocks: loc.dateBlocks.map((db: any) => ({ 
        ...db, 
        date: new Date(db.date) 
      }))
    }));
  };

  // Load trip from Firestore with real-time collaboration
  useEffect(() => {
    if (tripId) {
      setupRealTimeCollaboration();
      
      // Fallback timeout to ensure loading state is cleared
      const loadingTimeout = setTimeout(() => {
        console.log('⏰ Loading timeout - forcing isLoading to false');
        setIsLoading(false);
      }, 8000); // 8 second timeout
      
      return () => {
        clearTimeout(loadingTimeout);
        if (unsubscribeRef.current) {
          console.log('🔴 Cleaning up real-time listener for trip:', tripId);
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
    
    // Cleanup real-time listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔴 Cleaning up real-time listener for trip:', tripId);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tripId]);

  // Add retry mechanism for failed loads
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const loadTripWithRetry = async () => {
    if (retryCount >= maxRetries) {
      toast({
        title: "Error",
        description: "Unable to load trip after multiple attempts. Please try again later.",
        variant: "destructive",
      });
      router.push('/');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await loadTrip();
  };

  // Function to fix date continuity issues
  const fixDateContinuity = (locations: Location[]): Location[] => {
    if (locations.length <= 1) return locations;
    
    const fixedLocations = [...locations];
    let wasFixed = false;
    
    for (let i = 1; i < fixedLocations.length; i++) {
      const previousLocation = fixedLocations[i - 1];
      const currentLocation = fixedLocations[i];
      
      if (previousLocation.dateBlocks.length > 0 && currentLocation.dateBlocks.length > 0) {
        const lastDateOfPrevious = new Date(Math.max(...previousLocation.dateBlocks.map(d => d.date.getTime())));
        const firstDateOfCurrent = new Date(Math.min(...currentLocation.dateBlocks.map(d => d.date.getTime())));
        
        // If there's a gap, fix it by shifting the current location's dates
        if (firstDateOfCurrent.getTime() !== lastDateOfPrevious.getTime()) {
          const daysDifference = Math.floor((firstDateOfCurrent.getTime() - lastDateOfPrevious.getTime()) / (1000 * 60 * 60 * 24));
          
          currentLocation.dateBlocks = currentLocation.dateBlocks.map(db => ({
            ...db,
            date: subDays(db.date, daysDifference)
          }));
          
          wasFixed = true;
          console.log(`Fixed date continuity for location ${i}: shifted by ${daysDifference} days`);
        }
      }
    }
    
    if (wasFixed) {
      toast({
        title: "Date Continuity Fixed",
        description: "Your trip dates have been adjusted to ensure proper continuity.",
      });
    }
    
    return fixedLocations;
  };

  const setupRealTimeCollaboration = () => {
    console.log('🔴 Setting up real-time collaboration for trip:', tripId);
    setCollaborationStatus('connecting');
    
    try {
      // Set up real-time listener
      const unsubscribe = subscribeToTripUpdates(
        tripId,
        (updatedTrip) => {
          if (updatedTrip) {
            console.log('🟢 Real-time update received:', updatedTrip.title);
            setCollaborationStatus('connected');
            setIsCollaborating(true);
            setLastUpdateTime(new Date());
            
            // Process the updated trip data
            const parsedLocations = updatedTrip.tripData?.locations ? deepCopyAndParseDates(updatedTrip.tripData.locations) : [];
            const fixedLocations = fixDateContinuity(parsedLocations);
            
            // Ensure the trip has all required fields and preserve existing trip data
            const safeTrip: Trip = {
              id: tripId, // Use tripId from URL params instead of updatedTrip.id
              title: updatedTrip.title,
              startDate: updatedTrip.startDate,
              endDate: updatedTrip.endDate,
              ownerId: updatedTrip.ownerId,
              editors: Array.isArray(updatedTrip.editors) ? updatedTrip.editors : (trip?.editors || []),
              viewers: Array.isArray(updatedTrip.viewers) ? updatedTrip.viewers : (trip?.viewers || []),
              locations: Array.isArray(updatedTrip.locations) ? updatedTrip.locations : (trip?.locations || []),
              tripData: { locations: fixedLocations }
            };
            
            console.log('🔧 Real-time trip update processed:', {
              hasEditors: Array.isArray(safeTrip.editors),
              hasViewers: Array.isArray(safeTrip.viewers),
              editorsLength: safeTrip.editors?.length,
              viewersLength: safeTrip.viewers?.length
            });
            
            console.log('🔄 Real-time listener updating trip and locations...');
            setTrip(safeTrip);
            setLocations(fixedLocations);
            // Ensure loading state is cleared when real-time data arrives
            setIsLoading(false);
            console.log('✅ Real-time listener update complete, isLoading set to false');
            
            // Show collaboration notification
            if (lastUpdateTime && updatedTrip.updatedAt) {
              const lastUpdate = updatedTrip.updatedAt.toDate ? updatedTrip.updatedAt.toDate() : new Date(updatedTrip.updatedAt);
              if (lastUpdate > lastUpdateTime) {
                toast({
                  title: "Collaboration Update",
                  description: "Trip has been updated by another user",
                });
              }
            }
          } else {
            console.log('🔴 Trip not found in real-time listener');
            setCollaborationStatus('disconnected');
            setIsCollaborating(false);
          }
        },
        (error) => {
          console.error('❌ Real-time collaboration error:', error);
          setCollaborationStatus('disconnected');
          setIsCollaborating(false);
          toast({
            title: "Collaboration Error",
            description: "Lost connection to real-time updates",
            variant: "destructive",
          });
        }
      );
      
      unsubscribeRef.current = unsubscribe;
      console.log('✅ Real-time collaboration setup complete');
      
    } catch (error) {
      console.error('❌ Failed to setup real-time collaboration:', error);
      setCollaborationStatus('disconnected');
      setIsCollaborating(false);
      // Fallback to regular loading
      loadTrip();
    }
  };

  const loadTrip = async () => {
    try {
      setIsLoading(true);
      console.log('Loading trip with ID:', tripId);
      
      const firestoreTrip = await getTrip(tripId);
      console.log('Firestore trip data:', firestoreTrip);
      
      if (firestoreTrip) {
        const parsedLocations = firestoreTrip.tripData?.locations ? deepCopyAndParseDates(firestoreTrip.tripData.locations) : [];
        console.log('Parsed locations:', parsedLocations);
        
        // Fix date continuity if needed
        const fixedLocations = fixDateContinuity(parsedLocations);
        console.log('Fixed locations:', fixedLocations);
        
        const localTrip: Trip = {
          id: tripId, // Use tripId from URL params instead of firestoreTrip.id
          title: firestoreTrip.title,
          startDate: firestoreTrip.startDate,
          endDate: firestoreTrip.endDate,
          ownerId: firestoreTrip.ownerId,
          editors: firestoreTrip.editors || [],
          viewers: firestoreTrip.viewers || [],
          locations: firestoreTrip.locations || [],
          tripData: { locations: fixedLocations }
        };
        
        console.log('✅ Setting trip state and locations, clearing loading...');
        setTrip(localTrip);
        setLocations(fixedLocations);
        console.log('✅ Trip loaded successfully, isLoading should be false');
      } else {
        console.log('❌ Trip not found in Firestore');
        toast({
          title: "Error",
          description: "Trip not found. It may still be being created.",
          variant: "destructive",
        });
        // Wait a bit and try again
        setTimeout(() => {
          loadTripWithRetry();
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      toast({
        title: "Error",
        description: "Failed to load trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🔄 Setting isLoading to false in loadTrip finally block');
      setIsLoading(false);
    }
  };

  // Save trip to Firestore when locations change
  useEffect(() => {
    if (trip && locations.length > 0 && trip.editors !== undefined && trip.viewers !== undefined && !isLoading) {
      console.log('🔄 Auto-saving trip due to changes...');
      saveTrip();
    } else {
      console.log('⏸️ Skipping auto-save - trip not ready:', {
        hasTrip: !!trip,
        locationsLength: locations.length,
        hasEditors: trip?.editors !== undefined,
        hasViewers: trip?.viewers !== undefined,
        isLoading: isLoading
      });
    }
  }, [locations, trip, isLoading]);

  const saveTrip = async () => {
    if (!trip || !trip.id) {
      console.log('⚠️ Cannot save trip - missing trip or trip.id:', { trip: !!trip, tripId: trip?.id });
      return;
    }
    
    try {
      console.log('🔍 Saving trip with data:', {
        tripId: trip.id,
        hasEditors: Array.isArray(trip.editors),
        hasViewers: Array.isArray(trip.viewers),
        hasLocations: Array.isArray(trip.locations),
        editorsLength: trip.editors?.length,
        viewersLength: trip.viewers?.length,
        locationsLength: trip.locations?.length,
      });

      const allDates = locations.flatMap(l => l.dateBlocks.map(d => new Date(d.date)));
      
      let startDate = trip.startDate;
      let endDate = trip.endDate;
      
      if (allDates.length > 0) {
        allDates.sort((a,b) => a.getTime() - b.getTime());
        startDate = allDates[0].toISOString();
        endDate = allDates[allDates.length - 1].toISOString();
      }

      const updateData = {
        title: trip.title,
        startDate,
        endDate,
        locations: locations.map(loc => loc.name), // Top-level locations array for compatibility
        editors: Array.isArray(trip.editors) ? trip.editors : [], // Ensure editors array exists
        viewers: Array.isArray(trip.viewers) ? trip.viewers : [], // Ensure viewers array exists
        tripData: {
          locations: locations.map(loc => ({
            ...loc,
            dateBlocks: loc.dateBlocks.map(db => ({
              ...db,
              date: db.date.toISOString()
            }))
          }))
        }
      };

      console.log('🔍 Saving trip with data:', {
        tripId: trip.id,
        hasEditors: Array.isArray(updateData.editors),
        hasViewers: Array.isArray(updateData.viewers),
        hasLocations: Array.isArray(updateData.locations),
        editorsLength: updateData.editors?.length,
        viewersLength: updateData.viewers?.length,
        locationsLength: updateData.locations?.length,
        updateData
      });

      await updateTrip(trip.id, updateData);
    } catch (error) {
      console.error('Error saving trip:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const { allDates, tripStartDate, tripEndDate, totalDays, totalNights } = useMemo(() => {
    if (!locations || locations.length === 0) {
       if (trip) {
         const startDate = new Date(trip.startDate);
         return { allDates: [], tripStartDate: startDate, tripEndDate: startDate, totalDays: 1, totalNights: 0 };
       }
      return { allDates: [], tripStartDate: null, tripEndDate: null, totalDays: 0, totalNights: 0 };
    }
    const allDates = locations.flatMap(l => l.dateBlocks.map(d => d.date));
    if (allDates.length === 0) {
        if (trip) {
            const startDate = new Date(trip.startDate);
            return { allDates: [], tripStartDate: startDate, tripEndDate: startDate, totalDays: 1, totalNights: 0 };
        }
      return { allDates, tripStartDate: null, tripEndDate: null, totalDays: 0, totalNights: 0 };
    }

    allDates.sort((a,b) => a.getTime() - b.getTime());
    const tripStartDate = allDates[0];
    const tripEndDate = allDates[allDates.length - 1];
    const totalDays = differenceInDays(tripEndDate, tripStartDate) + 1;
    const totalNights = totalDays > 0 ? totalDays - 1 : 0;
    
    return { allDates, tripStartDate, tripEndDate, totalDays, totalNights };
  }, [locations, trip]);

  const handleAddLocation = () => {
    setLocations(currentLocations => {
      const newLocations = deepCopyAndParseDates(currentLocations);
      const lastLocation = newLocations.length > 0 ? newLocations[newLocations.length - 1] : null;
  
      let newLocationStartDate;
      if (lastLocation && lastLocation.dateBlocks.length > 0) {
        // Use the LAST day of the previous location as the FIRST day of the new location
        const lastDateOfPreviousLocation = new Date(Math.max(...lastLocation.dateBlocks.map(d => d.date.getTime())));
        newLocationStartDate = lastDateOfPreviousLocation; // No addDays - use the same date
      } else {
        // First location starts on the trip's start date
        newLocationStartDate = trip?.startDate ? new Date(trip.startDate) : new Date();
      }
  
      const newLocation: Location = {
        id: crypto.randomUUID(),
        name: 'New Location',
        dateBlocks: [{ id: crypto.randomUUID(), date: newLocationStartDate }],
      };
      
      return [...newLocations, newLocation];
    });
  };

  const handleAddDate = (locationId: string) => {
    setLocations(currentLocations => {
      const newLocations = deepCopyAndParseDates(currentLocations);
      const locationIndex = newLocations.findIndex(l => l.id === locationId);
      if (locationIndex === -1) return newLocations;

      const locationToUpdate = newLocations[locationIndex];
      const lastDate = locationToUpdate.dateBlocks.length > 0
        ? new Date(Math.max(...locationToUpdate.dateBlocks.map(d => d.date.getTime())))
        : (tripEndDate || new Date());
      
      const newDate = addDays(lastDate, 1);
      locationToUpdate.dateBlocks.push({ id: crypto.randomUUID(), date: newDate });
      locationToUpdate.dateBlocks.sort((a,b) => a.date.getTime() - b.date.getTime());

      // Shift ALL subsequent locations forward by 1 day to maintain continuity
      for (let i = locationIndex + 1; i < newLocations.length; i++) {
        newLocations[i].dateBlocks = newLocations[i].dateBlocks.map(db => ({
          ...db,
          date: addDays(db.date, 1)
        }));
      }

      return newLocations;
    });
  };

  const handleDeleteDate = (locationId: string, dateBlockId: string) => {
    setLocations(currentLocations => {
      const newLocations = deepCopyAndParseDates(currentLocations);
      const locationIndex = newLocations.findIndex(l => l.id === locationId);
      if (locationIndex === -1) return newLocations;
      
      const location = newLocations[locationIndex];
      if (location.dateBlocks.length <= 1) {
        toast({
          title: "Cannot delete date",
          description: "Each location must have at least one day.",
          variant: "destructive",
        });
        return newLocations;
      }
      
      const dateToDelete = location.dateBlocks.find(db => db.id === dateBlockId);
      location.dateBlocks = location.dateBlocks.filter(db => db.id !== dateBlockId);
      location.dateBlocks.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Shift subsequent locations backward by 1 day
      if (dateToDelete) {
        for (let i = locationIndex + 1; i < newLocations.length; i++) {
          newLocations[i].dateBlocks = newLocations[i].dateBlocks.map(db => ({
            ...db,
            date: subDays(db.date, 1)
          }));
        }
      }

      return newLocations;
    });
  };

  const handleDeleteLocation = (locationId: string) => {
    setLocations(currentLocations => {
        const newLocations = deepCopyAndParseDates(currentLocations);
        const locationIndex = newLocations.findIndex(l => l.id === locationId);
        if (locationIndex === -1) return newLocations;
        
        const daysInDeletedLocation = newLocations[locationIndex].dateBlocks.length;
        const remainingLocations = newLocations.filter(l => l.id !== locationId);

        if (remainingLocations.length === 0) {
            setTrip(prevTrip => prevTrip ? { ...prevTrip, tripData: { locations: [] } } : null);
            return [];
        }

        // Shift subsequent locations back by the duration of the deleted location
        for (let i = locationIndex; i < remainingLocations.length; i++) {
            remainingLocations[i].dateBlocks = remainingLocations[i].dateBlocks.map(db => ({
                ...db,
                date: subDays(db.date, daysInDeletedLocation)
            }));
        }
        
        return remainingLocations;
    });
    setDeletingLocationId(null);
  };
  
  const handleEditLocationName = (location: Location) => {
    setEditingLocationId(location.id);
    if (location.name === 'New Location') {
      setTempLocationName('');
    } else {
      setTempLocationName(location.name);
    }
  };
  
  const handleLocationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempLocationName(e.target.value);
  };

  const handleSaveLocationName = (locationId: string) => {
    setLocations(locations.map(loc => 
      loc.id === locationId ? { ...loc, name: tempLocationName || "New Location" } : loc
    ));
    setEditingLocationId(null);
  };

    const handleLocationNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, locationId: string) => {
    if (e.key === 'Enter') {
      handleSaveLocationName(locationId);
    } else if (e.key === 'Escape') {
      setEditingLocationId(null);
    }
  };

  const handleFindHotels = (location: Location) => {
    if (location.dateBlocks.length === 0) {
        toast({
          title: "Cannot search Hotels.com",
          description: "Please add dates to the location first.",
          variant: "destructive"
        });
        return;
    }
    const sortedDates = [...location.dateBlocks].sort((a,b) => a.date.getTime() - b.date.getTime());
    const checkin = format(sortedDates[0].date, 'yyyy-MM-dd');
    const checkout = format(addDays(sortedDates[sortedDates.length - 1].date, 1), 'yyyy-MM-dd');
    
    // Hotels.com integration with better parameters
    const url = `https://www.hotels.com/search.do?destination-id=${encodeURIComponent(location.name)}&q-check-in=${checkin}&q-check-out=${checkout}&q-rooms=1&q-room-0-adults=2&q-room-0-children=0&sort-order=BEST_SELLER`;
    
    // Open in new tab and show success message
    window.open(url, '_blank');
    toast({
      title: "Searching Hotels.com",
      description: `Opening Hotels.com for ${location.name} (${checkin} to ${checkout})`,
    });
  };
    
    const handleCardClick = (e: MouseEvent, loc: Location) => {
    if ((e.target as HTMLElement).closest('button, a, input')) {
      return;
    }
    router.push(`/trips/${tripId}/locations/${loc.id}`);
  };



  const sortedLocations = useMemo(() => {
    if (!locations) return [];
    return [...locations].sort((a, b) => {
      if (a.dateBlocks.length === 0) return 1;
      if (b.dateBlocks.length === 0) return -1;
      const aStartDate = Math.min(...a.dateBlocks.map(d => d.date.getTime()));
      const bStartDate = Math.min(...b.dateBlocks.map(d => d.date.getTime()));
      return aStartDate - bStartDate;
    });
  }, [locations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trip) {
    return <div>Loading trip...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-background font-sans text-foreground flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-4">
                     <Button variant="link" className="text-foreground/80 p-0 h-auto" asChild>
                        <Link href="/">
                            <ChevronLeft className="w-4 h-4 mr-1"/>
                            Back to My Trips
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <PublishTripDialog trip={trip as any}>
                        <Button variant="outline" className="bg-card hover:bg-secondary/50">
                            <Upload className="mr-2 h-4 w-4"/>
                            Publish
                        </Button>
                    </PublishTripDialog>
                    <ShareTripDialog tripId={tripId} tripTitle={trip?.title || 'Trip'}>
                        <Button variant="outline" className="bg-card hover:bg-secondary/50">
                            <Share2 className="mr-2 h-4 w-4"/>
                            Share
                        </Button>
                    </ShareTripDialog>
                    <DeleteTripDialog trip={trip as any} onTripDeleted={() => router.push('/')}>
                        <Button variant="outline" className="bg-card hover:bg-secondary/50 border-destructive/20 text-destructive hover:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete
                        </Button>
                    </DeleteTripDialog>
                </div>
            </div>
            <div className="flex justify-between items-end pb-4">
                <div>
                    <h1 className="text-4xl font-bold text-foreground font-headline tracking-tight">{trip.title}</h1>
                    {tripStartDate && tripEndDate && (
                        <p className="text-foreground/60 mt-1">
                            {format(tripStartDate, "MMM d, yyyy")} - {format(tripEndDate, "MMM d, yyyy")} ({totalDays} days / {totalNights} nights)
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="default" className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Sparkles className="mr-2 h-4 w-4"/>
                        Suggest Durations
                    </Button>
                </div>
            </div>
        </div>
      </header>

      {/* Real-time collaboration status */}
      <div className="bg-background border-b">
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

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {sortedLocations.map((loc) => {
              const sortedDateBlocks = [...loc.dateBlocks].sort((a,b) => a.date.getTime() - b.date.getTime());
              const days = loc.dateBlocks.length;
              const nights = days > 0 ? days -1 : 0;
              
              const isEditing = editingLocationId === loc.id;
              
              return (
                <Card 
                  key={loc.id} 
                  className="p-4 grid grid-cols-12 gap-4 items-start cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={(e) => handleCardClick(e, loc)}
                >
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-2">
                        <div className="flex items-center gap-2 group">
                          <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                          {isEditing ? (
                              <Input
                                  type="text"
                                  value={tempLocationName}
                                  onChange={handleLocationNameChange}
                                  onBlur={() => handleSaveLocationName(loc.id)}
                                  onKeyDown={(e) => handleLocationNameKeyDown(e, loc.id)}
                                  autoFocus
                                  className="text-xl font-bold h-8"
                              />
                          ) : (
                            <Link href={`/trips/${tripId}/locations/${loc.id}`} className="text-xl font-bold truncate hover:underline">
                              {loc.name}
                            </Link>
                          )}
                          {!isEditing && (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditLocationName(loc)}>
                                  <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/80 hover:text-destructive hover:bg-destructive/10" onClick={() => setDeletingLocationId(loc.id)}>
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                                                <p className="text-sm text-foreground/60 pl-7">
                          {days > 0 ? `${days} day${days === 1 ? '' : 's'} / ${nights} night${nights === 1 ? '' : 's'}` : 'No days assigned'}
                        </p>
                        <Button variant="outline" size="sm" className="gap-2 text-foreground/80 bg-card hover:bg-secondary/50" onClick={() => handleFindHotels(loc)}>
                           <Hotel className="w-4 h-4"/>
                           Hotels.com
                        </Button>
                      </div>
                    
                    <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-wrap gap-2 items-center">
                        {sortedDateBlocks.map((block, index) => {
                            const isFirst = index === 0;
                            const isLast = index === sortedDateBlocks.length - 1;
                            return (
                                <DateBlockComponent 
                                    key={block.id} 
                                    block={block}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    onDelete={() => handleDeleteDate(loc.id, block.id)}
                                />
                            );
                        })}
                        <Button
                          variant="outline"
                          className="w-24 h-24 bg-card"
                          onClick={() => handleAddDate(loc.id)}
                        >
                          <PlusCircle className="h-6 w-6" />
                        </Button>
                    </div>
                </Card>
              );
          })}
           <Button variant="outline" className="w-full border-dashed p-8" onClick={handleAddLocation}>
              <Plus className="mr-2 h-4 w-4"/>
              Add Location
            </Button>
        </div>
      </main>
      
      <AlertDialog open={deletingLocationId !== null} onOpenChange={(isOpen) => !isOpen && setDeletingLocationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              location and all associated dates from your trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingLocationId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingLocationId) {
                  handleDeleteLocation(deletingLocationId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

  

    