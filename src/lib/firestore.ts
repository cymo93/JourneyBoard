import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface Trip {
  id?: string;
  ownerId: string;        // Original creator
  editors: string[];      // Array of user IDs who can edit
  viewers: string[];      // Array of user IDs who can view only
  title: string;
  startDate: string;
  endDate: string;
  locations: string[];
  imageUrl: string;
  imageHint: string;
  tripData: {
    locations: Array<{
      id: string;
      name: string;
      dateBlocks: Array<{
        id: string;
        date: string;
        activities?: Array<{
          id: string;
          notes: string;
        }>;
      }>;
    }>;
  };
  createdAt?: any;
  updatedAt?: any;
}

export type TripCategory = 'Weekend' | 'Week-long' | 'Extended' | 'Budget' | 'Luxury' | 'Adventure' | 'Culture' | 'Food' | 'Nature' | 'Family' | 'Romantic' | 'Business';

export interface PublishedTrip {
  id?: string;
  originalTripId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  category: TripCategory;
  tags: string[];
  duration: number; // days
  locationCount: number;
  publishedAt?: any;
  usageCount: number;
  rating: number;
  ratingCount: number;
  isPublic: boolean;
  templateData: {
    locations: Array<{
      id: string;
      name: string;
      relativeDays: number; // days from start
      duration: number; // days at this location
      suggestedActivities: string[];
    }>;
  };
}

export interface TemplateRating {
  id?: string;
  templateId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  review?: string;
  helpfulCount: number;
  createdAt?: any;
}

// Helper function to check if user has access to a trip
export const hasTripAccess = (trip: Trip, userId: string, accessLevel: 'view' | 'edit' | 'owner' = 'view'): boolean => {
  if (accessLevel === 'owner') {
    return trip.ownerId === userId;
  }
  if (accessLevel === 'edit') {
    return trip.ownerId === userId || (trip.editors && trip.editors.includes(userId));
  }
  return trip.ownerId === userId || (trip.editors && trip.editors.includes(userId)) || (trip.viewers && trip.viewers.includes(userId));
};

// Get all trips for a user (owned, edited, or viewed)
export const getUserTrips = async (userId: string): Promise<Trip[]> => {
  try {
    console.log('Fetching trips for userId:', userId);
    const tripsRef = collection(db, 'trips');
    
    // Query for trips where user is owner, editor, or viewer
    const ownedQuery = query(
      tripsRef, 
      where('ownerId', '==', userId)
    );
    
    const editedQuery = query(
      tripsRef,
      where('editors', 'array-contains', userId)
    );
    
    const viewedQuery = query(
      tripsRef,
      where('viewers', 'array-contains', userId)
    );
    
    console.log('Fetching owned, edited, and viewed trips...');
    const [ownedSnapshot, editedSnapshot, viewedSnapshot] = await Promise.all([
      getDocs(ownedQuery),
      getDocs(editedQuery),
      getDocs(viewedQuery)
    ]);
    
    // Combine all trips and remove duplicates
    const allTrips = new Map<string, Trip>();
    
    // Add owned trips
    ownedSnapshot.docs.forEach(doc => {
      allTrips.set(doc.id, { id: doc.id, ...doc.data() } as Trip);
    });
    
    // Add edited trips
    editedSnapshot.docs.forEach(doc => {
      if (!allTrips.has(doc.id)) {
        allTrips.set(doc.id, { id: doc.id, ...doc.data() } as Trip);
      }
    });
    
    // Add viewed trips
    viewedSnapshot.docs.forEach(doc => {
      if (!allTrips.has(doc.id)) {
        allTrips.set(doc.id, { id: doc.id, ...doc.data() } as Trip);
      }
    });
    
    const trips = Array.from(allTrips.values());
    
    // Sort by createdAt (newest first)
    trips.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
    
    console.log('Successfully fetched', trips.length, 'trips (owned:', ownedSnapshot.docs.length, 'edited:', editedSnapshot.docs.length, 'viewed:', viewedSnapshot.docs.length, ')');
    return trips;
  } catch (error) {
    console.error('Error getting user trips:', error);
    throw error;
  }
};

