// Simple default image system with intelligent theme selection
// This avoids complex async operations that cause TypeScript issues

// Theme categories for intelligent image selection
export const imageThemes = {
  // Regional themes
  asia: {
    keywords: ['asia', 'china', 'japan', 'thailand', 'vietnam', 'singapore', 'korea', 'taiwan'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Asian temple and mountains'
  },
  
  europe: {
    keywords: ['europe', 'paris', 'rome', 'barcelona', 'london', 'amsterdam', 'berlin', 'prague', 'vienna'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'European architecture'
  },
  
  america: {
    keywords: ['america', 'usa', 'canada', 'mexico', 'new york', 'los angeles', 'toronto', 'vancouver'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'American landscape'
  },
  
  africa: {
    keywords: ['africa', 'safari', 'kenya', 'south africa', 'morocco', 'egypt', 'tanzania'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'African safari'
  },
  
  australia: {
    keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Australian beach'
  },
  
  // Landscape themes
  beach: {
    keywords: ['beach', 'ocean', 'coast', 'island', 'tropical', 'paradise'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Beach sunset'
  },
  
  mountains: {
    keywords: ['mountain', 'hiking', 'climbing', 'alpine', 'snow', 'peak'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Mountain landscape'
  },
  
  forest: {
    keywords: ['forest', 'jungle', 'nature', 'woods', 'trees', 'wilderness'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Forest landscape'
  },
  
  desert: {
    keywords: ['desert', 'sahara', 'dunes', 'arid', 'canyon'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Desert landscape'
  },
  
  city: {
    keywords: ['city', 'urban', 'downtown', 'metropolitan', 'skyline'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'City skyline'
  },
  
  // General travel
  general: {
    keywords: ['travel', 'adventure', 'explore', 'journey'],
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    alt: 'Beautiful travel landscape'
  }
};

// Function to determine the best theme based on trip title and locations
export const getThemeForTrip = (tripTitle: string, locations: string[] = []): string => {
  const title = tripTitle.toLowerCase();
  const locationString = locations.join(' ').toLowerCase();
  const combined = `${title} ${locationString}`;
  
  // Check each theme's keywords
  for (const [themeName, theme] of Object.entries(imageThemes)) {
    if (theme.keywords.some(keyword => combined.includes(keyword))) {
      return themeName;
    }
  }
  
  // Default to general if no specific theme matches
  return 'general';
};

// Main function to get default image (synchronous)
export const getDefaultImage = (tripTitle: string, locations: string[] = []): { url: string; alt: string; photographerUrl: string } => {
  try {
    const theme = getThemeForTrip(tripTitle, locations);
    const themeConfig = imageThemes[theme as keyof typeof imageThemes];
    
    return {
      url: themeConfig.url,
      alt: themeConfig.alt,
      photographerUrl: 'https://pexels.com'
    };
  } catch (error) {
    console.error('Error getting default image:', error);
    // Ultimate fallback
    return {
      url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      alt: 'Beautiful travel landscape',
      photographerUrl: 'https://pexels.com'
    };
  }
};

// Function to get a random default image
export const getRandomDefaultImage = (): { url: string; alt: string; photographerUrl: string } => {
  const themes = Object.values(imageThemes);
  const randomIndex = Math.floor(Math.random() * themes.length);
  const theme = themes[randomIndex];
  
  return {
    url: theme.url,
    alt: theme.alt,
    photographerUrl: 'https://pexels.com'
  };
}; 