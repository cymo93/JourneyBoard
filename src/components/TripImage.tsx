'use client';

import { useState } from 'react';
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

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Check if the image URL is a placeholder or invalid
  const isPlaceholder = src.includes('placehold.co') || src.includes('600 × 400') || !src || src === '';
  
  // Get default image if needed
  const defaultImage = getDefaultImage(title, locations);
  
  // Use default image if error, placeholder, or empty src, otherwise use original
  const shouldUseDefault = imageError || isPlaceholder || !src || src === '';
  const imageSrc = shouldUseDefault ? defaultImage.url : src;
  const imageAlt = shouldUseDefault ? defaultImage.alt : alt;

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      {isLoading && !imageError && !isPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center z-10">
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      {/* Error state or placeholder with fallback */}
      {(imageError || isPlaceholder) && (
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
        className={`transition-opacity duration-300 ${(isLoading && !imageError && !isPlaceholder) ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={priority}
        unoptimized={imageError || isPlaceholder} // Don't optimize fallback images
      />
    </div>
  );
} 