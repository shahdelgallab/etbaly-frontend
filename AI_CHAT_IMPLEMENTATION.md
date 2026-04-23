# AI Chat Page Implementation

## Overview
The Chat Page now supports **two AI generation modes**:
1. **Text to 3D** - User describes an idea → AI generates image → User approves → AI converts to 3D model
2. **Image to 3D** - User uploads image → AI directly generates 3D model

## User Flow

### Initial State
- User sees a **mode selector** with two options:
  - **Text to 3D** (Type icon) - Describe in words
  - **Image to 3D** (Image icon) - Upload photo

### Text to 3D Flow
1. User selects "Text to 3D"
2. User enters:
   - Text prompt (1-500 chars): "e.g. A futuristic vase with geometric patterns"
   - Design name (2-100 chars): "e.g. Geometric Vase"
3. Clicks "Generate Image"
4. **Progress bar** shows 4 stages: Upload → Generate → Download → Render
5. **Generated image preview** appears with two buttons:
   - ❌ "Try Different Prompt" - Goes back to text input
   - ✅ "Convert to 3D Model" - Proceeds to 3D conversion
6. If approved, AI converts image to 3D (another progress bar)
7. **3D model preview** appears in interactive viewer
8. User confirms or rejects the 3D model
9. If confirmed → Added to cart

### Image to 3D Flow
1. User selects "Image to 3D"
2. **Drag-and-drop zone** appears (or click to browse)
   - Accepts: JPEG, PNG, WebP, GIF, BMP
   - Max size: 10 MB
3. After file selection, **name form** appears:
   - Shows image preview thumbnail
   - User enters design name (2-100 chars)
   - Buttons: Cancel | Generate 3D
4. **Progress bar** shows 4 stages: Upload → Generate → Download → Render
5. **3D model preview** appears in interactive viewer
6. User confirms or rejects the 3D model
7. If confirmed → Added to cart

## API Integration

### Endpoints Used

#### 1. Text to Image
```typescript
POST /api/v1/ai/text-to-image
Body: { prompt: string, designName: string }
Returns: { jobId: string }
Queue: TEXT_TO_IMAGE
```

#### 2. Image to 3D
```typescript
POST /api/v1/ai/image-to-3d
Body: FormData { image: File, designName: string }
Returns: { jobId: string }
Queue: AI_GENERATION
```

#### 3. Job Status Polling
```typescript
GET /api/v1/ai/job/:queueName/:jobId
Returns: {
  jobId, queueName, state, progress, designName,
  completed, failed, error?,
  result?: {
    // For TEXT_TO_IMAGE:
    imagePublicUrl?: string,
    imageFileId?: string,
    
    // For AI_GENERATION (image-to-3d):
    publicUrl?: string,      // STL file URL
    designId?: string,       // MongoDB ObjectId
    fileId?: string
  }
}
```

### Polling Logic
- **Interval**: 1.5 seconds
- **Max attempts**: 240 (6 minutes timeout)
- **Progress mapping**: 
  - 0-25%: Upload stage
  - 25-75%: Generation stage (mapped from job progress)
  - 75-90%: Download stage
  - 90-100%: Render stage

## Components

### New Components Added

#### `ModeSelector`
- Two-card grid layout
- Text to 3D (Type icon, primary color)
- Image to 3D (Image icon, accent color)
- Glassmorphism cards with hover effects

#### `TextPromptForm`
- Textarea for prompt (500 char limit with counter)
- Input for design name (100 char limit)
- "Generate Image" button with loading state

#### `ImagePreview`
- Shows generated image from text-to-image
- Two action buttons:
  - "Try Different Prompt" (reject)
  - "Convert to 3D Model" (approve)
- Loading state during 3D conversion

### Existing Components (Enhanced)

#### `UploadZone`
- Drag-and-drop file upload
- Click to browse
- File type and size validation
- Visual feedback on drag-over

#### `NameForm`
- Image thumbnail preview
- File size display
- Design name input
- Cancel | Generate buttons

#### `GenerationProgress`
- 4-stage progress indicator with dots
- Animated progress bar
- Stage labels: Upload → Generate → Download → Render
- Percentage display

