# Simple AI 3D Model Generation Integration

## Goal
Add AI-powered 3D model generation from images to my existing 3D viewer, with a 4-stage progress bar and automatic polling.

---

## What I Need

### 1. Read My Current Code
- Find my existing 3D viewer component
- Identify the UI/styling system I'm using
- Keep the same look and feel

### 2. Add Image Upload Form
Add a simple form with:
- Image file input (max 10MB, images only)
- Design name input (2-100 characters)
- "Generate 3D Model" button

### 3. Add 4-Stage Progress Bar

Split progress into 4 stages:
- **Upload (0-25%)**: Uploading image to server
- **Generate (25-75%)**: AI creating the model (poll every 1 second)
- **Download (75-90%)**: Downloading the STL file
- **Render (90-100%)**: Displaying the model

Show current stage name and percentage.

---

## API Flow

### Step 1: Upload Image (0-25%)
```javascript
POST https://etbaly.yussefrostom.me/api/v1/ai/generate-design
Headers: Authorization: Bearer <token>
Body: FormData { image, designName }

Response: { data: { jobId: "123" } }
```

### Step 2: Poll Job Status Every 1 Second (25-75%)
```javascript
GET https://etbaly.yussefrostom.me/api/v1/ai/job/:jobId
Headers: Authorization: Bearer <token>

Response: {
  data: {
    state: "waiting" | "active" | "completed" | "failed",
    progress: 0-100,
    result: { publicUrl: "https://drive.google.com/..." }
  }
}
```

**Progress Calculation:**
```javascript
overallProgress = 25 + (apiProgress * 0.5)
// API progress 0 → overall 25%
// API progress 50 → overall 50%
// API progress 100 → overall 75%
```

### Step 3: Download STL File (75-90%)
```javascript
const proxyUrl = `https://etbaly.yussefrostom.me/api/v1/files/proxy?url=${encodeURIComponent(publicUrl)}`;

const response = await fetch(proxyUrl);
const arrayBuffer = await response.arrayBuffer();
```

### Step 4: Render Model (90-100%)
```javascript
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();
const geometry = loader.parse(arrayBuffer);
geometry.center();
geometry.computeVertexNormals();

// Display in viewer
```

---

## Code Template

```typescript
function MyExisting3DViewer() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [model, setModel] = useState(null);

  async function handleGenerate(image: File, name: string) {
    setIsGenerating(true);
    
    try {
      // Stage 1: Upload (0-25%)
      setStage('Uploading...');
      setProgress(0);
      
      const formData = new FormData();
      formData.append('image', image);
      formData.append('designName', name);
      
      const res = await fetch('https://etbaly.yussefrostom.me/api/v1/ai/generate-design', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      
      const { data } = await res.json();
      setProgress(25);
      
      // Stage 2: Generate (25-75%)
      setStage('AI Generating...');
      
      const interval = setInterval(async () => {
        const statusRes = await fetch(
          `https://etbaly.yussefrostom.me/api/v1/ai/job/${data.jobId}`,
          { headers: { 'Authorization': 'Bearer ' + token } }
        );
        
        const status = await statusRes.json();
        
        // Update progress
        setProgress(25 + (status.data.progress * 0.5));
        
        if (status.data.state === 'completed') {
          clearInterval(interval);
          
          // Stage 3: Download (75-90%)
          setStage('Downloading...');
          setProgress(75);
          
          const proxyUrl = `https://etbaly.yussefrostom.me/api/v1/files/proxy?url=${encodeURIComponent(status.data.result.publicUrl)}`;
          const stlRes = await fetch(proxyUrl);
          const arrayBuffer = await stlRes.arrayBuffer();
          
          setProgress(85);
          
          // Stage 4: Render (90-100%)
          setStage('Rendering...');
          setProgress(90);
          
          const loader = new STLLoader();
          const geometry = loader.parse(arrayBuffer);
          geometry.center();
          geometry.computeVertexNormals();
          
          setModel(geometry);
          setProgress(100);
          setIsGenerating(false);
        }
        
        if (status.data.state === 'failed') {
          clearInterval(interval);
          throw new Error('Generation failed');
        }
      }, 1000); // Poll every 1 second
      
    } catch (error) {
      alert('Error: ' + error.message);
      setIsGenerating(false);
    }
  }

  return (
    <div>
      {/* My existing UI */}
      
      {!isGenerating ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleGenerate(imageFile, designName);
        }}>
          <input type="file" accept="image/*" />
          <input type="text" placeholder="Design name" />
          <button>Generate 3D Model</button>
        </form>
      ) : (
        <div>
          <p>{stage}</p>
          <progress value={progress} max={100} />
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      
      {/* My existing 3D viewer */}
      <Canvas>
        {model && (
          <mesh geometry={model}>
            <meshStandardMaterial color="#5a7a9e" />
          </mesh>
        )}
      </Canvas>
    </div>
  );
}
```

---

## Key Points

1. **Poll every 1 second** - Use `setInterval` with 1000ms
2. **Clear interval** when job completes or fails
3. **Progress mapping**:
   - 0-25%: Upload stage
   - 25-75%: Generate stage (from API progress)
   - 75-90%: Download stage
   - 90-100%: Render stage

4. **Use custom fetch** for STL loading (not useLoader hook)
5. **Keep my existing UI style** - just add the new form and progress bar

---

## What to Do

1. Copy the code template above
2. Adapt it to match my project's styling
3. Replace `token` with my auth token source
4. Test each stage separately
5. Add error handling for each stage

That's it! Simple and straightforward.
