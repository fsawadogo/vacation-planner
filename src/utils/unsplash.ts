const FALLBACK_IMAGES = {
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80',
  city: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80',
  mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80',
  culture: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80'
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getUnsplashImage = async (destination: string): Promise<string> => {
  if (!destination) {
    return FALLBACK_IMAGES.default;
  }

  let lastError: Error | null = null;
  
  // Try multiple times with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Use a more specific search query with multiple relevant terms
      const searchTerms = [
        destination,
        'landmark',
        'travel',
        'tourism',
        'destination'
      ].join(' ');
      
      const searchQuery = encodeURIComponent(searchTerms);
      const imageUrl = `https://source.unsplash.com/featured/1600x900/?${searchQuery}`;
      
      const response = await fetch(imageUrl, { 
        method: 'GET', // Changed from HEAD to GET for more reliable results
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      // Validate that we got a real image URL back
      const finalUrl = response.url;
      if (!finalUrl.includes('images.unsplash.com')) {
        throw new Error('Invalid image URL received');
      }
      
      // Verify the image is accessible
      const imageResponse = await fetch(finalUrl, { method: 'HEAD' });
      if (!imageResponse.ok) {
        throw new Error('Image not accessible');
      }
      
      return finalUrl;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      
      // If this wasn't the last attempt, wait before retrying
      if (attempt < MAX_RETRIES - 1) {
        // Exponential backoff: wait longer between each retry
        await sleep(RETRY_DELAY * Math.pow(2, attempt));
        continue;
      }
    }
  }

  // If all retries failed, log the error and return a fallback image
  console.error('Error fetching Unsplash image after all retries:', lastError);
  return chooseFallbackImage(destination);
};

function chooseFallbackImage(destination: string): string {
  const destinationLower = destination.toLowerCase();
  
  // More comprehensive keyword matching with multiple variations
  const keywords = {
    beach: ['beach', 'coast', 'island', 'sea', 'ocean', 'shore', 'bay'],
    mountain: ['mountain', 'hill', 'alps', 'peak', 'summit', 'highlands', 'valley'],
    city: ['city', 'town', 'metropolis', 'urban', 'downtown', 'skyline'],
    food: ['food', 'cuisine', 'restaurant', 'dining', 'gastronomy', 'culinary'],
    culture: ['culture', 'museum', 'art', 'history', 'monument', 'heritage', 'landmark']
  };
  
  // Check each category against the destination
  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => destinationLower.includes(term))) {
      return FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES];
    }
  }
  
  // If no specific category matches, try to make an educated guess based on common destinations
  const commonDestinations = {
    beach: ['miami', 'hawaii', 'bali', 'maldives', 'caribbean'],
    mountain: ['alps', 'rockies', 'himalaya', 'andes', 'sierra'],
    city: ['york', 'london', 'paris', 'tokyo', 'francisco'],
    culture: ['rome', 'athens', 'cairo', 'kyoto', 'istanbul']
  };
  
  for (const [category, places] of Object.entries(commonDestinations)) {
    if (places.some(place => destinationLower.includes(place))) {
      return FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES];
    }
  }
  
  return FALLBACK_IMAGES.default;
}