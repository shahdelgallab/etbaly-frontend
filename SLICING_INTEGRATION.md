# Slicing API Integration

## Overview

Integrated the slicing endpoints from the backend API to allow automated conversion of 3D models (STL files) into machine instructions (G-code).

## Files Created

### 1. **SlicingJob.ts** - Type Definitions
**Location:** `etbaly/src/models/SlicingJob.ts`

Defines TypeScript interfaces for slicing jobs:

```typescript
export type SlicingJobStatus = 'Queued' | 'Processing' | 'Completed' | 'Failed';
export type SlicingPreset = 'heavy' | 'normal' | 'draft';

export interface SlicingJob {
  jobId: string;
  jobNumber: string;
  designId: string;
  status: SlicingJobStatus;
  stlFileUrl?: string;
  gcodeUrl?: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  printTime?: number;
  calculatedPrice?: number;
  // ... timestamps
}
```

### 2. **slicingService.ts** - API Service
**Location:** `etbaly/src/services/slicingService.ts`

Provides methods to interact with the slicing API:

```typescript
export const slicingService = {
  // Create and dispatch slicing job
  executeSlicing: (data: CreateSlicingJobRequest) => Promise<CreateSlicingJobResponse>
  
  // Get job status
  getJobStatus: (jobId: string) => Promise<SlicingJob>
  
  // Poll job status until completion
  pollJobStatus: (jobId, onProgress?, maxAttempts?, intervalMs?) => Promise<SlicingJob>
}
```

### 3. **useSlicingViewModel.ts** - Business Logic
**Location:** `etbaly/src/viewmodels/useSlicingViewModel.ts`

React hook for managing slicing operations:

```typescript
export function useSlicingViewModel() {
  return {
    phase,      // 'idle' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed'
    job,        // Current slicing job data
    error,      // Error message if any
    progress,   // Progress percentage (0-100)
    
    executeSlicing,  // Start a slicing job
    refreshStatus,   // Manually refresh job status
    reset,           // Reset state
  };
}
```

## API Endpoints

### POST /api/v1/slicing/execute
Creates a slicing job and dispatches it to the queue.

**Request:**
```typescript
{
  designId: string;      // Required: Design ID to slice
  material?: string;     // Optional: Material type (default: "PLA")
  preset?: 'heavy' | 'normal' | 'draft';  // Optional: Quality preset
  scale?: number;        // Optional: Scale factor (default: 100)
}
```

**Response:**
```typescript
{
  success: true,
  message: "Slicing job dispatched successfully",
  data: {
    jobId: string;
    jobNumber: string;
    status: "Queued";
    designId: string;
    designName: string;
  }
}
```

### GET /api/v1/slicing/status/:jobId
Retrieves the current status of a slicing job.

**Response:**
```typescript
{
  success: true,
  data: {
    jobId: string;
    jobNumber: string;
    status: "Completed";
    stlFileUrl: string;
    gcodeUrl: string;
    weight: number;
    dimensions: { width, height, depth };
    printTime: number;
    calculatedPrice: number;
    // ... timestamps
  }
}
```

## Usage Examples

### Basic Usage

```typescript
import { useSlicingViewModel } from '../viewmodels/useSlicingViewModel';

function MyComponent() {
  const slicing = useSlicingViewModel();
  
  const handleSlice = async () => {
    await slicing.executeSlicing(
      'design-id-123',
      'PLA',
      'normal',
      100
    );
  };
  
  return (
    <div>
      <button onClick={handleSlice}>Start Slicing</button>
      
      {slicing.phase === 'processing' && (
        <div>Processing... {slicing.progress}%</div>
      )}
      
      {slicing.phase === 'completed' && slicing.job && (
        <div>
          <p>Slicing complete!</p>
          <p>Weight: {slicing.job.weight}g</p>
          <p>Print Time: {slicing.job.printTime} minutes</p>
          <p>Price: ${slicing.job.calculatedPrice}</p>
          <a href={slicing.job.gcodeUrl}>Download G-code</a>
        </div>
      )}
      
      {slicing.error && (
        <div>Error: {slicing.error}</div>
      )}
    </div>
  );
}
```

### Advanced Usage with Progress Tracking

