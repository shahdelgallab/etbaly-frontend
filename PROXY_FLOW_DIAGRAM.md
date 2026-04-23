# Proxy Flow Diagram

## Complete Image & File Loading Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Backend Returns Google Drive URL                          │  │
│  │    Example: https://drive.google.com/file/d/ABC123/view      │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 2. getDirectImageUrl() / proxyUrl()                          │  │
│  │    Location: imageUtils.ts / stlLoader.ts                    │  │
│  │    Converts to: /api/v1/files/proxy?url=<encoded-url>       │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 3. Use Proxied URL                                           │  │
│  │    • <img src="proxied-url" />                               │  │
│  │    • fetch(proxied-url) for 3D models                        │  │
│  │    • Canvas/Three.js loads from proxied URL                  │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ HTTP GET Request
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 4. GET /api/v1/files/proxy?url=<encoded-google-drive-url>   │  │
│  │    • Decode the URL parameter                                │  │
│  │    • Validate it's a Google Drive URL                        │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 5. Fetch from Google Drive                                   │  │
│  │    • Use Google Drive API or direct download                 │  │
│  │    • Handle authentication if needed                          │  │
│  │    • Get file content as binary                              │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│                           ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 6. Return File with Proper Headers                          │  │
│  │    • Content-Type: image/jpeg, image/png, etc.              │  │
│  │    • Content-Type: application/octet-stream (for STL)       │  │
│  │    • Binary file content                                     │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ HTTP Response (Binary)
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 7. Render/Use File                                           │  │
│  │    • Images: Display in <img> tag                            │  │
│  │    • 3D Models: Parse STL → Create geometry → Render         │  │
│  │    • Files: Download or process as needed                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Specific Use Cases

### Use Case 1: Chat Generated Image

```
Text Prompt
    ↓
AI Service generates image
    ↓
Backend returns: https://drive.google.com/file/d/XYZ/view
    ↓
useChatViewModel.ts: getDirectImageUrl(url)
    ↓
Proxied URL: /api/v1/files/proxy?url=https%3A%2F%2Fdrive.google.com...
    ↓
ChatPage.tsx: <img src={msg.imageUrl} />
    ↓
Browser requests proxied URL
    ↓
Backend fetches from Google Drive
    ↓
Image displays in chat
```

### Use Case 2: Product Image

```
Product data from backend
    ↓
product.imageUrl = "https://drive.google.com/file/d/ABC/view"
    ↓
ProductCard.tsx: <img src={product.imageUrl} />
    ↓
imageUtils.ts: getDirectImageUrl() converts URL
    ↓
Browser requests: /api/v1/files/proxy?url=...
    ↓
Backend fetches from Google Drive
    ↓
Image displays in product card
```

### Use Case 3: 3D Model (STL)

```
Model URL from backend
    ↓
modelUrl = "https://drive.google.com/file/d/DEF/view"
    ↓
stlLoader.ts: proxyUrl(url)
    ↓
Proxied URL: /api/v1/files/proxy?url=...
    ↓
fetch(proxiedUrl) with auth headers
    ↓
Backend fetches STL from Google Drive
    ↓
Returns binary STL data
    ↓
STLLoader.parse(buffer)
    ↓
Three.js renders 3D model
```

### Use Case 4: Text-to-3D Flow

```
User: "Create a coffee mug"
    ↓
textToImage() → Job queued
    ↓
Poll job status
    ↓
Job complete: imagePublicUrl = "https://drive.google.com/..."
    ↓
getDirectImageUrl() → Proxied URL
    ↓
Display image for approval
    ↓
User approves
    ↓
fetch(proxiedUrl) → Get as Blob
    ↓
Convert Blob to File
    ↓
imageTo3D(file) → Submit for 3D conversion
    ↓
Poll job status
    ↓
Job complete: publicUrl = "https://drive.google.com/...stl"
    ↓
fetchAndParseSTL(publicUrl) → Uses proxy
    ↓
Display 3D model
    ↓
Add to cart
```

## Key Points

1. **Single Endpoint**: All file proxying goes through `/api/v1/files/proxy`
2. **URL Encoding**: Google Drive URLs are URL-encoded in the query parameter
3. **Transparent**: Frontend code doesn't need to know about Google Drive API
4. **CORS-Free**: Backend handles all Google Drive communication
5. **Type-Agnostic**: Works for images, 3D models, documents, any file type
6. **Auth Handling**: Backend can add authentication if needed
7. **Error Handling**: Backend returns proper HTTP status codes (400, 404, etc.)

## Benefits of This Architecture

✅ **Security**: Google Drive credentials stay on backend  
✅ **Simplicity**: Frontend just uses a URL  
✅ **Flexibility**: Backend can change storage provider without frontend changes  
✅ **Performance**: Backend can add caching if needed  
✅ **Reliability**: Backend handles retries and error cases  
✅ **Consistency**: Same pattern for all file types  
