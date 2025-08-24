"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserTrips, getTrip } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugUserTripsPage() {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Starting comprehensive trip debug...');
      
      // 1. Get user trips
      const userTrips = await getUserTrips(user.uid);
      
      // 2. Check specific China 2025 trip
      const chinaTrip = await getTrip('5mf6INxOw1mMP5IrLv1T');
      
      // 3. Check user's invitations
      const invitationsRef = await import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
        const { db } = require('@/lib/firebase');
        return getDocs(query(
          collection(db, 'invitations'),
          where('recipientEmail', '==', user.email)
        ));
      });
      
      const invitations = invitationsRef.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const debugInfo = {
        user: {
          uid: user.uid,
          email: user.email,
        },
        userTrips: {
          count: userTrips.length,
          trips: userTrips.map(trip => ({
            id: trip.id,
            title: trip.title,
            ownerId: trip.ownerId,
            editors: trip.editors,
            viewers: trip.viewers,
            isOwner: trip.ownerId === user.uid,
            isEditor: trip.editors?.includes(user.uid),
            isViewer: trip.viewers?.includes(user.uid),
          }))
        },
        chinaTrip: chinaTrip ? {
          id: chinaTrip.id,
          title: chinaTrip.title,
          ownerId: chinaTrip.ownerId,
          editors: chinaTrip.editors,
          viewers: chinaTrip.viewers,
          userIsOwner: chinaTrip.ownerId === user.uid,
          userIsEditor: chinaTrip.editors?.includes(user.uid),
          userIsViewer: chinaTrip.viewers?.includes(user.uid),
          userHasAccess: chinaTrip.ownerId === user.uid || 
                        chinaTrip.editors?.includes(user.uid) || 
                        chinaTrip.viewers?.includes(user.uid)
        } : 'Trip not found',
        invitations: {
          count: invitations.length,
          details: invitations.map(inv => ({
            id: inv.id,
            tripId: inv.tripId,
            status: inv.status,
            permission: inv.permission,
            recipientEmail: inv.recipientEmail
          }))
        }
      };

      setDebugData(debugInfo);
      console.log('🔍 Debug data:', debugInfo);
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugData({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-8">Please log in to debug trips</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Debug User Trips</h1>
      
      <Button 
        onClick={runDebug} 
        disabled={isLoading}
        className="mb-6"
      >
        {isLoading ? 'Running Debug...' : 'Run Trip Debug'}
      </Button>

      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}