'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc, arrayUnion, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserTrips } from '@/lib/firestore';

export default function FixInvitationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fixInvitation = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const userId = user.uid;
      const tripId = '5mf6INxOw1mMP5IrLv1T'; // China 2025 trip
      
      console.log('🔧 Fixing invitation for:', { userId, tripId });
      
      // 1. Check current trip state
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDoc(tripRef);
      
      if (!tripSnap.exists()) {
        setResult({ error: 'Trip not found' });
        return;
      }
      
      const tripData = tripSnap.data();
      console.log('📊 Current trip data:', {
        ownerId: tripData.ownerId,
        editors: tripData.editors,
        viewers: tripData.viewers
      });
      
      // 2. Check if user is already in editors array
      if (tripData.editors?.includes(userId)) {
        setResult({ 
          success: true, 
          message: 'User is already in editors array',
          tripData: {
            editors: tripData.editors,
            viewers: tripData.viewers
          }
        });
        return;
      }
      
      // 3. Add user to editors array with detailed logging
      console.log('➕ About to add user to editors array...');
      console.log('🔍 User ID to add:', userId);
      console.log('🔍 Current editors before update:', tripData.editors);
      
      // Try direct array replacement instead of arrayUnion
      const currentEditors = Array.isArray(tripData.editors) ? tripData.editors : [];
      const newEditors = currentEditors.includes(userId) ? currentEditors : [...currentEditors, userId];
      
      console.log('🔄 Using direct array replacement:', newEditors);
      
      try {
        console.log('🚀 Attempting updateDoc...');
        const updateResult = await updateDoc(tripRef, {
          editors: newEditors
        });
        console.log('📝 UpdateDoc result:', updateResult);
        console.log('✅ Update command completed successfully');
      } catch (updateError) {
        console.error('❌ UpdateDoc failed, trying transaction approach...', updateError);
        
        // Try transaction approach as fallback
        try {
          console.log('🔄 Attempting transaction-based update...');
          await runTransaction(db, async (transaction) => {
            const tripDoc = await transaction.get(tripRef);
            if (!tripDoc.exists()) {
              throw new Error('Trip document not found in transaction');
            }
            
            const data = tripDoc.data();
            const currentEditors = Array.isArray(data.editors) ? data.editors : [];
            const updatedEditors = currentEditors.includes(userId) ? currentEditors : [...currentEditors, userId];
            
            console.log('🔄 Transaction updating editors from', currentEditors, 'to', updatedEditors);
            transaction.update(tripRef, { editors: updatedEditors });
          });
          console.log('✅ Transaction completed successfully');
        } catch (transactionError) {
          console.error('❌ Transaction also failed:', transactionError);
          throw new Error(`Both updateDoc and transaction failed. UpdateDoc: ${updateError.message}, Transaction: ${transactionError.message}`);
        }
      }
      
      // 4. Wait a moment for Firestore to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Verify the fix worked
      console.log('🔍 Fetching updated trip data...');
      const updatedTripSnap = await getDoc(tripRef);
      const updatedTripData = updatedTripSnap.data();
      
      console.log('✅ Updated trip data:', {
        editors: updatedTripData.editors,
        viewers: updatedTripData.viewers,
        wasUserAdded: updatedTripData.editors?.includes(userId)
      });
      
      // 6. Test getUserTrips query to see if trip appears
      console.log('🔍 Testing getUserTrips query...');
      const userTrips = await getUserTrips(userId);
      const foundTrip = userTrips.find(t => t.id === tripId);
      
      setResult({
        success: updatedTripData.editors?.includes(userId) || false,
        message: updatedTripData.editors?.includes(userId) 
          ? 'Successfully added user to trip editors!' 
          : 'Update command succeeded but user not found in editors array',
        diagnostics: {
          userId,
          userEmail: user.email,
          tripId,
          before: {
            editors: tripData.editors || [],
            viewers: tripData.viewers || []
          },
          after: {
            editors: updatedTripData.editors || [],
            viewers: updatedTripData.viewers || []
          },
          userTripsQuery: {
            totalTrips: userTrips.length,
            foundTargetTrip: !!foundTrip,
            targetTripDetails: foundTrip ? {
              id: foundTrip.id,
              title: foundTrip.title,
              userIsEditor: foundTrip.editors?.includes(userId)
            } : null
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Fix failed:', error);
      setResult({ 
        success: false, 
        error: error.message,
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Fix China 2025 Invitation</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <h3 className="font-semibold text-yellow-800">Issue Detected:</h3>
        <p className="text-yellow-700">
          Your invitation to "China 2025" was marked as accepted, but you weren't actually added 
          to the trip's editors list. This tool will fix that.
        </p>
      </div>
      
      {!user && (
        <p className="text-red-500 mb-4">Please log in as hello@maryamsheikh.com to use this fix.</p>
      )}
      
      <button 
        onClick={fixInvitation}
        disabled={loading || !user}
        className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-300 mb-6"
      >
        {loading ? 'Fixing...' : 'Fix My Access to China 2025'}
      </button>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Fix Results</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">✅ Success!</p>
              <p className="text-green-700">
                You should now see "China 2025" in your trips list. 
                <a href="/" className="underline ml-2">Go to Home Page</a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
