# Color & Scale Update - Complete

## Summary
Fixed the validation error by updating the color format from hex string to RGB array and changing the scale range from 10-200% to 1-1000.

## Changes Made

### 1. Updated Color Format: Hex → RGB Array

**Before**: `color: string` (e.g., `"#1e3a5f"`)
**After**: `color: [number, number, number]` (e.g., `[30, 58, 95]`)

#### Files Updated:
- `etbaly/src/viewmodels/useChatViewModel.ts`
  - Changed `SlicingOptions.color` type to `[number, number, number]`
  - Updated default color from `'#1e3a5f'` to `[30, 58, 95]`
  - Updated `confirmModel()` to send RGB array to backend

- `etbaly/src/services/cartService.ts`
  - Changed `PrintingProperties.color` type to `[number, number, number]`
  - Added comment: "RGB array [r, g, b]"

- `etbaly/src/viewmodels/useUploadViewModel.ts`
  - Changed default color from `form.color` to `[30, 58, 95]`

### 2. Updated Scale Range: 10-200% → 1-1000

**Before**: Scale range 10-200 (displayed as percentage)
**After**: Scale range 1-1000 (raw number, no percentage conversion)

#### Files Updated:
- `etbaly/src/viewmodels/useChatViewModel.ts`
  - Removed scale division by 100 in `confirmModel()`
  - Now sends raw scale value (e.g., 100 instead of 1.0)
  - Added comment: "Scale range: 1-1000"

- `etbaly/src/views/components/QuotationPanel.tsx`
  - Changed slider range from `min="10" max="200" step="10"` to `min="1" max="1000" step="1"`
  - Updated slider labels from "10% / 100% / 200%" to "1 / 500 / 1000"
  - Removed "%" from scale display (now shows "Scale: 100" instead of "Scale: 100%")

### 3. Enhanced Color Picker UI

Added predefined color palette with 9 color options:

```typescript
const COLOR_OPTIONS = [
  { name: 'Navy Blue', rgb: [30, 58, 95] },
  { name: 'Olive Green', rgb: [107, 124, 63] },
  { name: 'Coral Red', rgb: [255, 99, 71] },
  { name: 'Sky Blue', rgb: [135, 206, 235] },
  { name: 'Forest Green', rgb: [34, 139, 34] },
  { name: 'Sunset Orange', rgb: [255, 140, 0] },
  { name: 'Royal Purple', rgb: [102, 51, 153] },
  { name: 'Crimson', rgb: [220, 20, 60] },
  { name: 'Teal', rgb: [0, 128, 128] },
];
```

#### UI Features:
- 3x3 grid of color swatches
- Visual selection indicator (blue dot on selected color)
- Hover effects on color buttons
- RGB value display below color grid
- Converts RGB to hex for display purposes

### 4. Updated Quote Display

**QuoteReadyPanel** now shows:
- Scale as raw number: "Scale: 100" (instead of "100% scale")
- Color as RGB values: "RGB(30, 58, 95)" with color swatch
- Color swatch uses hex conversion for CSS display

## API Payload Structure (Updated)

```json
{
  "itemType": "Design",
  "itemRefId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "quantity": 1,
  "printingProperties": {
    "material": "PLA",
    "color": [30, 58, 95],
    "scale": 100,
    "preset": "normal",
    "customFields": [
      { "key": "printTime", "value": "120" },
      { "key": "weight", "value": "45.5" },
      { "key": "gcodeUrl", "value": "https://..." }
    ]
  }
}
```

## Key Differences from Previous Version

| Field | Before | After |
|-------|--------|-------|
| `color` | `"#1e3a5f"` (hex string) | `[30, 58, 95]` (RGB array) |
| `scale` | `1.0` (decimal, 100% = 1.0) | `100` (integer, 1-1000) |
| Scale UI | 10-200% with 10% steps | 1-1000 with 1 step |
| Color UI | Color picker + hex input | Predefined color palette |

## Testing Checklist

- [x] TypeScript compilation passes
- [x] Build completes successfully
- [ ] Test color selection in quotation panel
- [ ] Test scale slider (1-1000 range)
- [ ] Verify RGB color is sent to backend correctly
- [ ] Verify scale value is sent as integer (not decimal)
- [ ] Test "Add to Cart" with new payload structure
- [ ] Verify quote display shows RGB values correctly
- [ ] Test color swatch display in quote panel

## Backend Validation Requirements

The backend should now expect:
- `color`: Array of 3 integers [r, g, b] where each value is 0-255
- `scale`: Integer between 1 and 1000
- `material`: One of "PLA", "ABS", "PETG", "TPU", "Resin"
- `preset`: One of "heavy", "normal", "draft"

## Notes

- RGB values are validated by TypeScript type system
- Scale slider enforces 1-1000 range in UI
- Color palette provides consistent color options
- Hex conversion is only used for CSS display, not for API
- All color operations use RGB internally
