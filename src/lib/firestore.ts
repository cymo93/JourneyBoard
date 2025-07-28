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
  arrayRemove
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
        activities?: string[];
      }>;
    }>;
  };
  createdAt?: any;
  updatedAt?: any;
}

// Helper function to check if user has access to a trip
export const hasTripAccess = (trip: Trip, userId: string, accessLevel: 'view' | 'edit' | 'owner' = 'view'): boolean => {
  if (accessLevel === 'owner') {
    return trip.ownerId === userId;
  }
  if (accessLevel === 'edit') {
    return trip.ownerId === userId || trip.editors.includes(userId);
  }
  return trip.ownerId === userId || trip.editors.includes(userId) || trip.viewers.includes(userId);
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
      return {
        id: tripSnap.id,
        ...tripSnap.data()
      } as Trip;
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
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      ...tripData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating trip:', error);
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

// Sharing functions
export const shareTrip = async (tripId: string, email: string, permission: 'edit' | 'view'): Promise<{ success: boolean; message: string }> => {
  try {
    // First, we need to find the user by email
    // For now, we'll store the invitation and let the user accept it when they sign up
    const invitationRef = doc(db, 'invitations', `${tripId}_${email}`);
    await setDoc(invitationRef, {
      tripId,
      email,
      permission,
      invitedAt: serverTimestamp(),
      status: 'pending'
    });
    
    return { 
      success: true, 
      message: `Invitation sent to ${email} with ${permission} access` 
    };
  } catch (error) {
    console.error('Error sharing trip:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to share trip' 
    };
  }
};

export const acceptInvitation = async (invitationId: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationSnap = await getDoc(invitationRef);
    
    if (!invitationSnap.exists()) {
      return { success: false, message: 'Invitation not found' };
    }
    
    const invitation = invitationSnap.data();
    const tripRef = doc(db, 'trips', invitation.tripId);
    
    // Add user to the appropriate array
    if (invitation.permission === 'edit') {
      await updateDoc(tripRef, {
        editors: arrayUnion(userId)
      });
    } else {
      await updateDoc(tripRef, {
        viewers: arrayUnion(userId)
      });
    }
    
    // Mark invitation as accepted
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedBy: userId
    });
    
    return { success: true, message: 'Invitation accepted successfully' };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to accept invitation' 
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