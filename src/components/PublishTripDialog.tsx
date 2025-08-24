'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { publishTrip, type Trip, type TripCategory } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';

interface PublishTripDialogProps {
  trip: Trip;
  children: React.ReactNode;
}

const TRIP_CATEGORIES: TripCategory[] = [
  'Weekend', 'Week-long', 'Extended', 'Budget', 'Luxury', 
  'Adventure', 'Culture', 'Food', 'Nature', 'Family', 'Romantic', 'Business'
];

export function PublishTripDialog({ trip, children }: PublishTripDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(trip.title);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TripCategory>('Adventure');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to publish a trip.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your template.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for your template.",
        variant: "destructive",
      });
      return;
    }

    if (trip.tripData.locations.length < 2) {
      toast({
        title: "Error",
        description: "Your trip must have at least 2 locations to be published.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await publishTrip(trip, user, {
        title: title.trim(),
        description: description.trim(),
        category,
        tags
      });

      toast({
        title: "Success",
        description: "Your trip has been published as a template!",
      });

      setIsOpen(false);
      setTitle(trip.title);
      setDescription('');
      setCategory('Adventure');
      setTags([]);
    } catch (error) {
      console.error('Error publishing trip:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish trip. Please try again.",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish Trip as Template
          </DialogTitle>
          <DialogDescription>
            Share your trip with the community so others can use it as a starting point for their own adventures.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Template Title</Label>
            <Input
              id="title"
              placeholder="Enter a catchy title for your template"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your trip - what makes it special? What type of traveler would enjoy it?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: TripCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIP_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add tags like 'budget-friendly', 'family-friendly', etc."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                disabled={tags.length >= 5}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.length >= 5}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {tags.length}/5 tags
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <h4 className="font-medium mb-2">What will be shared:</h4>
            <ul className="text-sm space-y-1">
              <li>• Trip structure and locations</li>
              <li>• Duration at each location</li>
              <li>• Activity suggestions</li>
              <li>• Your name as the creator</li>
            </ul>
            <h4 className="font-medium mb-2 mt-3">What won't be shared:</h4>
            <ul className="text-sm space-y-1">
              <li>• Personal dates and timing</li>
              <li>• Personal notes or comments</li>
              <li>• Private trip details</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isLoading || !title.trim() || !description.trim()}>
            {isLoading ? "Publishing..." : "Publish Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 