#### `ModelPreview`
- Three.js canvas with OrbitControls
- Auto-rotate toggle
- Zoom and pan controls
- Auto-fit camera based on model bounds
- WebGL context loss recovery

## ViewModel State

### `useChatViewModel` Hook

#### State Variables
```typescript
chatMode: 'text-to-3d' | 'image-to-3d' | null
chatStep: 'idle' | 'generating' | 'image-preview' | 'confirm' | 'done'
messages: ChatMessage[]
pendingModel: { modelUrl, geometry, designId?, suggestedName }
pendingImageUrl: string | null  // For text-to-3d intermediate image
stage: 'upload' | 'generate' | 'download' | 'render' | null
progress: number (0-100)
loading: boolean
error: string | null
```

#### Actions
```typescript
setChatMode(mode)
generateImageFromText(prompt, designName)
approveImageAndConvertTo3D()
rejectGeneratedImage()
generateFromImage(imageFile, designName)
confirmModel()
rejectModel()
reset()
```

## UI/UX Features

### Visual Design
- **Glassmorphism** cards with blur effects
- **Glow effects** on primary actions
- **Blueprint-style** progress indicators
- **Smooth animations** with Framer Motion
- **Responsive layout** - mobile-first design

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus states on all inputs
- Loading states with spinners
- Error messages with retry options

### User Feedback
- Real-time progress updates (0-100%)
- Stage indicators (Upload, Generate, Download, Render)
- Chat-style message bubbles (user vs assistant)
- Typing indicator during AI processing
- Success/error messages
- Confirmation dialogs

## Error Handling

### Network Errors
- Retry mechanism for failed requests
- Timeout after 6 minutes
- User-friendly error messages
- "Retry" button on failures

### Validation Errors
- File type validation (images only)
- File size validation (max 10 MB)
- Text length validation (1-500 chars for prompt)
- Name length validation (2-100 chars)
- Real-time character counters

### WebGL Errors
- Context loss recovery
- Automatic retry on render failures
- Fallback error UI with retry button

## Performance Optimizations

### 3D Rendering
- Lazy loading of Three.js components
- Geometry caching with `useMemo`
- Auto-fit camera calculation
- Efficient buffer geometry handling
- WebGL context reuse

### Polling
- Automatic cleanup on unmount
- Stop polling on completion/failure
- Debounced progress updates
- Request cancellation on reset

### File Handling
- Client-side file validation
- Preview URL cleanup
- FormData for efficient uploads
- Blob conversion for generated images

## Testing Checklist

- [ ] Mode selector displays correctly
- [ ] Text-to-3D: Submit prompt → Image generates → Approve → 3D generates
- [ ] Text-to-3D: Reject image → Returns to prompt input
- [ ] Image-to-3D: Upload file → Name form → 3D generates
- [ ] Image-to-3D: Drag-and-drop works
- [ ] Progress bar animates through all 4 stages
- [ ] 3D model renders correctly in viewer
- [ ] Confirm model → Adds to cart → Opens cart sidebar
- [ ] Reject model → Returns to input
- [ ] Reset button clears all state
- [ ] Error handling displays messages
- [ ] Polling timeout works (6 min)
- [ ] Mobile responsive layout
- [ ] Dark/light theme support
- [ ] Keyboard navigation works
- [ ] Loading states display correctly

## Future Enhancements

### Potential Features
- Save generation history
- Edit generated models (scale, rotate, color)
- Multiple material options
- Price estimation before adding to cart
- Share generated models
- Download STL files directly
- Batch generation
- Advanced prompt templates
- Image editing before conversion
- Model comparison view

### Performance
- Server-sent events instead of polling
- WebSocket for real-time updates
- Progressive model loading
- Thumbnail generation
- CDN integration for model files

## Notes

- All business logic is in `useChatViewModel` (MVVM pattern)
- No direct API calls in components
- All colors use CSS variables (theme-aware)
- TypeScript strict mode - no `any` types
- Mobile-first responsive design
- Accessibility compliant (WCAG)
