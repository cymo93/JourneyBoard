'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock, Star, Users, Filter } from 'lucide-react';
import { getPublishedTemplates, type PublishedTrip, type TripCategory } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

const TRIP_CATEGORIES: TripCategory[] = [
  'Weekend', 'Week-long', 'Extended', 'Budget', 'Luxury', 
  'Adventure', 'Culture', 'Food', 'Nature', 'Family', 'Romantic', 'Business'
];

const DURATION_FILTERS = [
  { value: '', label: 'All Durations' },
  { value: 'Weekend', label: 'Weekend (1-3 days)' },
  { value: 'Week-long', label: 'Week-long (4-10 days)' },
  { value: 'Extended', label: 'Extended (11+ days)' }
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'usageCount', label: 'Most Used' },
  { value: 'publishedAt', label: 'Newest' }
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PublishedTrip[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PublishedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TripCategory | ''>('');
  const [durationFilter, setDurationFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, durationFilter, sortBy]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplates = await getPublishedTemplates({
        sortBy: sortBy as 'rating' | 'usageCount' | 'publishedAt'
      });
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.templateData.locations.some(loc => loc.name.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Duration filter
    if (durationFilter) {
      let minDays = 1, maxDays = 3;
      if (durationFilter === 'Week-long') {
        minDays = 4;
        maxDays = 10;
      } else if (durationFilter === 'Extended') {
        minDays = 11;
        maxDays = 365;
      }
      filtered = filtered.filter(template => 
        template.duration >= minDays && template.duration <= maxDays
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'usageCount':
          return b.usageCount - a.usageCount;
        case 'publishedAt':
          return new Date(b.publishedAt?.toDate?.() || b.publishedAt).getTime() - 
                 new Date(a.publishedAt?.toDate?.() || a.publishedAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
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
              <p className="text-gray-600">Loading templates...</p>
            </div>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Discover Trip Templates</h1>
              <p className="text-foreground/60 mt-2">
                Get inspired by trips created by the JourneyBoard community
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">
                Back to My Trips
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={(value: TripCategory | '') => setCategoryFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {TRIP_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Durations" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-foreground/60">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find more templates.
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setCategoryFilter('');
              setDurationFilter('');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {template.title}
                      </CardTitle>
                      <p className="text-sm text-foreground/60 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{getDurationLabel(template.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{template.locationCount} location{template.locationCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Rating and Usage */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{template.rating.toFixed(1)}</span>
                        <span className="text-foreground/60">({template.ratingCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-foreground/60">
                        <Users className="h-4 w-4" />
                        <span>{template.usageCount} used</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
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
                          +{template.tags.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {/* Author */}
                    <div className="text-sm text-foreground/60">
                      by {template.authorName}
                    </div>

                    {/* Use Template Button */}
                    <Button className="w-full" asChild>
                      <Link href={`/templates/${template.id}`}>
                        Use This Template
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