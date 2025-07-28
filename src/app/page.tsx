
"use client";

import { useState, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Plus, RotateCw, Users, Share2, Clock } from 'lucide-react';
import { getPexelsImage, getNewPexelsImage } from './actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { getUserTrips, createTrip, updateTrip, Trip, testFirestoreConnection } from '@/lib/firestore';
import { ShareTripDialog } from '@/components/ShareTripDialog';
import { PendingInvitations } from '@/components/PendingInvitations';
import { TripImage } from '@/components/TripImage';

import { useToast } from '@/hooks/use-toast';

const initialTrips = [
  {
    id: '1',
    title: 'Asia Trip 2025',
    startDate: '2025-12-03',
    endDate: '2025-12-08',
    locations: ['Hong Kong', 'Vancouver'],
    imageUrl: '', // Will be set by TripImage component
    imageHint: 'asia landscape',
    tripData: {
      locations: [
        { id: 'loc1', name: 'Hong Kong', dateBlocks: [{ id: 'date1', date: '2025-12-03T00:00:00.000Z' }, { id: 'date2', date: '2025-12-04T00:00:00.000Z' }] },
        { id: 'loc2', name: 'Vancouver', dateBlocks: [{ id: 'date3', date: '2025-12-04T00:00:00.000Z' }, { id: 'date4', date: '2025-12-05T00:00:00.000Z' }, { id: 'date5', date: '2025-12-06T00:00:00.000Z' }, { id: 'date6', date: '2025-12-07T00:00:00.000Z' }, { id: 'date7', date: '2025-12-08T00:00:00.000Z' }] }
      ]
    }
  },
  {
    id: '2',
    title: 'European Adventure',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    locations: ['Paris', 'Rome', 'Barcelona'],
              imageUrl: '', // Will be set by TripImage component
          imageHint: 'europe landscape',
    tripData: {
      locations: [
        { id: 'loc3', name: 'Paris', dateBlocks: [{ id: 'date8', date: '2026-06-15T00:00:00.000Z' }] },
        { id: 'loc4', name: 'Rome', dateBlocks: [{ id: 'date9', date: '2026-06-15T00:00:00.000Z' }] },
        { id: 'loc5', name: 'Barcelona', dateBlocks: [{ id: 'date10', date: '2026-06-15T00:00:00.000Z' }] }
      ]
    }
  },
  {
    id: '3',
    title: 'South America Discovery',
    startDate: '2026-09-01',
    endDate: '2026-09-21',
    locations: ['Peru', 'Brazil', 'Argentina'],
    imageUrl: '', // Will be set by TripImage component
    imageHint: 'south america landscape',
    tripData: {
       locations: [
        { id: 'loc6', name: 'Peru', dateBlocks: [{ id: 'date11', date: '2026-09-01T00:00:00.000Z' }] },
        { id: 'loc7', name: 'Brazil', dateBlocks: [{ id: 'date12', date: '2026-09-01T00:00:00.000Z' }] },
        { id: 'loc8', name: 'Argentina', dateBlocks: [{ id: 'date13', date: '2026-09-01T00:00:00.000Z' }] }
      ]
    }
  },
];

