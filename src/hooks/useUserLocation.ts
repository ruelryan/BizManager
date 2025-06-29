import { useState, useEffect } from 'react';

interface LocationInfo {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  currency: string | null;
  loading: boolean;
  error: string | null;
}

export const useUserLocation = () => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    country: null,
    countryCode: null,
    city: null,
    currency: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const detectLocation = async (retryCount = 0, maxRetries = 3) => {
      try {
        // Use IP-based geolocation (doesn't require permission)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; LocationDetector/1.0)'
          }
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate that we received the expected data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from location service');
        }
        
        setLocationInfo({
          country: data.country_name || null,
          countryCode: data.country_code || null,
          city: data.city || null,
          currency: data.currency || null,
          loading: false,
          error: null
        });
        
        console.log('Location detected:', data.country_name, data.currency);
      } catch (error) {
        console.error(`Location detection attempt ${retryCount + 1} failed:`, error);
        
        // If we haven't reached max retries and it's not an abort error, try again
        if (retryCount < maxRetries && error instanceof Error && error.name !== 'AbortError') {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
          console.log(`Retrying location detection in ${delay}ms...`);
          await sleep(delay);
          return detectLocation(retryCount + 1, maxRetries);
        }
        
        // All retries exhausted or abort error, set error state
        let errorMessage = 'Unable to detect location';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Location detection timed out';
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Network error - please check your internet connection';
          } else {
            errorMessage = error.message;
          }
        }
        
        setLocationInfo(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
    };

    detectLocation();
  }, []);

  return locationInfo;
};