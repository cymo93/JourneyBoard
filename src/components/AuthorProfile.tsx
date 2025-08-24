'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Users, Award, MapPin, Calendar } from 'lucide-react';
import { getPublishedTemplates, type PublishedTrip } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';

interface AuthorProfileProps {
  authorId: string;
  authorName: string;
  showTemplates?: boolean;
}

interface AuthorStats {
  totalTemplates: number;
  totalUsage: number;
  averageRating: number;
  totalRatings: number;
}

export function AuthorProfile({ authorId, authorName, showTemplates = true }: AuthorProfileProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PublishedTrip[]>([]);
  const [stats, setStats] = useState<AuthorStats>({
    totalTemplates: 0,
    totalUsage: 0,
    averageRating: 0,
    totalRatings: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthorData();
  }, [authorId]);

  const loadAuthorData = async () => {
    try {
      setIsLoading(true);
      // For now, we'll load all templates and filter by author
      // In a real app, you'd have a dedicated API endpoint for this
      const allTemplates = await getPublishedTemplates();
      const authorTemplates = allTemplates.filter(t => t.authorId === authorId);
      setTemplates(authorTemplates);

      // Calculate stats
      const totalUsage = authorTemplates.reduce((sum, t) => sum + t.usageCount, 0);
      const totalRatings = authorTemplates.reduce((sum, t) => sum + t.ratingCount, 0);
      const averageRating = totalRatings > 0 
        ? authorTemplates.reduce((sum, t) => sum + (t.rating * t.ratingCount), 0) / totalRatings
        : 0;

      setStats({
        totalTemplates: authorTemplates.length,
        totalUsage,
        averageRating,
        totalRatings
      });
    } catch (error) {
      console.error('Error loading author data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthorBadges = () => {
    const badges = [];
    
    if (stats.totalTemplates >= 5) {
      badges.push({ name: 'Template Creator', icon: Award, color: 'bg-blue-100 text-blue-700' });
    }
    if (stats.totalUsage >= 50) {
      badges.push({ name: 'Popular Author', icon: Users, color: 'bg-green-100 text-green-700' });
    }
    if (stats.averageRating >= 4.5 && stats.totalRatings >= 10) {
      badges.push({ name: 'Top Rated', icon: Star, color: 'bg-yellow-100 text-yellow-700' });
    }
    if (stats.totalTemplates >= 10) {
      badges.push({ name: 'Prolific Creator', icon: Award, color: 'bg-purple-100 text-purple-700' });
    }

    return badges;
  };

  const isCurrentUser = user?.uid === authorId;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Author Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">
                {authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{authorName}</div>
              <div className="text-sm text-foreground/60">
                {isCurrentUser ? 'You' : 'Template Creator'}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalTemplates}</div>
              <div className="text-sm text-foreground/60">Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalUsage}</div>
              <div className="text-sm text-foreground/60">Times Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-foreground/60">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalRatings}</div>
              <div className="text-sm text-foreground/60">Reviews</div>
            </div>
          </div>

          {/* Badges */}
          {getAuthorBadges().length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Badges</h4>
              <div className="flex flex-wrap gap-2">
                {getAuthorBadges().map((badge, index) => (
                  <Badge key={index} className={badge.color}>
                    <badge.icon className="h-3 w-3 mr-1" />
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isCurrentUser && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Follow
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Message
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Author's Templates */}
      {showTemplates && templates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {isCurrentUser ? 'Your Templates' : `${authorName}'s Templates`}
            </h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/users/${authorId}/templates`}>
                View All
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.slice(0, 4).map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium line-clamp-1">{template.title}</h4>
                    <p className="text-sm text-foreground/60 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-foreground/60">
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
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/templates/${template.id}`}>
                        View Template
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 