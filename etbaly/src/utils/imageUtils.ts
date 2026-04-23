/**
 * Converts a Google Drive URL to use the backend proxy
 * @param url - The original Google Drive URL
 * @param apiBaseUrl - The API base URL
 * @returns A proxied URL through the backend
 */
export function convertGoogleDriveUrl(url: string, apiBaseUrl: string): string {
  if (!url) return url;

  // Check if it's a Google Drive URL
  if (!url.includes('drive.google.com')) {
    return url;
  }

  // Use the backend proxy endpoint as per files.md documentation
  // GET /api/v1/files/proxy?url=<google-drive-url>
  const encodedUrl = encodeURIComponent(url);
  return `${apiBaseUrl}/files/proxy?url=${encodedUrl}`;
}

/**
 * Fetches an image from a URL and converts it to base64 data URL
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  try {
    console.log('Attempting to fetch image:', url);
    
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Response is not an image: ${contentType}`);
    }

    const blob = await response.blob();
    console.log('Image fetched successfully, size:', blob.size, 'type:', blob.type);
    
    // Convert blob to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('Converted to data URL, length:', result.length);
        resolve(result);
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch image as data URL:', error);
    throw error;
  }
}

/**
 * Ensures an image URL is directly accessible for embedding
 * Handles Google Drive URLs by routing through backend proxy
 */
export function getDirectImageUrl(url: string, apiBaseUrl?: string): string {
  if (!url) return url;

  // Handle Google Drive URLs - route through backend proxy
  if (url.includes('drive.google.com')) {
    const baseUrl = apiBaseUrl || import.meta.env.VITE_API_URL || '';
    return convertGoogleDriveUrl(url, baseUrl);
  }

  // Add more URL conversions here as needed (Dropbox, OneDrive, etc.)

  return url;
}
