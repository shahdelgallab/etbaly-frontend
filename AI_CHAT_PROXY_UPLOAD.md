# AI Chat Image Proxy Implementation

## Overview
Updated the image loading system to use the correct backend proxy endpoint as documented in `files.md`. All Google Drive URLs are now properly routed through `/api/v1/files/proxy?url=<encoded-url>`.

## Changes Made

### 1. **imageUtils.ts** - Simplified Proxy URL Conversion
**File:** `etbaly/src/utils/imageUtils.ts`

Simplified the `convertGoogleDriveUrl` function to use the correct backend proxy endpoint:

```typescript
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
```

**Changes:**
- ❌ Removed complex file ID extraction logic
- ✅ Now passes the full Google Drive URL to the backend proxy
- ✅ Backend handles all URL format variations
- ✅ Simpler, more maintainable code

### 2. **fileService.ts** - Updated to Use Correct Proxy Endpoint
**File:** `etbaly/src/services/fileService.ts`

Updated all proxy functions to use the correct endpoint:

```typescript
export const fileService = {
  /**
   * Proxy file download through backend to avoid CORS issues
   * Uses GET /api/v1/files/proxy?url=<google-drive-url>
   */
  proxyDownload: async (url: string): Promise<Blob> => {
    const encodedUrl = encodeURIComponent(url);
    const response = await api.get(`/files/proxy?url=${encodedUrl}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get file as blob URL for 3D viewer
   * Useful for loading 3D models from Google Drive
   */
  getProxyBlobUrl: async (url: string): Promise<string> => {
    const blob = await fileService.proxyDownload(url);
    return URL.createObjectURL(blob);
  },

  /**
   * Get proxied URL for direct use in img tags or fetch
   * This returns the proxy endpoint URL without fetching the file
   */
  getProxyUrl: (url: string): string => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const encodedUrl = encodeURIComponent(url);
    return `${apiBaseUrl}/files/proxy?url=${encodedUrl}`;
  },
};
```

**Changes:**
- ❌ Removed non-existent `/files/proxy-download` POST endpoint
- ❌ Removed non-existent `/files/proxy-upload` endpoint
- ✅ Now uses GET `/files/proxy?url=<encoded-url>` as documented
- ✅ Added `getProxyUrl()` helper for direct URL generation

### 3. **useChatViewModel.ts** - Cleaned Up Image Handling
**File:** `etbaly/src/viewmodels/useChatViewModel.ts`

Simplified the text-to-3D image approval flow:

```typescript
const approveImageAndConvertTo3D = useCallback(async () => {
  if (!pendingImageUrl) return;
  // ... setup code ...

  try {
    // Fetch the image as a Blob so we can POST it as multipart
    console.log('📤 Fetching generated image from:', pendingImageUrl);
    const resp = await fetch(pendingImageUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`);
    }
    
    const blob = await resp.blob();
    const ext  = blob.type.includes('png') ? 'png' : 'jpg';
    const file = new File([blob], `generated.${ext}`, { type: blob.type });
    
    console.log('📤 Submitting image for 3D conversion...');
    const jobId = await aiService.imageTo3D(file, pendingDesignName);
    // ... rest of the flow ...
  }
}, [pendingImageUrl, pendingDesignName, addMessage, startPolling, downloadAndParse]);
```

**Changes:**
- ❌ Removed proxy upload attempt (endpoint doesn't exist)
- ✅ Directly fetches the proxied image URL
- ✅ Converts to File and submits to AI service
- ✅ Better error handling with HTTP status codes

## How It Works

### Image Loading Flow

```
Google Drive URL from backend
        ↓
getDirectImageUrl() in viewmodel
        ↓
convertGoogleDriveUrl() in imageUtils
        ↓
/api/v1/files/proxy?url=<encoded-google-drive-url>
        ↓
Backend fetches from Google Drive
        ↓
Returns image with proper Content-Type
        ↓
Displayed in <img> tag or used in Canvas
```

### Text-to-3D Flow

```
User enters text prompt
        ↓
Generate image from text (AI service)
        ↓
Backend returns Google Drive URL
        ↓
Convert to proxy URL using getDirectImageUrl()
        ↓
Display proxied image for approval
        ↓
User approves image
        ↓
Fetch image from proxy URL
        ↓
Convert to File object
        ↓
Submit to imageTo3D() for 3D conversion
        ↓
Display 3D model for confirmation
        ↓
Add to cart
```

## Files Using the Proxy

All these files correctly use the proxy for Google Drive URLs:

1. **stlLoader.ts** - Loads 3D models (STL files) through proxy
2. **imageUtils.ts** - Converts Google Drive image URLs to proxy URLs
3. **fileService.ts** - Provides proxy download utilities
4. **useChatViewModel.ts** - Uses proxy for generated images
5. **ChatPage.tsx** - Displays images using proxied URLs

## Backend Endpoint (from files.md)

```
GET /api/v1/files/proxy?url=<google-drive-url>

Access: Public (requires valid Google Drive URL)

Response 200: Raw binary content with appropriate Content-Type
Response 400: Invalid URL
Response 404: File not found
```

## Benefits

1. **Correct Implementation** - Uses documented backend endpoint
2. **Simpler Code** - No complex URL parsing on frontend
3. **Backend Flexibility** - Backend handles all Google Drive URL formats
4. **CORS Handling** - All Google Drive access goes through backend
5. **Consistent Pattern** - Same proxy approach for images and 3D models
6. **Better Error Handling** - Proper HTTP status codes and error messages

## Testing Checklist

- [x] Text-to-3D: Generate image from text prompt
- [x] Verify generated image displays correctly using proxy
- [x] Approve image and verify it fetches from proxy URL
- [x] Verify 3D conversion starts successfully
- [x] Check that the final 3D model is added to cart
- [x] Image-to-3D: Upload image and verify 3D generation
- [x] Product images: Verify Google Drive product images load
- [x] 3D models: Verify STL files load through proxy

## Related Files

- `etbaly/src/utils/imageUtils.ts` - Image URL conversion
- `etbaly/src/services/fileService.ts` - Proxy utilities
- `etbaly/src/utils/stlLoader.ts` - 3D model loading
- `etbaly/src/viewmodels/useChatViewModel.ts` - Chat logic
- `etbaly/src/views/pages/ChatPage.tsx` - Chat UI

## Notes

- All Google Drive URLs are automatically proxied
- The proxy endpoint handles authentication with Google Drive
- Frontend doesn't need to know about Google Drive API details
- The same proxy works for images, 3D models, and any other files
- Console logs help track the image loading process in development
