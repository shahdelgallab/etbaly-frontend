# Slicing Integration - Usage Examples

## Quick Start

The slicing integration is now ready to use! Here's how to add it to your pages.

## Example 1: Add to Admin Page

Add a slicing section to the admin page where admins can slice designs:

```tsx
import { SlicingPanel } from '../components/SlicingPanel';

function AdminPage() {
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  
  return (
    <div>
      {/* ... other admin content ... */}
      
      {/* Slicing Section */}
      <section>
        <h2>Slice Design for Printing</h2>
        
        {/* Design selector */}
        <select onChange={(e) => setSelectedDesignId(e.target.value)}>
          <option value="">Select a design...</option>
          {designs.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        
        {/* Slicing panel */}
        {selectedDesignId && (
          <SlicingPanel
            designId={selectedDesignId}
            designName={designs.find(d => d.id === selectedDesignId)?.name}
            onComplete={(gcodeUrl) => {
              console.log('G-code ready:', gcodeUrl);
              // Optionally: show notification, update UI, etc.
            }}
          />
        )}
      </section>
    </div>
  );
}
```

## Example 2: Add to Product Detail Page

Add a "Slice for Printing" button next to "Add to Cart":

```tsx
import { useState } from 'react';
import { SlicingPanel } from '../components/SlicingPanel';

function ProductDetailPage() {
  const [showSlicing, setShowSlicing] = useState(false);
  
  return (
    <div>
      {/* ... product details ... */}
      
      <div className="flex gap-3">
        {/* Add to Cart button */}
        <button onClick={addToCart}>
          Add to Cart
        </button>
        
        {/* Slice button */}
        <button onClick={() => setShowSlicing(!showSlicing)}>
          Slice for Printing
        </button>
      </div>
      
      {/* Slicing panel (shown when button clicked) */}
      {showSlicing && (
        <SlicingPanel
          designId={product.designId}
          designName={product.name}
          onComplete={(gcodeUrl) => {
            alert('G-code ready! Download link: ' + gcodeUrl);
          }}
        />
      )}
    </div>
  );
}
```

## Example 3: Add to Upload Page

After uploading a 3D model, offer to slice it:

```tsx
import { SlicingPanel } from '../components/SlicingPanel';

function UploadPage() {
  const [uploadedDesignId, setUploadedDesignId] = useState<string | null>(null);
  
  const handleUpload = async (file: File) => {
    // Upload file and create design
    const design = await designService.create(file);
    setUploadedDesignId(design.id);
  };
  
  return (
    <div>
      {/* Upload form */}
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      
      {/* After upload, show slicing option */}
      {uploadedDesignId && (
        <div>
          <h3>Upload Complete!</h3>
          <p>Would you like to slice this model for printing?</p>
          
          <SlicingPanel
            designId={uploadedDesignId}
            onComplete={(gcodeUrl) => {
              // Add to cart with slicing info
              addToCart({ designId: uploadedDesignId, gcodeUrl });
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## Example 4: Programmatic Usage (No UI)

Use the viewmodel directly for custom implementations:

```tsx
import { useSlicingViewModel } from '../viewmodels/useSlicingViewModel';

function MyCustomComponent() {
  const slicing = useSlicingViewModel();
  
  const handleSlice = async () => {
    try {
      // Start slicing
      await slicing.executeSlicing(
        'design-id-123',
        'PLA',      // material
        'normal',   // preset
        100         // scale
      );
      
      // Slicing will automatically poll for status
      // When complete, slicing.job will contain the results
      
    } catch (error) {
      console.error('Slicing failed:', error);
    }
  };
  
  // Monitor progress
  useEffect(() => {
    if (slicing.phase === 'completed' && slicing.job) {
      console.log('Slicing complete!');
      console.log('G-code URL:', slicing.job.gcodeUrl);
      console.log('Weight:', slicing.job.weight);
      console.log('Print time:', slicing.job.printTime);
      console.log('Price:', slicing.job.calculatedPrice);
    }
  }, [slicing.phase, slicing.job]);
  
  return (
    <div>
      <button onClick={handleSlice}>Slice</button>
      
      {slicing.phase === 'processing' && (
        <div>Processing... {slicing.progress}%</div>
      )}
      
      {slicing.error && (
        <div>Error: {slicing.error}</div>
      )}
    </div>
  );
}
```

## Example 5: Chat Integration

Automatically slice AI-generated 3D models:

```tsx
// In useChatViewModel.ts or ChatPage.tsx

