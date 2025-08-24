'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin, Calendar, Bookmark, Search, Filter, Trash2 } from 'lucide-react';
import { getSavedTemplates, getPublishedTemplate, unsaveTemplate, type SavedTemplate, type PublishedTrip } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TripImage } from '@/components/TripImage';

export default function SavedTemplatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templates, setTemplates] = useState<PublishedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'savedAt' | 'rating' | 'usageCount'>('savedAt');

  useEffect(() => {
    if (user) {
      loadSavedTemplates();
    }
  }, [user]);

  const loadSavedTemplates = async () => {
    try {
      setIsLoading(true);
      const saved = await getSavedTemplates(user!.uid);
      setSavedTemplates(saved);

      // Load full template data for each saved template
      const templatePromises = saved.map(savedTemplate => 
        getPublishedTemplate(savedTemplate.templateId)
      );
      const templateResults = await Promise.all(templatePromises);
      const validTemplates = templateResults.filter(t => t !== null) as PublishedTrip[];
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Error loading saved templates:', error);
      toast({
        title: "Error",
        description: "Failed to load saved templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsaveTemplate = async (templateId: string) => {
    try {
      await unsaveTemplate(user!.uid, templateId);
      setSavedTemplates(prev => prev.filter(s => s.templateId !== templateId));
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: "Success",
        description: "Template removed from saved.",
      });
    } catch (error) {
      console.error('Error unsaving template:', error);
      toast({
        title: "Error",
        description: "Failed to remove template from saved.",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedTemplates = templates
    .filter(template => 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'usageCount':
          return b.usageCount - a.usageCount;
        case 'savedAt':
        default:
          const savedA = savedTemplates.find(s => s.templateId === a.id);
          const savedB = savedTemplates.find(s => s.templateId === b.id);
          if (!savedA || !savedB) return 0;
          return new Date(savedB.savedAt?.toDate?.() || savedB.savedAt).getTime() - 
                 new Date(savedA.savedAt?.toDate?.() || savedA.savedAt).getTime();
      }
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h1>
            <p className="text-foreground/60 mb-6">You need to be signed in to view your saved templates.</p>
            <Button asChild>
              <Link href="/">
                Go to Homepage
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
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Saved Templates</h1>
          </div>
          <p className="text-foreground/60">
            Your collection of favorite trip templates
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <Input
              placeholder="Search saved templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savedAt">Recently Saved</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="usageCount">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="pt-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No templates found' : 'No saved templates yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start exploring templates and save your favorites!'
              }
            </p>
            <Button asChild>
              <Link href="/templates">
                Browse Templates
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                <div className="relative">
                  <TripImage
                    src=""
                    alt={template.title}
                    title={template.title}
                    locations={template.templateData.locations.map(l => l.name)}
                    className="h-48 w-full object-cover rounded-t-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleUnsaveTemplate(template.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1 flex-1">
                      {template.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-foreground/60 line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-foreground/60 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{template.duration} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{template.locationCount} locations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{template.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/60">
                      by {template.authorName}
                    </span>
                    <Button size="sm" asChild>
                      <Link href={`/templates/${template.id}`}>
                        View Template
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 