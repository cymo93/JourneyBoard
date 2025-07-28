'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share2, Mail, Users } from 'lucide-react';
import { shareTrip } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

interface ShareTripDialogProps {
  tripId: string;
  tripTitle: string;
  children: React.ReactNode;
}

export function ShareTripDialog({ tripId, tripTitle, children }: ShareTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'edit' | 'view'>('edit');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await shareTrip(tripId, email.trim(), permission);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setEmail('');
        setIsOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sharing trip:', error);
      toast({
        title: "Error",
        description: "Failed to share trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Trip
          </DialogTitle>
          <DialogDescription>
            Share "{tripTitle}" with another JourneyBoard user by email address.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleShare();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="permission" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permission Level
            </Label>
            <Select value={permission} onValueChange={(value: 'edit' | 'view') => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Editor</span>
                    <span className="text-sm text-muted-foreground">Can view and edit</span>
                  </div>
                </SelectItem>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Viewer</span>
                    <span className="text-sm text-muted-foreground">Can view only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isLoading || !email.trim()}>
            {isLoading ? "Sharing..." : "Share Trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 