// Get a single trip by ID
export const getTrip = async (tripId: string): Promise<Trip | null> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    
    if (tripSnap.exists()) {
      const rawTripData = tripSnap.data();
      
      // Ensure trip data has required structure
      const safeTrip = ensureTripDataStructure({
        id: tripSnap.id,
        ...rawTripData
      });
      
      // Auto-migrate trip data if needed (asynchronously)
      if (!rawTripData.editors || !rawTripData.viewers || !rawTripData.locations) {
        console.log('🔄 Auto-migrating trip data for:', tripId);
        // Don't block the return, just trigger migration in background
        migrateTripData(tripId).catch(error => {
          console.error('❌ Background migration failed:', error);
        });
      }
      
      return safeTrip;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

// Create a new trip
export const createTrip = async (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const tripsRef = collection(db, 'trips');
    const docRef = await addDoc(tripsRef, {
      ...tripData,
      editors: tripData.editors || [],
      viewers: tripData.viewers || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

// Update a trip
export const updateTrip = async (tripId: string, tripData: Partial<Trip>): Promise<void> => {
  try {
    console.log('🔍 Backend updateTrip called with:', {
      tripId,
      hasEditors: Array.isArray(tripData.editors),
      hasViewers: Array.isArray(tripData.viewers),
      hasLocations: Array.isArray(tripData.locations),
      editorsLength: tripData.editors?.length,
      viewersLength: tripData.viewers?.length,
      locationsLength: tripData.locations?.length,
      tripData: JSON.stringify(tripData, null, 2)
    });

    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      ...tripData,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Trip update successful for:', tripId);
  } catch (error) {
    console.error('❌ Error updating trip:', error);
    throw error;
  }
};

// Delete a trip
export const deleteTrip = async (tripId: string): Promise<void> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Update all trips (for bulk operations)
export const updateAllTrips = async (userId: string, trips: Trip[]): Promise<void> => {
  try {
    const batch = trips.map(trip => 
      updateTrip(trip.id!, { ...trip, ownerId: userId })
    );
    await Promise.all(batch);
  } catch (error) {
    console.error('Error updating all trips:', error);
    throw error;
  }
}; 

// Test function to verify Firestore connectivity and permissions
export const testFirestoreConnection = async (userId: string) => {
  try {
    console.log('Testing Firestore connection for user:', userId);
    
    // Test write permission
    const testDocRef = doc(db, 'test', 'connection-test');
    await setDoc(testDocRef, {
      userId: userId,
      timestamp: new Date(),
      test: true
    });
    console.log('✅ Write test successful');
    
    // Test read permission
    const testDoc = await getDoc(testDocRef);
    console.log('✅ Read test successful:', testDoc.data());
    
    // Clean up test document
    await deleteDoc(testDocRef);
    console.log('✅ Delete test successful');
    
    return { success: true, message: 'All Firestore operations working' };
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return { success: false, error: error };
  }
};

// Helper function to ensure trip data has required arrays (defensive programming)
export const ensureTripDataStructure = (tripData: any): Trip => {
  return {
    ...tripData,
    editors: Array.isArray(tripData.editors) ? tripData.editors : [],
    viewers: Array.isArray(tripData.viewers) ? tripData.viewers : [],
    locations: Array.isArray(tripData.locations) ? tripData.locations : [],
  };
};

// Migration function to fix existing trips missing editors/viewers arrays
export const migrateTripData = async (tripId: string): Promise<void> => {
  try {
    console.log('🔄 Migrating trip data for:', tripId);
    const tripRef = doc(db, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (tripDoc.exists()) {
      const tripData = tripDoc.data();
      const updates: any = {};
      
      // Initialize editors array if missing
      if (!tripData.editors || !Array.isArray(tripData.editors)) {
        updates.editors = [];
        console.log('✅ Initialized editors array for trip:', tripId);
      }
      
      // Initialize viewers array if missing
      if (!tripData.viewers || !Array.isArray(tripData.viewers)) {
        updates.viewers = [];
        console.log('✅ Initialized viewers array for trip:', tripId);
      }
      
      // Initialize locations array if missing
      if (!tripData.locations || !Array.isArray(tripData.locations)) {
        updates.locations = [];
        console.log('✅ Initialized locations array for trip:', tripId);
      }
      
      // Only update if there are changes needed
      if (Object.keys(updates).length > 0) {
        await updateDoc(tripRef, updates);
        console.log('✅ Trip migration completed for:', tripId);
      } else {
        console.log('✅ Trip already has correct structure:', tripId);
      }
    }
  } catch (error) {
    console.error('❌ Trip migration failed for:', tripId, error);
    throw error;
  }
};

// Real-time trip subscription for live collaboration
export const subscribeToTripUpdates = (
  tripId: string, 
  onUpdate: (trip: Trip | null) => void,
  onError: (error: any) => void
) => {
  console.log('🔴 Setting up real-time listener for trip:', tripId);
  
  const tripRef = doc(db, 'trips', tripId);
  
  const unsubscribe = onSnapshot(
    tripRef,
    async (docSnap: any) => {
      if (docSnap.exists()) {
        const rawTripData = docSnap.data();
        
        // Ensure trip data has required structure before processing
        const safeTrip = ensureTripDataStructure(rawTripData);
        
        // Auto-migrate trip data if needed (asynchronously)
        if (!rawTripData.editors || !rawTripData.viewers || !rawTripData.locations) {
          console.log('🔄 Auto-migrating trip data in real-time listener for:', tripId);
          // Don't wait for migration, just trigger it in background
          migrateTripData(tripId).catch(error => {
            console.error('❌ Background migration failed:', error);
          });
        }
        
        console.log('🟢 Real-time update received for trip:', tripId, safeTrip.title);
        onUpdate(safeTrip);
      } else {
        console.log('🔴 Trip not found in real-time listener:', tripId);
        onUpdate(null);
      }
    },
    (error: any) => {
      console.error('❌ Real-time listener error for trip:', tripId, error);
      onError(error);
    }
  );
  
  return unsubscribe;
};

// Sharing functions
export const shareTrip = async (tripId: string, email: string, permission: 'edit' | 'view'): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if invitation already exists
    const invitationRef = doc(db, 'invitations', `${tripId}_${email}`);
    const existingInvitation = await getDoc(invitationRef);
    
    if (existingInvitation.exists()) {
      const existingData = existingInvitation.data();
      if (existingData.status === 'pending') {
        return { 
          success: false, 
          message: `Invitation already sent to ${email}. They can accept it when they log in.` 
        };
      } else if (existingData.status === 'accepted') {
        return { 
          success: false, 
          message: `${email} has already accepted this invitation.` 
        };
      }
    }
    
    // Create or update the invitation
    await setDoc(invitationRef, {
      tripId,
      email,
      permission,
      invitedAt: serverTimestamp(),
      status: 'pending'
    });
    
    return { 
      success: true, 
      message: `Invitation sent to ${email}. They'll see it when they log in to JourneyBoard.` 
    };
  } catch (error) {
    console.error('Error sharing trip:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to share trip' 
    };
  }
};

// Get pending invitations for a user (with Google Auth support)
export const getPendingInvitations = async (userEmail: string, user?: any): Promise<Array<{
  id: string;
  tripId: string;
  permission: 'edit' | 'view';
  invitedAt: any;
  tripTitle?: string;
}>> => {
  try {
    console.log('🔍 Getting pending invitations for user:', {
      userEmail,
      providerData: user?.providerData?.map((p: any) => ({ providerId: p.providerId, email: p.email }))
    });
    
    const invitationsRef = collection(db, 'invitations');
    
    // Create array of emails to check
    const emailsToCheck = [userEmail];
    
    // If user signed in with Google, also check all their provider emails
    if (user?.providerData) {
      for (const provider of user.providerData) {
        if (provider.email && !emailsToCheck.includes(provider.email)) {
          emailsToCheck.push(provider.email);
        }
      }
    }
    
    console.log('📧 Checking invitations for emails:', emailsToCheck);
    
    const allInvitations = [];
    
    // Check invitations for each email
    for (const email of emailsToCheck) {
      const q = query(
        invitationsRef,
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Found', snapshot.docs.length, 'pending invitations for', email);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        console.log('📄 Processing invitation:', {
          docId: docSnap.id,
          email: data.email,
          tripId: data.tripId,
          status: data.status,
          permission: data.permission,
          invitedAt: data.invitedAt?.toDate?.()?.toString()
        });
        
        // Get trip title for display and check if user already has access
        try {
          const tripDoc = await getDoc(doc(db, 'trips', data.tripId));
          if (tripDoc.exists()) {
            const tripData = tripDoc.data() as any;
            console.log('✅ Trip data found:', {
              tripId: data.tripId,
              title: tripData?.title,
              ownerId: tripData?.ownerId,
              editors: tripData?.editors,
              viewers: tripData?.viewers
            });
            
            // Check if user already has access to this trip
            const userHasAccess = tripData.ownerId === user?.uid || 
                                tripData.editors?.includes(user?.uid) || 
                                tripData.viewers?.includes(user?.uid);
            
            if (userHasAccess) {
              console.log('🔒 User already has access to trip:', data.tripId, '- marking invitation as accepted');
              // Mark invitation as accepted since user already has access
              try {
                await updateDoc(doc(db, 'invitations', docSnap.id), {
                  status: 'accepted',
                  acceptedAt: serverTimestamp(),
                  acceptedBy: user?.uid
                });
                console.log('✅ Marked invitation as accepted for user with existing access');
              } catch (updateError) {
                console.error('❌ Failed to update invitation status:', updateError);
              }
              // Don't add to pending invitations since user already has access
            } else {
              // User doesn't have access yet, add to pending invitations
              allInvitations.push({
                id: docSnap.id,
                tripId: data.tripId,
                permission: data.permission,
                invitedAt: data.invitedAt,
                tripTitle: tripData?.title || 'Untitled Trip'
              });
            }
          } else {
            console.warn('❌ Trip not found for ID:', data.tripId);
            // Clean up stale invitation
            try {
              await deleteDoc(doc(db, 'invitations', docSnap.id));
              console.log('🧹 Cleaned up stale invitation for deleted trip');
            } catch (cleanupError) {
              console.error('❌ Failed to clean up stale invitation:', cleanupError);
            }
            // Don't add to invitations list since it's invalid
          }
        } catch (error) {
          console.error('❌ Error fetching trip title for tripId:', data.tripId, error);
          // Add the invitation anyway but with error info
          allInvitations.push({
            id: docSnap.id,
            tripId: data.tripId,
            permission: data.permission,
            invitedAt: data.invitedAt,
            tripTitle: 'Error Loading Trip'
          });
        }
      }
    }
    
    // Remove duplicates based on invitation ID
    const uniqueInvitations = allInvitations.filter((invitation, index, self) => 
      index === self.findIndex((i) => i.id === invitation.id)
    );
    
    console.log('📤 Returning valid invitations:', uniqueInvitations.length, 'items');
    return uniqueInvitations;
  } catch (error) {
    console.error('❌ Error getting pending invitations:', error);
    return [];
  }
};

export const acceptInvitation = async (invitationId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🎯 Accepting invitation:', invitationId, 'for user:', userId);
    
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      console.error('❌ Invitation not found:', invitationId);
      return { success: false, message: 'Invitation not found' };
    }
    
    const invitation = invitationSnap.data();
    console.log('📄 Invitation data:', {
      tripId: invitation.tripId,
      email: invitation.email,
      permission: invitation.permission,
      status: invitation.status
    });
    
    if (!invitation.tripId) {
      console.error('❌ Invitation missing tripId:', invitation);
      return { success: false, message: 'Invalid invitation data' };
    }
    
    // Check if user already has access to this trip
    const tripRef = doc(db, 'trips', invitation.tripId);
    console.log('🔍 Checking trip access for:', invitation.tripId);
    
    const tripSnap = await getDoc(tripRef);
    
    if (!tripSnap.exists()) {
      console.error('❌ Trip not found:', invitation.tripId);
      // Clean up the invalid invitation
      await deleteDoc(invitationRef);
      return { success: false, message: 'Trip not found - invitation has been removed' };
    }
    
    const tripData = tripSnap.data();
    console.log('🗂️ Trip data:', {
      ownerId: tripData.ownerId,
      editors: tripData.editors || [],
      viewers: tripData.viewers || [],
      title: tripData.title
    });
    
    // Check if user already has access
    if (tripData.ownerId === userId || 
        tripData.editors?.includes(userId) || 
        tripData.viewers?.includes(userId)) {
      console.log('✅ User already has access to trip, marking invitation as accepted');
      await updateDoc(invitationRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: userId
      });
      return { success: true, message: 'You already have access to this trip' };
    }
    
    // Add user to the appropriate array
    if (invitation.permission === 'edit') {
      console.log('👥 Adding user as editor to trip:', invitation.tripId);
      await updateDoc(tripRef, {
        editors: arrayUnion(userId)
      });
    } else {
      console.log('👁️ Adding user as viewer to trip:', invitation.tripId);
      await updateDoc(tripRef, {
        viewers: arrayUnion(userId)
      });
    }
    
    // Mark invitation as accepted
    console.log('✅ Marking invitation as accepted');
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedBy: userId
    });
    
    console.log('🎉 Invitation accepted successfully');
    return { success: true, message: 'Invitation accepted successfully' };
  } catch (error) {
    console.error('❌ Error accepting invitation:', error);
    
    // Try to provide more specific error messages
    if (error instanceof Error) {
      console.error('📋 Error details:', {
        message: error.message,
        code: (error as any).code,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      
      if (error.message.includes('permission') || (error as any).code === 'permission-denied') {
        return { 
          success: false, 
          message: 'Permission denied. Please check Firestore security rules.' 
        };
      }
      if (error.message.includes('not-found') || (error as any).code === 'not-found') {
        return { 
          success: false, 
          message: 'Invitation or trip not found. It may have been deleted.' 
        };
      }
      return { 
        success: false, 
        message: `Error: ${error.message}` 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to accept invitation. Please try again.' 
    };
  }
};

export const removeTripAccess = async (tripId: string, userId: string, permission: 'edit' | 'view'): Promise<{ success: boolean; message: string }> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    
    if (permission === 'edit') {
      await updateDoc(tripRef, {
        editors: arrayRemove(userId)
      });
    } else {
      await updateDoc(tripRef, {
        viewers: arrayRemove(userId)
      });
    }
    
    return { success: true, message: 'Access removed successfully' };
  } catch (error) {
    console.error('Error removing trip access:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to remove access' 
    };
  }
};

