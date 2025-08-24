'use client';

import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface LinkParserProps {
  text: string;
  className?: string;
}

interface ParsedLink {
  type: 'text' | 'link';
  content: string;
  url?: string;
  isGoogleMaps?: boolean;
}

export function LinkParser({ text, className = '' }: LinkParserProps) {
  const [showLinkHelper, setShowLinkHelper] = useState(false);

  // Parse text for links in format [Text](URL)
  const parseLinks = (input: string): ParsedLink[] => {
    const links: ParsedLink[] = [];
    let currentIndex = 0;
    
    // Regex to match [Text](URL) pattern
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(input)) !== null) {
      // Add text before the link
      if (match.index > currentIndex) {
        links.push({
          type: 'text',
          content: input.slice(currentIndex, match.index)
        });
      }
      
      // Add the link
      const linkText = match[1];
      const url = match[2];
      const isGoogleMaps = url.includes('google.com/maps') || url.includes('maps.google.com');
      
      links.push({
        type: 'link',
        content: linkText,
        url,
        isGoogleMaps
      });
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < input.length) {
      links.push({
        type: 'text',
        content: input.slice(currentIndex)
      });
    }
    
    return links;
  };

  const parsedLinks = parseLinks(text);

  if (parsedLinks.length === 0 || (parsedLinks.length === 1 && parsedLinks[0].type === 'text')) {
    return (
      <div className={className}>
        <span>{text}</span>
        {text.trim() && (
          <button
            onClick={() => setShowLinkHelper(!showLinkHelper)}
            className="ml-2 text-blue-600 hover:text-blue-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add link"
          >
            <MapPin className="h-3 w-3" />
          </button>
        )}
        {showLinkHelper && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
            <p className="font-medium mb-1">💡 Link Tip:</p>
            <p>Use <code className="bg-blue-100 px-1 rounded">[Market Name](https://maps.google.com/...)</code> to create clickable links!</p>
            <p className="mt-1 text-blue-600">Example: <code className="bg-blue-100 px-1 rounded">[Local Market](https://maps.google.com/?q=local+market)</code></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {parsedLinks.map((item, index) => {
        if (item.type === 'text') {
          return <span key={index}>{item.content}</span>;
        } else {
          return (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
              title={item.isGoogleMaps ? `Open in Google Maps: ${item.content}` : `Visit: ${item.content}`}
            >
              <span>{item.content}</span>
              {item.isGoogleMaps ? (
                <MapPin className="h-3 w-3" />
              ) : (
                <ExternalLink className="h-3 w-3" />
              )}
            </a>
          );
        }
      })}
    </div>
  );
}

// Helper function to create Google Maps URLs
export const createGoogleMapsUrl = (query: string, location?: string): string => {
  const searchQuery = location ? `${query} ${location}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
};

// Helper function to create a link string
export const createLinkString = (text: string, url: string): string => {
  return `[${text}](${url})`;
}; 