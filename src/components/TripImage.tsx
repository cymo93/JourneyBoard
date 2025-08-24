'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Camera } from 'lucide-react';
import { getDefaultImage } from '@/lib/defaultImages';

interface TripImageProps {
  src: string;
  alt: string;
  title: string;
  locations: string[];
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function TripImage({ 
  src, 
  alt, 
  title, 
  locations, 
  className = '', 
  width = 600, 
  height = 400,
  priority = false 
}: TripImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationImage, setLocationImage] = useState<{url: string, alt: string} | null>(null);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Fetch location image when component mounts (with delay to prevent API spam)
  useEffect(() => {
    const fetchLocationImage = async () => {
      try {
        const response = await fetch(`/api/trip-location-image?locations=${encodeURIComponent(JSON.stringify(locations))}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setLocationImage({
            url: result.data.url,
            alt: result.data.alt
          });
        }
      } catch (error) {
        console.error('Failed to fetch location image:', error);
      }
    };

    // Only fetch if we have locations and no valid src
    if (locations.length > 0 && (!src || src === '' || src.includes('placehold.co') || src.includes('600 × 400'))) {
      // Add random delay to prevent API spam when loading many trip cards
      const delay = Math.random() * 2000; // 0-2 second random delay
      const timeoutId = setTimeout(fetchLocationImage, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [locations, src]);

  // Check if the image URL is a placeholder or invalid
  const isPlaceholder = src.includes('placehold.co') || src.includes('600 × 400') || !src || src === '';
  
  // Get default image if needed
  const defaultImage = getDefaultImage(title, locations);
  
  // Priority: location image > original src > default image
  let imageSrc: string;
  let imageAlt: string;
  
  if (locationImage && (isPlaceholder || !src || src === '')) {
    imageSrc = locationImage.url;
    imageAlt = locationImage.alt;
  } else if (!isPlaceholder && src && src !== '') {
    imageSrc = src;
    imageAlt = alt;
  } else {
    imageSrc = defaultImage.url;
    imageAlt = defaultImage.alt;
  }
  
  const shouldUseDefault = imageError || (isPlaceholder && !locationImage);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading state */}
      {isLoading && !imageError && !isPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center z-10">
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      {/* Error state or placeholder with fallback */}
      {(imageError || (isPlaceholder && !locationImage)) && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-20">
          <div className="text-center p-4">
            <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-600 font-medium">{title}</p>
            <p className="text-xs text-blue-500">{locations.join(', ')}</p>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 w-full h-full object-cover ${(isLoading && !imageError && !isPlaceholder) ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        unoptimized={imageError || isPlaceholder} // Don't optimize fallback images
      />
    </div>
  );
} 