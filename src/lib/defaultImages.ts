// Beautiful default travel images from Pexels
// These are high-quality, free-to-use images that represent different travel themes

export const defaultImages = {
  // General travel themes
  general: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'travel landscape mountains',
    alt: 'Beautiful mountain landscape'
  },
  
  // Regional themes
  asia: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'asia temple mountains',
    alt: 'Asian temple and mountains'
  },
  
  europe: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'europe architecture city',
    alt: 'European architecture'
  },
  
  america: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'america landscape nature',
    alt: 'American landscape'
  },
  
  africa: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'africa safari wildlife',
    alt: 'African safari'
  },
  
  australia: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'australia beach ocean',
    alt: 'Australian beach'
  },
  
  // City themes
  city: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'city skyline urban',
    alt: 'City skyline'
  },
  
  beach: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'beach ocean sunset',
    alt: 'Beach sunset'
  },
  
  mountains: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'mountains landscape nature',
    alt: 'Mountain landscape'
  },
  
  forest: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'forest trees nature',
    alt: 'Forest landscape'
  },
  
  desert: {
    url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    hint: 'desert sand dunes',
    alt: 'Desert landscape'
  }
};

// Function to get appropriate default image based on trip title or locations
export const getDefaultImage = (tripTitle: string, locations: string[] = []): { url: string; hint: string; alt: string } => {
  const title = tripTitle.toLowerCase();
  const locationString = locations.join(' ').toLowerCase();
  const combined = `${title} ${locationString}`;
  
  // Check for regional keywords
  if (combined.includes('asia') || combined.includes('china') || combined.includes('japan') || combined.includes('thailand') || combined.includes('vietnam')) {
    return defaultImages.asia;
  }
  
  if (combined.includes('europe') || combined.includes('paris') || combined.includes('rome') || combined.includes('barcelona') || combined.includes('london')) {
    return defaultImages.europe;
  }
  
  if (combined.includes('america') || combined.includes('usa') || combined.includes('canada') || combined.includes('mexico')) {
    return defaultImages.america;
  }
  
  if (combined.includes('africa') || combined.includes('safari') || combined.includes('kenya') || combined.includes('south africa')) {
    return defaultImages.africa;
  }
  
  if (combined.includes('australia') || combined.includes('sydney') || combined.includes('melbourne')) {
    return defaultImages.australia;
  }
  
  // Check for specific themes
  if (combined.includes('beach') || combined.includes('ocean') || combined.includes('coast')) {
    return defaultImages.beach;
  }
  
  if (combined.includes('mountain') || combined.includes('hiking') || combined.includes('climbing')) {
    return defaultImages.mountains;
  }
  
  if (combined.includes('forest') || combined.includes('jungle') || combined.includes('nature')) {
    return defaultImages.forest;
  }
  
  if (combined.includes('desert') || combined.includes('sahara')) {
    return defaultImages.desert;
  }
  
  if (combined.includes('city') || combined.includes('urban') || combined.includes('downtown')) {
    return defaultImages.city;
  }
  
  // Default to general travel image
  return defaultImages.general;
};

// Function to get a random default image for variety
export const getRandomDefaultImage = (): { url: string; hint: string; alt: string } => {
  const images = Object.values(defaultImages);
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}; 