// Image caching functions
export interface CachedImage {
  id?: string;
  locationName: string;
  imageUrl: string;
  alt: string;
  photographerUrl: string;
  cachedAt: any;
}

export const getCachedLocationImage = async (locationName: string): Promise<CachedImage | null> => {
  try {
    const imagesRef = collection(db, 'locationImages');
    const q = query(imagesRef, where('locationName', '==', locationName));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as CachedImage;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached image:', error);
    return null;
  }
};

export const cacheLocationImage = async (locationName: string, imageData: {
  url: string;
  alt: string;
  photographerUrl: string;
}): Promise<void> => {
  try {
    const imagesRef = collection(db, 'locationImages');
    await addDoc(imagesRef, {
      locationName,
      imageUrl: imageData.url,
      alt: imageData.alt,
      photographerUrl: imageData.photographerUrl,
      cachedAt: serverTimestamp()
    });
    console.log('Image cached for location:', locationName);
  } catch (error) {
    console.error('Error caching image:', error);
  }
};

// Template Publishing Functions

export const publishTrip = async (trip: Trip, user: any, templateData: {
  title: string;
  description: string;
  category: TripCategory;
  tags: string[];
}): Promise<string> => {
  try {
    // Validate trip can be published
    if (trip.tripData.locations.length < 2) {
      throw new Error('Trip must have at least 2 locations to be published');
    }

    // Calculate relative days and extract activities
    const templateLocations = trip.tripData.locations.map(location => {
      const sortedBlocks = location.dateBlocks.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const relativeDays = sortedBlocks.length > 0 ? 
        Math.floor((new Date(sortedBlocks[0].date).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      // Extract activities from all date blocks
      const allActivities = sortedBlocks.flatMap(block => 
        block.activities || []
      ).map(activity => activity.notes).filter(notes => notes.trim().length > 0);

      return {
        id: location.id,
        name: location.name,
        relativeDays,
        duration: sortedBlocks.length,
        suggestedActivities: allActivities
      };
    });

    const totalDays = Math.floor((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const publishedTrip: Omit<PublishedTrip, 'id' | 'publishedAt'> = {
      originalTripId: trip.id!,
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      title: templateData.title,
      description: templateData.description,
      category: templateData.category,
      tags: templateData.tags,
      duration: totalDays,
      locationCount: trip.tripData.locations.length,
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      isPublic: true,
      templateData: {
        locations: templateLocations
      }
    };

    const templateRef = await addDoc(collection(db, 'publishedTrips'), {
      ...publishedTrip,
      publishedAt: serverTimestamp()
    });

    console.log('Trip published as template:', templateRef.id);
    return templateRef.id;
  } catch (error) {
    console.error('Error publishing trip:', error);
    throw error;
  }
};

export const getPublishedTemplates = async (filters?: {
  category?: TripCategory;
  duration?: 'Weekend' | 'Week-long' | 'Extended';
  sortBy?: 'rating' | 'usageCount' | 'publishedAt';
  limit?: number;
}): Promise<PublishedTrip[]> => {
  try {
    let q = query(collection(db, 'publishedTrips'), where('isPublic', '==', true));

    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.duration) {
      let minDays = 1, maxDays = 3;
      if (filters.duration === 'Week-long') {
        minDays = 4;
        maxDays = 10;
      } else if (filters.duration === 'Extended') {
        minDays = 11;
        maxDays = 365;
      }
      q = query(q, where('duration', '>=', minDays), where('duration', '<=', maxDays));
    }

    // Add sorting
    if (filters?.sortBy) {
      const sortField = filters.sortBy === 'publishedAt' ? 'publishedAt' : filters.sortBy;
      const sortDirection = filters.sortBy === 'publishedAt' ? 'desc' : 'desc';
      q = query(q, orderBy(sortField, sortDirection));
    }

    const snapshot = await getDocs(q);
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublishedTrip));

    // Apply limit if specified
    if (filters?.limit) {
      return templates.slice(0, filters.limit);
    }

    return templates;
  } catch (error) {
    console.error('Error fetching published templates:', error);
    throw error;
  }
};

export const getPublishedTemplate = async (templateId: string): Promise<PublishedTrip | null> => {
  try {
    const templateRef = doc(db, 'publishedTrips', templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (templateSnap.exists()) {
      return { id: templateSnap.id, ...templateSnap.data() } as PublishedTrip;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

export const useTemplate = async (template: PublishedTrip, user: any, startDate: Date): Promise<string> => {
  try {
    // Generate date blocks based on template and start date
    const newLocations = template.templateData.locations.map(location => {
      const locationStartDate = new Date(startDate);
      locationStartDate.setDate(locationStartDate.getDate() + location.relativeDays);
      
      const dateBlocks = [];
      for (let i = 0; i < location.duration; i++) {
        const blockDate = new Date(locationStartDate);
        blockDate.setDate(blockDate.getDate() + i);
        
        dateBlocks.push({
          id: crypto.randomUUID(),
          date: blockDate.toISOString(),
          activities: location.suggestedActivities.map(activity => ({
            id: crypto.randomUUID(),
            notes: activity
          }))
        });
      }
      
      return {
        id: crypto.randomUUID(),
        name: location.name,
        dateBlocks
      };
    });

    // Calculate trip dates
    const allDates = newLocations.flatMap(loc => loc.dateBlocks.map(block => new Date(block.date)));
    const tripStartDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const tripEndDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    const newTrip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
      ownerId: user.uid,
      editors: [],
      viewers: [],
      title: template.title,
      startDate: tripStartDate.toISOString(),
      endDate: tripEndDate.toISOString(),
      locations: newLocations.map(loc => loc.name),
      imageUrl: '',
      imageHint: 'template trip',
      tripData: {
        locations: newLocations
      }
    };

    const tripId = await createTrip(newTrip);

    // Increment usage count
    const templateRef = doc(db, 'publishedTrips', template.id!);
    await updateDoc(templateRef, {
      usageCount: template.usageCount + 1
    });

    console.log('Template used to create trip:', tripId);
    return tripId;
  } catch (error) {
    console.error('Error using template:', error);
    throw error;
  }
};

export const rateTemplate = async (templateId: string, user: any, rating: number, review?: string): Promise<void> => {
  try {
    // Check if user already rated this template
    const ratingsRef = collection(db, 'templateRatings');
    const existingRatingQuery = query(
      ratingsRef,
      where('templateId', '==', templateId),
      where('userId', '==', user.uid)
    );
    
    const existingRatingSnap = await getDocs(existingRatingQuery);
    
    if (!existingRatingSnap.empty) {
      // Update existing rating
      const existingRatingDoc = existingRatingSnap.docs[0];
      await updateDoc(doc(db, 'templateRatings', existingRatingDoc.id), {
        rating,
        review,
        createdAt: serverTimestamp()
      });
    } else {
      // Create new rating
      await addDoc(ratingsRef, {
        templateId,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        rating,
        review,
        helpfulCount: 0,
        createdAt: serverTimestamp()
      });
    }

    // Update template rating
    const templateRef = doc(db, 'publishedTrips', templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (templateSnap.exists()) {
      const template = templateSnap.data() as PublishedTrip;
      const allRatingsQuery = query(ratingsRef, where('templateId', '==', templateId));
      const allRatingsSnap = await getDocs(allRatingsQuery);
      
      const ratings = allRatingsSnap.docs.map(doc => doc.data().rating);
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      
      await updateDoc(templateRef, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingCount: ratings.length
      });
    }

    console.log('Template rated:', templateId, rating);
  } catch (error) {
    console.error('Error rating template:', error);
    throw error;
  }
};

// Social Features

export interface SavedTemplate {
  id?: string;
  userId: string;
  templateId: string;
  savedAt: any;
}

export interface TemplateCollection {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  templateIds: string[];
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}

export const saveTemplate = async (userId: string, templateId: string): Promise<void> => {
  try {
    const savedRef = collection(db, 'savedTemplates');
    const existingQuery = query(
      savedRef,
      where('userId', '==', userId),
      where('templateId', '==', templateId)
    );
    
    const existingSnap = await getDocs(existingQuery);
    
    if (existingSnap.empty) {
      await addDoc(savedRef, {
        userId,
        templateId,
        savedAt: serverTimestamp()
      });
      console.log('Template saved:', templateId);
    }
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
};

export const unsaveTemplate = async (userId: string, templateId: string): Promise<void> => {
  try {
    const savedRef = collection(db, 'savedTemplates');
    const unsaveQuery = query(
      savedRef,
      where('userId', '==', userId),
      where('templateId', '==', templateId)
    );
    
    const snapshot = await getDocs(unsaveQuery);
    if (!snapshot.empty) {
      await deleteDoc(doc(db, 'savedTemplates', snapshot.docs[0].id));
      console.log('Template unsaved:', templateId);
    }
  } catch (error) {
    console.error('Error unsaving template:', error);
    throw error;
  }
};

export const getSavedTemplates = async (userId: string): Promise<SavedTemplate[]> => {
  try {
    const savedRef = collection(db, 'savedTemplates');
    const q = query(
      savedRef,
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedTemplate));
  } catch (error) {
    console.error('Error getting saved templates:', error);
    throw error;
  }
};

export const createCollection = async (userId: string, name: string, description?: string, isPublic: boolean = false): Promise<string> => {
  try {
    const collectionsRef = collection(db, 'templateCollections');
    const docRef = await addDoc(collectionsRef, {
      userId,
      name,
      description,
      templateIds: [],
      isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Collection created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

export const addTemplateToCollection = async (collectionId: string, templateId: string): Promise<void> => {
  try {
    const collectionRef = doc(db, 'templateCollections', collectionId);
    await updateDoc(collectionRef, {
      templateIds: arrayUnion(templateId),
      updatedAt: serverTimestamp()
    });
    console.log('Template added to collection:', templateId);
  } catch (error) {
    console.error('Error adding template to collection:', error);
    throw error;
  }
};

export const removeTemplateFromCollection = async (collectionId: string, templateId: string): Promise<void> => {
  try {
    const collectionRef = doc(db, 'templateCollections', collectionId);
    await updateDoc(collectionRef, {
      templateIds: arrayRemove(templateId),
      updatedAt: serverTimestamp()
    });
    console.log('Template removed from collection:', templateId);
  } catch (error) {
    console.error('Error removing template from collection:', error);
    throw error;
  }
};

export const getUserCollections = async (userId: string): Promise<TemplateCollection[]> => {
  try {
    const collectionsRef = collection(db, 'templateCollections');
    const q = query(
      collectionsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TemplateCollection));
  } catch (error) {
    console.error('Error getting user collections:', error);
    throw error;
  }
};

export const getPublicCollections = async (): Promise<TemplateCollection[]> => {
  try {
    const collectionsRef = collection(db, 'templateCollections');
    const q = query(
      collectionsRef,
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TemplateCollection));
  } catch (error) {
    console.error('Error getting public collections:', error);
    throw error;
  }
}; 