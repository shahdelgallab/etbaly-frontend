# Cart API Integration - Complete

## Summary
Successfully integrated the backend cart API endpoints into the AI chat flow. Users can now generate 3D models, select printing options (material, quality, scale, color), get a quotation, and add items to their cart using the backend API.

## Changes Made

### 1. Updated Cart Service (`etbaly/src/services/cartService.ts`)
- **Changed**: Updated payload structure to match backend API documentation
- **Before**: Used `customization` and `materialId` fields
- **After**: Uses `printingProperties` object with:
  - `material`: 'PLA' | 'ABS' | 'PETG' | 'TPU' | 'Resin'
  - `color`: hex color code (optional)
  - `scale`: decimal number (optional, e.g., 1.0 for 100%)
  - `preset`: 'heavy' | 'normal' | 'draft' (optional)
  - `customFields`: array of key-value pairs (optional)
- **Changed**: Updated `CheckoutPayload` to use inline `shippingAddress` object instead of `shippingAddressId`

### 2. Updated Chat ViewModel (`etbaly/src/viewmodels/useChatViewModel.ts`)
- **Added**: Import for `cartService`
- **Removed**: Import for `Product` and `MaterialType` (no longer needed)
- **Removed**: `addItem` from Zustand store (now using backend API)
- **Updated**: `confirmModel()` function to:
  - Call `cartService.addItem()` with proper payload structure
  - Use `itemType: 'Design'` and `itemRefId: designId`
  - Convert scale from percentage (100) to decimal (1.0)
  - Pass printing properties: material, color, scale, preset
  - Store quotation data in `customFields` for reference
  - Handle async operation with loading states
  - Show error messages if API call fails

### 3. Fixed Chat Page (`etbaly/src/views/pages/ChatPage.tsx`)
- **Fixed**: `QuoteReadyPanel` prop name from `onRegenerate` to `onBackToOptions`
- This allows users to go back and change their printing options after seeing the quote

### 4. Updated Checkout ViewModel (`etbaly/src/viewmodels/useCheckoutViewModel.ts`)
- **Fixed**: Changed `cartService.checkout()` call to use inline `shippingAddress` object
- **Before**: `{ shippingAddressId: addressId, paymentMethod }`
- **After**: `{ shippingAddress: newAddress, paymentMethod }`
- Matches backend API expectation for full address object

### 5. Updated Upload ViewModel (`etbaly/src/viewmodels/useUploadViewModel.ts`)
- **Fixed**: Changed cart item payload from `customization` to `printingProperties`
- **Added**: Default printing properties for uploaded designs:
  - `material: 'PLA'`
  - `color: form.color`
  - `scale: 1.0`
  - `preset: 'normal'`

## Complete Flow

1. **User chooses mode**: Text-to-3D or Image-to-3D
2. **Generate image** (text-to-3D only): AI generates image from text prompt
3. **Approve image** (text-to-3D only): User approves or rejects generated image
4. **Generate 3D model**: AI converts image to 3D model
5. **Approve 3D model**: User sees 3D preview and clicks "Get Quotation"
6. **Select options** (`chatStep: 'quotation'`):
   - Material: PLA, ABS, PETG, PLA+, TPU, Nylon
   - Quality: Draft (0.3mm), Normal (0.2mm), Heavy (0.1mm)
   - Scale: 10% - 200%
   - Color: Hex color picker
7. **Get quote** (`chatStep: 'slicing'`): Backend slices the model and calculates:
   - Weight (grams)
   - Dimensions (mm)
   - Print time (minutes)
   - Calculated price ($)
   - G-code URL
8. **Review quote** (`chatStep: 'quote-ready'`): User sees all details and can:
   - **Add to Cart**: Calls backend API to add item with all printing properties
   - **Change Options**: Goes back to step 6 to adjust settings
9. **Done** (`chatStep: 'done'`): Item added to cart, user can checkout or generate another model

## API Payload Example

```json
{
  "itemType": "Design",
  "itemRefId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "quantity": 1,
  "printingProperties": {
    "material": "PLA",
    "color": "#1e3a5f",
    "scale": 1.0,
    "preset": "normal",
    "customFields": [
      { "key": "printTime", "value": "120" },
      { "key": "weight", "value": "45.5" },
      { "key": "width", "value": "50" },
      { "key": "height", "value": "75" },
      { "key": "depth", "value": "30" },
      { "key": "gcodeUrl", "value": "https://..." }
    ]
  }
}
```

## Backend API Endpoints Used

- `POST /api/v1/cart/items` - Add item to cart
- `GET /api/v1/cart` - Get current cart (for CartSidebar)
- `PATCH /api/v1/cart/items/:id` - Update item quantity
- `DELETE /api/v1/cart/items/:id` - Remove item from cart
- `DELETE /api/v1/cart` - Clear entire cart
- `POST /api/v1/cart/checkout` - Create order from cart

## Testing Checklist

- [x] TypeScript compilation passes with no errors
- [x] Build completes successfully
- [ ] Test text-to-3D flow: prompt → image → 3D → options → quote → add to cart
- [ ] Test image-to-3D flow: upload → 3D → options → quote → add to cart
- [ ] Test "Change Options" button to go back and adjust settings
- [ ] Test error handling when API calls fail
- [ ] Verify cart sidebar shows items from backend
- [ ] Test checkout flow with cart items
- [ ] Test upload page with direct file upload

## Next Steps

1. Update `CartSidebar` component to fetch cart from backend API instead of Zustand
2. Add cart sync on page load to fetch existing cart items
3. Add optimistic updates for better UX (update UI immediately, sync with backend)
4. Add cart item count badge on navbar that reflects backend cart
5. Handle cart expiration (backend carts expire after a certain time)

## Notes

- Scale is stored as decimal in backend (1.0 = 100%) but shown as percentage in UI
- Material must be one of the exact strings: "PLA", "ABS", "PETG", "TPU", "Resin"
- Preset must be one of: "heavy", "normal", "draft"
- Color is optional but defaults to navy blue (#1e3a5f)
- Custom fields store additional quotation data for reference
