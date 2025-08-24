'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Clock, Star, Users, ChevronLeft, CalendarDays, Bookmark, Share2 } from 'lucide-react';
import { getPublishedTemplate, useTemplate, rateTemplate, saveTemplate, unsaveTemplate, getSavedTemplates, type PublishedTrip } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TemplateRating, ReviewList } from '@/components/TemplateRating';
import { AuthorProfile } from '@/components/AuthorProfile';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [template, setTemplate] = useState<PublishedTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<string[]>([]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  useEffect(() => {
    if (user) {
      loadSavedTemplates();
    }
  }, [user]);

  const loadSavedTemplates = async () => {
    try {
      const saved = await getSavedTemplates(user!.uid);
      const savedIds = saved.map(s => s.templateId);
      setSavedTemplates(savedIds);
      setIsSaved(savedIds.includes(templateId));
    } catch (error) {
      console.error('Error loading saved templates:', error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save templates.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isSaved) {
        await unsaveTemplate(user.uid, templateId);
        setIsSaved(false);
        toast({
          title: "Success",
          description: "Template removed from saved.",
        });
      } else {
        await saveTemplate(user.uid, templateId);
        setIsSaved(true);
        toast({
          title: "Success",
          description: "Template saved to your collection.",
        });
      }
      loadSavedTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareTemplate = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Success",
      description: "Template link copied to clipboard!",
    });
  };

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplate = await getPublishedTemplate(templateId);
      if (fetchedTemplate) {
        setTemplate(fetchedTemplate);
      } else {
        toast({
          title: "Error",
          description: "Template not found.",
          variant: "destructive",
        });
        router.push('/templates');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "Failed to load template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to use a template.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a start date for your trip.",
        variant: "destructive",
      });
      return;
    }

    if (!template) return;

    setIsUsingTemplate(true);
    try {
      const newTripId = await useTemplate(template, user, selectedDate);
      toast({
        title: "Success",
        description: "Trip created from template!",
      });
      router.push(`/trips/${newTripId}`);
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: "Error",
        description: "Failed to create trip from template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUsingTemplate(false);
    }
  };

  const handleRateTemplate = async (rating: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to rate a template.",
        variant: "destructive",
      });
      return;
    }

    if (!template) return;

    try {
      await rateTemplate(template.id!, user, rating, userReview);
      setUserRating(rating);
      toast({
        title: "Success",
        description: "Thank you for your rating!",
      });
      // Reload template to get updated rating
      loadTemplate();
    } catch (error) {
      console.error('Error rating template:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDurationLabel = (days: number) => {
    if (days <= 3) return `${days} day${days === 1 ? '' : 's'}`;
    if (days <= 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) return `${weeks} week${weeks === 1 ? '' : 's'}`;
    return `${weeks} week${weeks === 1 ? '' : 's'} ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading template...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Template Not Found</h1>
            <p className="text-foreground/60 mb-6">The template you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/templates">
                Browse Other Templates
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-6">
            <Link href="/templates">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{template.title}</h1>
              <p className="text-foreground/60 text-lg mb-4">{template.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-foreground/60 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getDurationLabel(template.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{template.locationCount} location{template.locationCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{template.rating.toFixed(1)}</span>
                  <span>({template.ratingCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{template.usageCount} used</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{template.category}</Badge>
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-sm text-foreground/60 mb-4">
                by {template.authorName}
              </div>

              {/* Social Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-2"
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareTemplate}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Use Template Section */}
            <div className="lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle>Use This Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleUseTemplate}
                    disabled={isUsingTemplate || !selectedDate}
                  >
                    {isUsingTemplate ? "Creating Trip..." : "Create Trip from Template"}
                  </Button>

                  <p className="text-xs text-foreground/60">
                    This will create a new trip in your account with the selected start date.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Template Timeline */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Trip Timeline</h2>
          <div className="space-y-4">
            {template.templateData.locations.map((location, index) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Day {location.relativeDays + 1}
                      </span>
                      {location.name}
                    </CardTitle>
                    <Badge variant="outline">
                      {location.duration} day{location.duration !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {location.suggestedActivities.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Suggested Activities:</h4>
                      <ul className="space-y-1">
                        {location.suggestedActivities.map((activity, activityIndex) => (
                          <li key={activityIndex} className="text-sm text-foreground/70 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/60">No activities suggested for this location.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Author Profile */}
        <div className="mb-8">
          <AuthorProfile 
            authorId={template.authorId} 
            authorName={template.authorName}
            showTemplates={false}
          />
        </div>

        {/* Rating & Reviews Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Reviews & Ratings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TemplateRating
                templateId={templateId}
                currentRating={template.rating}
                ratingCount={template.ratingCount}
                onRatingUpdate={loadTemplate}
              />
            </div>
            <div className="lg:col-span-2">
              <ReviewList
                templateId={templateId}
                reviews={[]} // TODO: Load reviews from firestore
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 