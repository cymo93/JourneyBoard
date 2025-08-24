'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrip } from '@/lib/firestore';
import Link from 'next/link';

export default function DebugLocationRoutingPage() {
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const loadTripData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Loading China 2025 trip data...');
      const trip = await getTrip('5mf6INxOw1mMP5IrLv1T');
      
      if (trip) {
        console.log('✅ Trip loaded:', trip);
        console.log('🗺️ Locations:', trip.tripData?.locations);
        
        setTripData({
          id: trip.id,
          title: trip.title,
          locations: trip.tripData?.locations || [],
          locationCount: trip.tripData?.locations?.length || 0
        });
      } else {
        console.log('❌ Trip not found');
        setTripData({ error: 'Trip not found' });
      }
    } catch (error) {
      console.error('❌ Error loading trip:', error);
      setTripData({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Location Routing Debug</h1>
        <p>Please log in to debug location routing.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Location Routing Debug</h1>
      
      <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
        <h3 className="font-semibold text-red-800">Location Page 404 Issue</h3>
        <p className="text-red-700 mt-2">
          This tool checks if location pages are accessible and what might be causing 404 errors.
        </p>
      </div>

      <Button 
        onClick={loadTripData} 
        disabled={isLoading}
        className="mb-6"
      >
        {isLoading ? 'Loading Trip Data...' : 'Load China 2025 Locations'}
      </Button>

      {tripData && (
        <Card>
          <CardHeader>
            <CardTitle>Trip & Location Data</CardTitle>
          </CardHeader>
          <CardContent>
            {tripData.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {tripData.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <strong>Trip ID:</strong> {tripData.id}
                </div>
                <div>
                  <strong>Trip Title:</strong> {tripData.title}
                </div>
                <div>
                  <strong>Location Count:</strong> {tripData.locationCount}
                </div>
                
                {tripData.locations.length > 0 ? (
                  <div>
                    <strong>Locations:</strong>
                    <div className="mt-2 space-y-2">
                      {tripData.locations.map((location: any, index: number) => (
                        <div key={location.id || index} className="border p-3 rounded">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>Name:</strong> {location.name}
                            </div>
                            <div>
                              <strong>ID:</strong> {location.id}
                            </div>
                            <div>
                              <strong>Date Blocks:</strong> {location.dateBlocks?.length || 0}
                            </div>
                            <div>
                              <strong>URL:</strong> 
                              <Link 
                                href={`/trips/5mf6INxOw1mMP5IrLv1T/locations/${location.id}`}
                                className="text-blue-600 hover:underline ml-2"
                                target="_blank"
                              >
                                /trips/5mf6INxOw1mMP5IrLv1T/locations/{location.id}
                              </Link>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Button size="sm" asChild>
                              <Link href={`/trips/5mf6INxOw1mMP5IrLv1T/locations/${location.id}`}>
                                Test Location Page
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-yellow-600">
                    <strong>No locations found in trip data</strong>
                  </div>
                )}
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">Raw Trip Data</summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto">
                    {JSON.stringify(tripData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