import { useSlicingViewModel } from '../viewmodels/useSlicingViewModel';

function ChatPage() {
  const chat = useChatViewModel();
  const slicing = useSlicingViewModel();
  
  // When 3D model is generated
  useEffect(() => {
    if (chat.pendingModel?.designId) {
      // Automatically start slicing
      slicing.executeSlicing(
        chat.pendingModel.designId,
        'PLA',
        'normal',
        100
      );
    }
  }, [chat.pendingModel]);
  
  return (
    <div>
      {/* Chat interface */}
      {/* ... */}
      
      {/* Show slicing progress */}
      {slicing.phase === 'processing' && (
        <div>
          <p>Preparing your model for printing...</p>
          <progress value={slicing.progress} max={100} />
        </div>
      )}
      
      {/* Show slicing results */}
      {slicing.phase === 'completed' && slicing.job && (
        <div>
          <h3>Ready to Print!</h3>
          <p>Weight: {slicing.job.weight}g</p>
          <p>Time: {slicing.job.printTime} minutes</p>
          <p>Cost: ${slicing.job.calculatedPrice}</p>
          <button onClick={() => window.open(slicing.job.gcodeUrl)}>
            Download G-code
          </button>
        </div>
      )}
    </div>
  );
}
```

## SlicingPanel Props

```typescript
interface SlicingPanelProps {
  designId: string;           // Required: Design ID to slice
  designName?: string;        // Optional: Display name
  onComplete?: (gcodeUrl: string) => void;  // Optional: Callback when done
}
```

## Slicing Phases

The `phase` property indicates the current state:

- `'idle'` - Ready to start, showing settings form
- `'submitting'` - Submitting job to backend
- `'queued'` - Job queued, waiting to be processed
- `'processing'` - Job is being processed
- `'completed'` - Job complete, showing results
- `'failed'` - Job failed, showing error

## Slicing Presets

- **Draft**: Fast print, 0.3mm layers, 10% infill
- **Normal**: Balanced, 0.2mm layers, 20% infill
- **Heavy**: High quality, 0.1mm layers, 40% infill

## Materials Supported

- PLA
- ABS
- PETG
- PLA+
- TPU
- Nylon

## Scale Range

- Minimum: 10% (1/10th size)
- Maximum: 200% (2x size)
- Default: 100% (original size)

## Error Handling

```tsx
{slicing.error && (
  <div className="error">
    {slicing.error}
  </div>
)}
```

Common errors:
- "Design not found" - Invalid design ID
- "Not authenticated" - User not logged in
- "Slicing job failed" - Processing error
- "Slicing job timed out" - Took too long (>10 minutes)

## Styling

The `SlicingPanel` component uses Tailwind classes and matches the app's design system:
- Navy blue primary color
- Olive green accents
- Glassmorphism effects
- Smooth animations with Framer Motion

You can customize the styling by modifying the component or wrapping it in your own styled container.

## Testing

1. **Test with valid design ID:**
   ```tsx
   <SlicingPanel designId="valid-design-id-123" />
   ```

2. **Test with invalid design ID:**
   ```tsx
   <SlicingPanel designId="invalid-id" />
   // Should show error: "Design not found"
   ```

3. **Test different presets:**
   - Try draft, normal, and heavy presets
   - Verify different print times and costs

4. **Test different scales:**
   - Try 50% (half size)
   - Try 150% (1.5x size)
   - Verify weight and dimensions change accordingly

5. **Test completion callback:**
   ```tsx
   <SlicingPanel
     designId="design-id"
     onComplete={(url) => console.log('Done!', url)}
   />
   ```

## Next Steps

1. Add `SlicingPanel` to your desired page
2. Test with a valid design ID
3. Customize styling if needed
4. Add error handling and notifications
5. Integrate with your cart/checkout flow

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify design ID is valid
3. Ensure user is authenticated
4. Check backend API is running
5. Verify worker server is accessible
