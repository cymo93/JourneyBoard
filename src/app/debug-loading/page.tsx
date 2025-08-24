'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrip, getUserTrips, subscribeToTripUpdates } from '@/lib/firestore';

export default function DebugLoadingPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  const addResult = (step: string, status: 'start' | 'success' | 'error', data?: any, duration?: number) => {
    const timestamp = new Date().toISOString();
    setResults(prev => [...prev, { step, status, data, duration, timestamp }]);
  };

  const runDiagnostics = async () => {
    if (!user) return;
    
    setIsRunning(true);
    setResults([]);
    
    try {
      // Test 1: Basic Auth Check
      addResult('Auth Check', 'start');
      const authStart = performance.now();
      addResult('Auth Check', 'success', { 
        uid: user.uid, 
        email: user.email 
      }, performance.now() - authStart);

      // Test 2: getUserTrips Performance
      addResult('getUserTrips', 'start');
      const userTripsStart = performance.now();
      try {
        const userTrips = await getUserTrips(user.uid);
        addResult('getUserTrips', 'success', { 
          count: userTrips.length,
          trips: userTrips.map(t => ({ id: t.id, title: t.title }))
        }, performance.now() - userTripsStart);
      } catch (error) {
        addResult('getUserTrips', 'error', { error: error.message }, performance.now() - userTripsStart);
      }

      // Test 3: getTrip for China 2025
      addResult('getTrip (China 2025)', 'start');
      const getTripStart = performance.now();
      try {
        const trip = await getTrip('5mf6INxOw1mMP5IrLv1T');
        addResult('getTrip (China 2025)', 'success', { 
          found: !!trip,
          title: trip?.title,
          locationsCount: trip?.tripData?.locations?.length,
          hasEditors: Array.isArray(trip?.editors),
          userIsEditor: trip?.editors?.includes(user.uid)
        }, performance.now() - getTripStart);
      } catch (error) {
        addResult('getTrip (China 2025)', 'error', { error: error.message }, performance.now() - getTripStart);
      }

      // Test 4: Real-time Subscription
      addResult('Real-time Subscription', 'start');
      const realtimeStart = performance.now();
      try {
        const unsubscribe = subscribeToTripUpdates('5mf6INxOw1mMP5IrLv1T', (updatedTrip) => {
          addResult('Real-time Update Received', 'success', { 
            title: updatedTrip.title,
            locationsCount: updatedTrip.tripData?.locations?.length
          }, performance.now() - realtimeStart);
        });
        
        addResult('Real-time Subscription', 'success', { 
          subscribed: true 
        }, performance.now() - realtimeStart);

        // Clean up after 3 seconds
        setTimeout(() => {
          unsubscribe();
          addResult('Real-time Cleanup', 'success', { unsubscribed: true });
        }, 3000);
        
      } catch (error) {
        addResult('Real-time Subscription', 'error', { error: error.message }, performance.now() - realtimeStart);
      }

      // Test 5: Network Performance Check
      addResult('Network Test', 'start');
      const networkStart = performance.now();
      try {
        const response = await fetch('/api/test-env');
        const result = await response.json();
        addResult('Network Test', 'success', { 
          status: response.status,
          data: result
        }, performance.now() - networkStart);
      } catch (error) {
        addResult('Network Test', 'error', { error: error.message }, performance.now() - networkStart);
      }

      // Test 6: Location Page Simulation
      addResult('Location Page Simulation', 'start');
      const locationStart = performance.now();
      try {
        // Simulate what happens when loading a location page
        const trip = await getTrip('5mf6INxOw1mMP5IrLv1T');
        if (trip && trip.tripData?.locations?.length > 0) {
          const firstLocation = trip.tripData.locations[0];
          addResult('Location Page Simulation', 'success', { 
            locationFound: true,
            locationName: firstLocation.name,
            dateBlocksCount: firstLocation.dateBlocks?.length
          }, performance.now() - locationStart);
        } else {
          addResult('Location Page Simulation', 'error', { 
            locationFound: false,
            tripData: !!trip?.tripData
          }, performance.now() - locationStart);
        }
      } catch (error) {
        addResult('Location Page Simulation', 'error', { error: error.message }, performance.now() - locationStart);
      }

    } catch (error) {
      addResult('Overall Error', 'error', { error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading Diagnostics</h1>
        <p>Please log in to run diagnostics.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Loading Performance Diagnostics</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <h3 className="font-semibold text-yellow-800">Diagnostic Framework</h3>
        <p className="text-yellow-700 mt-2">
          This tool measures the performance of each component that could be causing slow loading times.
        </p>
      </div>

      <Button 
        onClick={runDiagnostics} 
        disabled={isRunning}
        className="mb-6"
      >
        {isRunning ? 'Running Diagnostics...' : 'Run Performance Diagnostics'}
      </Button>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded border-l-4 ${
                    result.status === 'start' ? 'border-blue-500 bg-blue-50' :
                    result.status === 'success' ? 'border-green-500 bg-green-50' :
                    'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.step}</span>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className={`text-sm px-2 py-1 rounded ${
                          result.duration < 100 ? 'bg-green-100 text-green-800' :
                          result.duration < 1000 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.duration.toFixed(0)}ms
                        </span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${
                        result.status === 'start' ? 'bg-blue-500' :
                        result.status === 'success' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></span>
                    </div>
                  </div>
                  {result.data && (
                    <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
