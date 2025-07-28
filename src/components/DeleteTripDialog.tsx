'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, Users, User, Shield } from 'lucide-react';
import { deleteTrip, removeTripAccess, Trip } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface DeleteTripDialogProps {
  trip: Trip;
  children: React.ReactNode;
  onTripDeleted?: () => void;
}

export function DeleteTripDialog({ trip, children, onTripDeleted }: DeleteTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Check if this is an onboarding trip (sample trips created for new users)
  const isOnboardingTrip = ['Asia Trip 2025', 'European Adventure', 'South America Discovery'].includes(trip.title);
  
  const isOwner = trip.ownerId === user?.uid;
  const isEditor = trip.editors?.includes(user?.uid || '');
  const isViewer = trip.viewers?.includes(user?.uid || '');
  
  // Allow deletion if user is owner OR if it's an onboarding trip
  const canDelete = isOwner || isOnboardingTrip;
  
  console.log('DeleteTripDialog - trip:', trip.title, 'ownerId:', trip.ownerId, 'user.uid:', user?.uid, 'isOnboardingTrip:', isOnboardingTrip, 'canDelete:', canDelete);

  const getActionText = () => {
    if (isOwner || isOnboardingTrip) {
      return 'Delete Trip';
    } else if (isEditor || isViewer) {
      return 'Leave Trip';
    }
    return 'Remove Trip';
  };

  const getDescription = () => {
    if (isOwner || isOnboardingTrip) {
      const onboardingMessage = isOnboardingTrip ? ' This is a sample trip created to help you get started.' : '';
      return `Are you sure you want to delete "${trip.title}"? This action cannot be undone and will permanently remove the trip for all collaborators.${onboardingMessage}`;
    } else if (isEditor || isViewer) {
      return `Are you sure you want to leave "${trip.title}"? You will no longer have access to this trip, but it will remain available to other collaborators.`;
    }
    return `Are you sure you want to remove "${trip.title}" from your account?`;
  };

  const getConfirmationText = () => {
    if (isOwner || isOnboardingTrip) {
      return 'DELETE TRIP';
    } else if (isEditor || isViewer) {
      return 'LEAVE TRIP';
    }
    return 'REMOVE TRIP';
  };

  const handleDelete = async () => {
    if (!user?.uid) return;

    // Validate confirmation text
    if (confirmationText !== getConfirmationText()) {
      toast({
        title: "Confirmation Required",
        description: `Please type "${getConfirmationText()}" to confirm.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isOwner || isOnboardingTrip) {
        // Owner or onboarding trip: Delete the entire trip
        await deleteTrip(trip.id!);
        toast({
          title: "Trip Deleted",
          description: `"${trip.title}" has been permanently deleted.`,
        });
        router.push('/'); // Redirect to trips page
      } else if (isEditor || isViewer) {
        // Editor/Viewer: Remove access to the trip
        const permission = isEditor ? 'edit' : 'view';
        const result = await removeTripAccess(trip.id!, user.uid, permission);
        
        if (result.success) {
          toast({
            title: "Left Trip",
            description: `You have left "${trip.title}".`,
          });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
          return;
        }
      }

      setIsOpen(false);
      setConfirmationText(''); // Reset confirmation text
      onTripDeleted?.();
    } catch (error) {
      console.error('Error deleting/leaving trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete/leave trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('DeleteTripDialog onOpenChange:', open);
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {getActionText()}
          </DialogTitle>
          <DialogDescription className="text-left">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Trip Info Card */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">{trip.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {trip.startDate} - {trip.endDate}
                </p>
              </div>
              
              {/* Permission Badge */}
              <div className="flex items-center gap-2">
                {isOnboardingTrip ? (
                  <Badge variant="default" className="bg-orange-600">
                    <User className="h-3 w-3 mr-1" />
                    Sample Trip
                  </Badge>
                ) : isOwner ? (
                  <Badge variant="default" className="bg-blue-600">
                    <User className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                ) : isEditor ? (
                  <Badge variant="default">
                    <Users className="h-3 w-3 mr-1" />
                    Editor
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    Viewer
                  </Badge>
                )}
              </div>

              {/* Warning for Owner or Onboarding Trip */}
              {(isOwner || isOnboardingTrip) && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <strong>Warning:</strong> This will permanently delete the trip{isOnboardingTrip ? ' (sample trip)' : ''} for all {trip.editors?.length || 0 + trip.viewers?.length || 0} collaborators.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="font-mono text-destructive">{getConfirmationText()}</span> to confirm:
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
              placeholder={getConfirmationText()}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              id="confirmation-input"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || confirmationText !== getConfirmationText()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isOwner ? "Deleting..." : "Leaving..."}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {getActionText()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 