export default function MyTripsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripStartDate, setNewTripStartDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Load trips from Firestore
  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  // Add retry functionality
  const handleRetry = () => {
    if (user) {
      loadTrips();
    }
  };

  // Test Firestore connection
  const handleTestConnection = async () => {
    if (!user) return;
    
    try {
      const result = await testFirestoreConnection(user.uid);
      if (result.success) {
        toast({
          title: "Connection Test",
          description: "Firestore connection is working!",
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.error instanceof Error ? result.error.message : "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: "Test Failed",
        description: "Could not test connection",
        variant: "destructive",
      });
    }
  };

  const loadTrips = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Loading trips for user:', user.uid);
      
      const userTrips = await getUserTrips(user.uid);
      console.log('Loaded trips:', userTrips);
      
      if (userTrips.length === 0) {
        console.log('No trips found, creating sample trips');
        // Create initial sample trips for new users
        const sampleTrips = await createSampleTrips();
        setTrips(sampleTrips);
      } else {
        setTrips(userTrips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      
      // More specific error handling
      let errorMessage = "Failed to load trips. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMessage = "Permission denied. Please check your account.";
        } else if (error.message.includes('unavailable')) {
          errorMessage = "Service temporarily unavailable. Please try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Set empty trips array to prevent infinite loading
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleTrips = async (): Promise<Trip[]> => {
    if (!user) return [];
    
    try {
      console.log('Creating sample trips for user:', user.uid);
      
                    const sampleTrips = [
        {
          ownerId: user.uid,
          editors: [],
          viewers: [],
          title: 'Asia Trip 2025',
          startDate: '2025-12-03',
          endDate: '2025-12-08',
          locations: ['Hong Kong', 'Vancouver'],
          imageUrl: '', // Will be set by TripImage component
          imageHint: 'asia landscape',
          tripData: {
            locations: [
              { 
                id: 'loc1', 
                name: 'Hong Kong', 
                dateBlocks: [
                  { id: 'date1', date: '2025-12-03T00:00:00.000Z', activities: [] }, 
                  { id: 'date2', date: '2025-12-04T00:00:00.000Z', activities: [] }
                ] 
              },
              { 
                id: 'loc2', 
                name: 'Vancouver', 
                dateBlocks: [
                  { id: 'date3', date: '2025-12-04T00:00:00.000Z', activities: [] }, // Same as last day of Hong Kong
                  { id: 'date4', date: '2025-12-05T00:00:00.000Z', activities: [] }, 
                  { id: 'date5', date: '2025-12-06T00:00:00.000Z', activities: [] }, 
                  { id: 'date6', date: '2025-12-07T00:00:00.000Z', activities: [] }, 
                  { id: 'date7', date: '2025-12-08T00:00:00.000Z', activities: [] }
                ] 
              }
            ]
          }
        },
        {
          ownerId: user.uid,
          editors: [],
          viewers: [],
          title: 'European Adventure',
          startDate: '2026-06-15',
          endDate: '2026-06-28',
          locations: ['Paris', 'Rome', 'Barcelona'],
          imageUrl: '', // Will be set by TripImage component
          imageHint: 'europe landscape',
          tripData: {
            locations: [
              { id: 'loc3', name: 'Paris', dateBlocks: [{ id: 'date8', date: '2026-06-15T00:00:00.000Z', activities: [] }] },
              { id: 'loc4', name: 'Rome', dateBlocks: [{ id: 'date9', date: '2026-06-15T00:00:00.000Z', activities: [] }] },
              { id: 'loc5', name: 'Barcelona', dateBlocks: [{ id: 'date10', date: '2026-06-15T00:00:00.000Z', activities: [] }] }
            ]
          }
        }
      ];

      const createdTrips: Trip[] = [];
      for (const tripData of sampleTrips) {
        try {
          const tripId = await createTrip(tripData);
          createdTrips.push({ ...tripData, id: tripId });
          console.log('Created sample trip:', tripId);
        } catch (error) {
          console.error('Error creating sample trip:', error);
        }
      }

      console.log('Successfully created', createdTrips.length, 'sample trips');
      return createdTrips;
    } catch (error) {
      console.error('Error in createSampleTrips:', error);
      return [];
    }
  };


  const handleCreateTrip = async () => {
    if (newTripTitle && newTripStartDate && user) {
      try {
        console.log('Creating trip for user:', user.uid);
        console.log('Trip title:', newTripTitle);
        console.log('Trip start date:', newTripStartDate);
        
        const newTripData = {
          ownerId: user.uid,
          editors: [],
          viewers: [],
          title: newTripTitle,
          startDate: format(newTripStartDate, 'yyyy-MM-dd'),
          endDate: format(newTripStartDate, 'yyyy-MM-dd'),
          locations: ['New Location'],
          imageUrl: '', // Will be set by TripImage component
          imageHint: 'new trip landscape',
          tripData: {
            locations: [
              {
                id: crypto.randomUUID(),
                name: 'New Location',
                dateBlocks: [{ 
                  id: crypto.randomUUID(), 
                  date: newTripStartDate.toISOString(),
                  activities: []
                }],
              },
            ],
          },
        };
        
        console.log('Trip data to create:', newTripData);
        const tripId = await createTrip(newTripData);
        console.log('Successfully created trip with ID:', tripId);
        
        const newTrip = { ...newTripData, id: tripId };
        setTrips(prevTrips => [...prevTrips, newTrip]);
        setNewTripTitle('');
        setNewTripStartDate(new Date());
        setDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Trip created successfully!",
        });
        
        // Add a small delay to ensure Firestore has propagated the data
        setTimeout(() => {
          router.push(`/trips/${tripId}`);
        }, 500);
        
      } catch (error) {
        console.error('Error creating trip:', error);
        
        // More specific error handling
        let errorMessage = "Failed to create trip. Please try again.";
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            errorMessage = "Permission denied. Please check your account.";
          } else if (error.message.includes('unavailable')) {
            errorMessage = "Service temporarily unavailable. Please try again.";
          } else {
            errorMessage = error.message;
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      console.log('Missing required data:', { 
        hasTitle: !!newTripTitle, 
        hasDate: !!newTripStartDate, 
        hasUser: !!user 
      });
    }
  };
  
  const handleUpdateImage = async (e: MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const tripToUpdate = trips.find(t => t.id === tripId);
    if (!tripToUpdate || tripToUpdate.locations.length === 0) return;

    const firstLocation = tripToUpdate.locations[0];
    try {
      const imageData = await getNewPexelsImage(`${firstLocation} iconic`);
      if (imageData?.url) {
        await updateTrip(tripId, { imageUrl: imageData.url });
        setTrips(currentTrips => {
          return currentTrips.map(trip => {
            if (trip.id === tripId) {
              return { ...trip, imageUrl: imageData.url };
            }
            return trip;
          });
        });
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: "Failed to update image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          {/* Updated trip cards with proper layout and information - Ready for new API key - Force redeploy */}
          <h1 className="text-3xl font-bold text-gray-900 font-headline">My Trips</h1>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a new trip</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="trip-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="trip-title"
                    value={newTripTitle}
                    onChange={(e) => setNewTripTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. Summer in Italy"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">
                    Start Date
                  </Label>
                  <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="col-span-3 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTripStartDate ? format(newTripStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTripStartDate}
                        onSelect={(date) => {
                          setNewTripStartDate(date);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateTrip}>Create Trip</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PendingInvitations />
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your trips...</p>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6">Create your first trip to start planning your next adventure!</p>
            <div className="space-x-4">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Trip
              </Button>
              <Button variant="outline" onClick={handleRetry}>
                <RotateCw className="mr-2 h-4 w-4" />
                Retry Loading
              </Button>
              <Button variant="outline" onClick={handleTestConnection}>
                🔧 Test Connection
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.filter(trip => trip.id).map((trip) => {
              console.log('Rendering trip:', trip.title, 'ownerId:', trip.ownerId, 'user.uid:', user?.uid, 'isOwner:', trip.ownerId === user?.uid);
              return (
              <Link href={`/trips/${trip.id!}`} key={trip.id!} className="block">
              <Card className="group overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer hover:scale-[1.02]">
                <div className="relative h-48">
                    <TripImage
                      src={trip.imageUrl}
                      alt={trip.title}
                      title={trip.title}
                      locations={trip.locations}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/80 hover:text-white hover:bg-white/30 backdrop-blur-sm"
                            onClick={(e) => handleUpdateImage(e, trip.id!)}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Get a new image</p>
                        </TooltipContent>
                      </Tooltip>
                      <ShareTripDialog tripId={trip.id!} tripTitle={trip.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-white/80 hover:text-white hover:bg-white/30 backdrop-blur-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Share trip</p>
                          </TooltipContent>
                        </Tooltip>
                      </ShareTripDialog>
                    </div>

                    <CardHeader className="absolute bottom-0 left-0 right-0 text-white p-4">
                      <CardTitle className="text-2xl font-bold">{trip.title}</CardTitle>
                    </CardHeader>
                </div>
                <CardContent className="p-6 pt-5 flex-grow">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{format(new Date(trip.startDate), 'MMM d, yyyy')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span className="truncate">{trip.locations.join(', ')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>
                      {(() => {
                        const start = new Date(trip.startDate);
                        const end = new Date(trip.endDate);
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        const nights = days - 1;
                        return `${days} day${days === 1 ? '' : 's'} / ${nights} night${nights === 1 ? '' : 's'}`;
                      })()}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-6 bg-gray-50/80 border-t backdrop-blur-sm">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="mr-2 h-4 w-4" />
                        <span>
                          {trip.editors.length + trip.viewers.length > 0 
                            ? `Shared with ${trip.editors.length + trip.viewers.length} other${trip.editors.length + trip.viewers.length !== 1 ? 's' : ''}`
                            : 'Not shared'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {trip.ownerId === user?.uid && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Owner</span>
                        )}
                        {trip.editors.includes(user?.uid || '') && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Editor</span>
                        )}
                        {trip.viewers.includes(user?.uid || '') && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Viewer</span>
                        )}
                      </div>
                    </div>
                </CardFooter>
              </Card>
            </Link>
            );
            })}
          </div>
        )}
      </main>
    </div>
    </TooltipProvider>
  );
}