```typescript
function SlicingProgress() {
  const slicing = useSlicingViewModel();
  
  const startSlicing = async () => {
    await slicing.executeSlicing('design-id', 'PETG', 'heavy', 150);
  };
  
  return (
    <div>
      {/* Phase indicator */}
      {slicing.phase === 'queued' && <p>Job queued...</p>}
      {slicing.phase === 'processing' && <p>Slicing in progress...</p>}
      {slicing.phase === 'completed' && <p>Slicing complete!</p>}
      
      {/* Progress bar */}
      <div className="progress-bar">
        <div style={{ width: `${slicing.progress}%` }} />
      </div>
      
      {/* Job details */}
      {slicing.job && (
        <div>
          <p>Job Number: {slicing.job.jobNumber}</p>
          <p>Status: {slicing.job.status}</p>
          
          {slicing.job.gcodeUrl && (
            <a href={slicing.job.gcodeUrl} download>
              Download G-code
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

## Slicing Presets

### Heavy (High Quality)
- Layer height: 0.1mm
- Infill: 40%
- Perimeters: 4
- Use for: Functional parts, high strength

### Normal (Balanced)
- Layer height: 0.2mm
- Infill: 20%
- Perimeters: 3
- Use for: General purpose, balanced quality/speed

### Draft (Fast)
- Layer height: 0.3mm
- Infill: 10%
- Perimeters: 2
- Use for: Prototypes, quick prints

## Workflow

```
User clicks "Slice Model"
        ↓
executeSlicing() called
        ↓
POST /api/v1/slicing/execute
        ↓
Job created with status "Queued"
        ↓
Start polling job status
        ↓
Status updates: Queued → Processing → Completed
        ↓
Display results (G-code URL, weight, time, price)
```

## Integration Points

### 1. Product Detail Page
Add a "Slice for Printing" button next to "Add to Cart":
- Shows slicing options (material, preset, scale)
- Displays slicing progress
- Shows estimated cost and print time
- Provides G-code download link

### 2. Admin Page
Add a slicing management section:
- List all slicing jobs
- View job status and details
- Retry failed jobs
- Download G-code files

### 3. Upload Page
After uploading a 3D model:
- Offer to slice immediately
- Show slicing progress
- Display results before adding to cart

### 4. Chat Page (AI Generated Models)
After generating a 3D model:
- Automatically trigger slicing
- Show slicing progress
- Display print details
- Add to cart with slicing info

## Error Handling

```typescript
try {
  await slicing.executeSlicing(designId, material, preset, scale);
} catch (error) {
  // Handle errors
  if (error.response?.status === 404) {
    console.error('Design not found');
  } else if (error.response?.status === 401) {
    console.error('Not authenticated');
  } else {
    console.error('Slicing failed:', error.message);
  }
}
```

## Polling Configuration

The `pollJobStatus` method polls the API every 5 seconds for up to 10 minutes:

```typescript
slicingService.pollJobStatus(
  jobId,
  (job) => {
    // Progress callback - called on each poll
    console.log('Job status:', job.status);
  },
  120,   // Max attempts (10 minutes)
  5000   // Interval (5 seconds)
);
```

## Price Calculation

The backend automatically calculates the price based on:

```
Price = (weight × material_price_per_gram) + (print_time_minutes / 60 × hourly_rate)
```

Example:
- Weight: 45.5g
- Material: PLA at $0.025/g
- Print time: 180 minutes (3 hours)
- Hourly rate: $10/hour

```
Material cost = 45.5 × 0.025 = $1.14
Time cost = (180 / 60) × 10 = $30.00
Total = $31.14
```

## Testing

### Manual Testing
1. Create a design with an STL file
2. Call `executeSlicing` with the design ID
3. Verify job is created with "Queued" status
4. Wait for status to change to "Processing"
5. Wait for status to change to "Completed"
6. Verify G-code URL, weight, dimensions, print time, and price are populated

### Mock Data
If the worker server is unavailable, the system falls back to mock data:
- Random weight: 20-70g
- Random dimensions: 50-150mm
- Random print time: 60-240 minutes
- Calculated price based on mock values

## Future Enhancements

1. **Real-time Updates**: Use WebSockets for instant status updates
2. **Batch Slicing**: Slice multiple designs at once
3. **Custom Settings**: Allow users to customize layer height, infill, etc.
4. **Preview**: Show G-code preview before downloading
5. **History**: Track slicing history per user
6. **Notifications**: Email/push notifications when slicing completes
7. **Cost Estimation**: Show estimated cost before slicing
8. **Material Library**: Expand material options with custom profiles

## Related Files

- `etbaly/src/models/SlicingJob.ts` - Type definitions
- `etbaly/src/services/slicingService.ts` - API service
- `etbaly/src/viewmodels/useSlicingViewModel.ts` - Business logic
- Backend API: `/api/v1/slicing/*` endpoints

## Notes

- Slicing requires authentication
- Only works with designs that have STL files
- Polling continues until job completes or fails
- Failed jobs can be retried by calling `executeSlicing` again
- G-code files are stored on the backend and accessible via URL
