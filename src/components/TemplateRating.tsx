'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Star, ThumbsUp, MessageCircle, User } from 'lucide-react';
import { rateTemplate, type TemplateRating } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TemplateRatingProps {
  templateId: string;
  currentRating: number;
  ratingCount: number;
  onRatingUpdate: () => void;
}

export function TemplateRating({ templateId, currentRating, ratingCount, onRatingUpdate }: TemplateRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleRateTemplate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to rate a template.",
        variant: "destructive",
      });
      return;
    }

    if (userRating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await rateTemplate(templateId, user, userRating, userReview.trim() || undefined);
      toast({
        title: "Success",
        description: "Thank you for your rating!",
      });
      setShowReviewForm(false);
      setUserReview('');
      onRatingUpdate();
    } catch (error) {
      console.error('Error rating template:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">{currentRating.toFixed(1)}</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= currentRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-sm text-foreground/60">
          {ratingCount} rating{ratingCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Rate This Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rate This Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= userRating ? 'text-yellow-500' : 'text-gray-300'
                  } hover:text-yellow-500`}
                >
                  ★
                </button>
              ))}
              {userRating > 0 && (
                <span className="text-sm text-foreground/60 ml-2">
                  {getRatingText(userRating)}
                </span>
              )}
            </div>
          </div>

          {userRating > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Review (optional)</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? 'Hide' : 'Add Review'}
                </Button>
              </div>
              
              {showReviewForm && (
                <Textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Share your experience with this template..."
                  className="mb-3"
                  rows={3}
                />
              )}
              
              <Button 
                onClick={handleRateTemplate}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Review List Component
interface ReviewListProps {
  templateId: string;
  reviews: TemplateRating[];
}

export function ReviewList({ templateId, reviews }: ReviewListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());

  const handleHelpfulVote = (reviewId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to vote.",
        variant: "destructive",
      });
      return;
    }

    setHelpfulVotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600">Be the first to review this template!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{review.userName}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-foreground/60">
                    {format(new Date(review.createdAt?.toDate?.() || review.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {review.review && (
                  <p className="text-sm text-foreground/80 mb-3">{review.review}</p>
                )}
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpfulVote(review.id!)}
                    className={`gap-1 ${
                      helpfulVotes.has(review.id!) ? 'text-blue-600' : 'text-foreground/60'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpfulCount + (helpfulVotes.has(review.id!) ? 1 : 0)}</span>
                    <span className="text-xs">Helpful</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 