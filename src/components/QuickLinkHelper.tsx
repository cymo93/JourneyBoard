'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, X } from 'lucide-react';
import { createGoogleMapsUrl, createLinkString } from './LinkParser';

interface QuickLinkHelperProps {
  onAddLink: (linkString: string) => void;
  locationName?: string;
  trigger?: React.ReactNode;
}

export function QuickLinkHelper({ onAddLink, locationName, trigger }: QuickLinkHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const handleAddLink = () => {
    if (!placeName.trim()) return;

    let url: string;
    if (useCustomUrl && customUrl.trim()) {
      url = customUrl.trim();
    } else {
      url = createGoogleMapsUrl(placeName, locationName);
    }

    const linkString = createLinkString(placeName, url);
    onAddLink(linkString);
    
    // Reset form
    setPlaceName('');
    setCustomUrl('');
    setUseCustomUrl(false);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            Add Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Add Google Maps Link
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Place Name (what will be displayed)
            </label>
            <Input
              placeholder="e.g., Local Market, Coffee Shop, Museum"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="custom-url"
              checked={useCustomUrl}
              onChange={(e) => setUseCustomUrl(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="custom-url" className="text-sm">
              Use custom URL instead of Google Maps search
            </label>
          </div>

          {useCustomUrl && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Custom URL
              </label>
              <Input
                placeholder="https://maps.google.com/..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          {!useCustomUrl && placeName && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-gray-600">
                Will search for: <span className="font-mono bg-gray-200 px-1 rounded">
                  {placeName}{locationName ? ` ${locationName}` : ''}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddLink} disabled={!placeName.trim()} className="flex-1">
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 