'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Check, X } from 'lucide-react';
import { getPendingInvitations, acceptInvitation } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<Array<{
    id: string;
    tripId: string;
    permission: 'edit' | 'view';
    invitedAt: any;
    tripTitle?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.email) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const pendingInvitations = await getPendingInvitations(user.email);
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user?.uid) return;
    
    try {
      setAccepting(invitationId);
      const result = await acceptInvitation(invitationId, user.uid);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Invitation accepted! You can now access the trip.",
        });
        // Remove the accepted invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    // For now, just remove from the list
    // TODO: Implement decline functionality in Firestore
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    toast({
      title: "Invitation declined",
      description: "The invitation has been removed.",
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Loading Invitations...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Checking for pending invitations...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no invitations
  }

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Trip Invitations
        </CardTitle>
        <CardDescription>
          You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{invitation.tripTitle}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={invitation.permission === 'edit' ? 'default' : 'secondary'}>
                    <Users className="h-3 w-3 mr-1" />
                    {invitation.permission === 'edit' ? 'Editor' : 'Viewer'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Invited {invitation.invitedAt?.toDate?.() ? 
                    invitation.invitedAt.toDate().toLocaleDateString() : 
                    'recently'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAcceptInvitation(invitation.id)}
                disabled={accepting === invitation.id}
                className="flex-1"
              >
                {accepting === invitation.id ? (
                  "Accepting..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeclineInvitation(invitation.id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 