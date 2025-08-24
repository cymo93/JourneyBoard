'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { shareTrip, getPendingInvitations, acceptInvitation } from '@/lib/firestore';

export default function DebugPage() {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<any>({});
  const [email, setEmail] = useState('hello@maryamsheikh.com');
  const [tripId, setTripId] = useState('');
  const [loading, setLoading] = useState(false);

  const debugInvitations = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      console.log('🔍 Debugging invitations for:', email);
      
      // Get all invitations for this email
      const invitationsRef = collection(db, 'invitations');
      const q = query(invitationsRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      const allInvitations = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        allInvitations.push({
          id: docSnap.id,
          ...data,
          invitedAt: data.invitedAt?.toDate?.()?.toString() || 'No date'
        });
      }
      
      // Get pending invitations using the function
      const pendingInvitations = await getPendingInvitations(email, user);
      
      setDebugData({
        email,
        allInvitations,
        pendingInvitations,
        timestamp: new Date().toISOString()
      });
      
      console.log('📊 Debug Results:', {
        allInvitations,
        pendingInvitations
      });
      
    } catch (error) {
      console.error('❌ Debug error:', error);
      setDebugData({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const debugTrip = async () => {
    if (!tripId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Debugging trip:', tripId);
      
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDoc(tripRef);
      
      if (tripSnap.exists()) {
        const tripData = tripSnap.data();
        setDebugData(prev => ({
          ...prev,
          trip: {
            id: tripId,
            exists: true,
            ownerId: tripData.ownerId,
            editors: tripData.editors || [],
            viewers: tripData.viewers || [],
            title: tripData.title
          }
        }));
      } else {
        setDebugData(prev => ({
          ...prev,
          trip: {
            id: tripId,
            exists: false
          }
        }));
      }
      
    } catch (error) {
      console.error('❌ Trip debug error:', error);
      setDebugData(prev => ({
        ...prev,
        tripError: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const testShare = async () => {
    if (!tripId || !email) return;
    
    setLoading(true);
    try {
      console.log('🧪 Testing share function:', { tripId, email });
      
      const result = await shareTrip(tripId, email, 'edit');
      
      setDebugData(prev => ({
        ...prev,
        shareResult: result,
        shareTimestamp: new Date().toISOString()
      }));
      
      console.log('📤 Share result:', result);
      
    } catch (error) {
      console.error('❌ Share test error:', error);
      setDebugData(prev => ({
        ...prev,
        shareError: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAccept = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      // Get the first pending invitation
      const pendingInvitations = await getPendingInvitations(email);
      if (pendingInvitations.length === 0) {
        setDebugData(prev => ({
          ...prev,
          acceptError: 'No pending invitations found'
        }));
        return;
      }
      
      const invitation = pendingInvitations[0];
      console.log('🧪 Testing accept function:', invitation);
      
      // We need a user ID to accept - this is a limitation of the debug tool
      if (!user?.uid) {
        setDebugData(prev => ({
          ...prev,
          acceptError: 'No authenticated user - cannot test accept function'
        }));
        return;
      }
      
      const result = await acceptInvitation(invitation.id, user.uid);
      
      setDebugData(prev => ({
        ...prev,
        acceptResult: result,
        acceptTimestamp: new Date().toISOString()
      }));
      
      console.log('✅ Accept result:', result);
      
    } catch (error) {
      console.error('❌ Accept test error:', error);
      setDebugData(prev => ({
        ...prev,
        acceptError: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAccepted = async () => {
    try {
      setLoading(true);
      // This will trigger the new logic that automatically marks accepted invitations
      const pendingInvitations = await getPendingInvitations(email, user);
      setDebugData(prev => ({
        ...prev,
        cleanupResult: {
          success: true,
          message: `Processed ${pendingInvitations.length} invitations, auto-marked accepted ones`
        },
        cleanupTimestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error during cleanup:', error);
      setDebugData(prev => ({
        ...prev,
        cleanupResult: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        cleanupTimestamp: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">JourneyBoard Debug Tool</h1>
          <p className="text-muted-foreground mt-2">
            Debug trip sharing issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Debug Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email to Debug</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@maryamsheikh.com"
                />
              </div>
              <div>
                <Label htmlFor="tripId">Trip ID (optional)</Label>
                <Input
                  id="tripId"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  placeholder="Enter trip ID to debug"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={debugInvitations} 
                disabled={loading || !email}
              >
                Debug Invitations
              </Button>
              <Button 
                onClick={debugTrip} 
                disabled={loading || !tripId}
                variant="outline"
              >
                Debug Trip
              </Button>
              <Button 
                onClick={testShare} 
                disabled={loading || !tripId || !email}
                variant="secondary"
              >
                Test Share
              </Button>
              <Button 
                onClick={testAccept} 
                disabled={loading || !email}
                variant="secondary"
              >
                Test Accept
              </Button>
              <Button 
                onClick={handleCleanupAccepted} 
                disabled={loading}
                variant="outline"
              >
                Cleanup Accepted
              </Button>
            </div>
            
            {user && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Current user: {user.email} (ID: {user.uid})</div>
                {user.providerData && user.providerData.length > 0 && (
                  <div>
                    Provider emails: {user.providerData.map((p: any) => `${p.email} (${p.providerId})`).join(', ')}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {Object.keys(debugData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(debugData, null, 2)}
                readOnly
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Invitation Not Found</h3>
              <p className="text-sm text-muted-foreground">
                Check if invitation document exists in Firestore with correct email
              </p>
            </div>
            <div>
              <h3 className="font-semibold">2. Permission Errors</h3>
              <p className="text-sm text-muted-foreground">
                Verify Firestore security rules allow invitation operations
              </p>
            </div>
            <div>
              <h3 className="font-semibold">3. User Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Ensure user is properly authenticated with Firebase Auth
              </p>
            </div>
            <div>
              <h3 className="font-semibold">4. Email Mismatch</h3>
              <p className="text-sm text-muted-foreground">
                Verify the email used for invitation matches user's login email exactly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
