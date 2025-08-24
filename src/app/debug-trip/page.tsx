'use client';

import { useState } from 'react';
import { getTrip } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';

export default function DebugTripPage() {
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkTripData = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const tripId = '5mf6INxOw1mMP5IrLv1T';
      console.log('🔍 Checking trip data for:', tripId);
      
      const trip = await getTrip(tripId);
      console.log('📊 Retrieved trip data:', trip);
      
      if (trip) {
        const analysis = {
          id: trip.id,
          title: trip.title,
          ownerId: trip.ownerId,
          editors: {
            value: trip.editors,
            type: typeof trip.editors,
            isArray: Array.isArray(trip.editors),
            length: trip.editors?.length || 0
          },
          viewers: {
            value: trip.viewers,
            type: typeof trip.viewers,
            isArray: Array.isArray(trip.viewers),
            length: trip.viewers?.length || 0
          },
          locations: {
            value: trip.locations,
            type: typeof trip.locations,
            isArray: Array.isArray(trip.locations),
            length: trip.locations?.length || 0
          },
          tripDataLocations: {
            exists: !!trip.tripData?.locations,
            length: trip.tripData?.locations?.length || 0
          },
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt,
          missingFields: []
        };

        // Check for missing fields
        if (!Array.isArray(trip.editors)) {
          analysis.missingFields.push('editors array');
        }
        if (!Array.isArray(trip.viewers)) {
          analysis.missingFields.push('viewers array');
        }
        if (!Array.isArray(trip.locations)) {
          analysis.missingFields.push('locations array');
        }

        console.log('🔧 Analysis:', analysis);
        setTripData(analysis);
      } else {
        setTripData({ error: 'Trip not found' });
      }
    } catch (error) {
      console.error('❌ Error checking trip data:', error);
      setTripData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Trip Data</h1>
      
      {!user && (
        <p className="text-red-500 mb-4">Please log in to use this debug tool.</p>
      )}
      
      <button 
        onClick={checkTripData}
        disabled={loading || !user}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {loading ? 'Checking...' : 'Check China 2025 Trip Data'}
      </button>

      {tripData && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Trip Data Analysis</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(tripData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
