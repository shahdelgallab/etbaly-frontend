You are building a complete full-stack web application called **Etbaly** — a 3D printing e-commerce platform for a graduation project. Follow every instruction precisely.

---

## TECH STACK
- React 18 + TypeScript + Vite
- MVVM Architecture (Models / ViewModels as hooks / Views as components / Services for API)
- Tailwind CSS v3 with CSS variables for theming
- Zustand for global state (cart, auth, theme)
- React Router v6
- Framer Motion for animations
- React Hook Form + Zod for validation
- Three.js + @react-three/fiber + @react-three/drei for 3D rendering
- @google/model-viewer for embedded 3D model display
- Lucide React for icons
- Axios for HTTP
- Fonts: Orbitron (headings) + Exo 2 (body) from Google Fonts

---

## THEME & DESIGN
- Technology and 3D printing aesthetic
- Color palette: blue dominant — primary #3b82f6, accent #00d4ff, deep #1e3a8a
- Light mode: white/blue-tinted surfaces, subtle circuit-board SVG background texture
- Dark mode: near-black #050d1a surfaces with glowing blue borders
- CSS variables for ALL colors — never hardcode hex in components
- Glassmorphism cards, glowing hover states, blueprint-shimmer loading skeletons
- Futuristic feel: Orbitron font for headings, glow effects on interactive elements
- All transitions via Framer Motion (fade-up on page enter, scale on hover)

---

## ARCHITECTURE — STRICT MVVM
```
src/
├── models/          # TypeScript interfaces only
├── viewmodels/      # Custom hooks — all logic, no JSX
├── views/
│   ├── pages/       # Page components — layout + composition only
│   └── components/  # Reusable UI components
├── services/        # Axios API calls
└── store/           # Zustand stores (cart, auth, theme)
```
Rule: Zero business logic in views. Zero JSX in viewmodels.

---

## GLOBAL STORES (Zustand)
- **cartStore**: items[], isOpen, addItem(), removeItem(), updateQty(), clearCart(), openCart(), closeCart()
- **authStore**: user, token, setUser(), clearUser() — persisted in localStorage
- **themeStore**: theme ('light'|'dark'), toggleTheme() — persisted in localStorage, syncs data-theme attr on 

---

## FIXED NAVBAR — on every page
Layout: [Logo ETBALY] [Home] [Collections] [AI Chatbot] [Upload] [search icon] [theme toggle] [cart icon + badge] [avatar or Sign In]
- Orbitron font logo with animated blue underline
- Active route gets glowing blue underline indicator
- Cart icon shows item count badge from cartStore
- Backdrop blur + bottom border appears on scroll
- Mobile: hamburger → slide-down drawer
- ThemeToggle: sun/moon icon using themeStore.toggleTheme()

---

## FIXED FOOTER — on every page
- Logo + tagline: "Print the future. Today."
- Navigation links: Home, Collections, AI Chatbot, Upload, Profile
- Social icons (GitHub, Twitter, LinkedIn)
- Blueprint grid CSS background texture
- Copyright line

---

## THEME TOGGLE BUTTON
- Floating button fixed bottom-right on every page
- Also embedded in Navbar
- Toggles data-theme="dark" / "light" on 
- Persisted in localStorage via themeStore
- Framer Motion: sun rotates in, moon fades in

---

## PAGES

### 1. Landing Page  /
- Hero: animated 3D-print nozzle SVG, headline "Print the Future. Today.", two CTAs → /products and /chat
- Featured collections grid (4 cards with glow hover)
- "How it works" 3-step section with icons
- Stats bar: total models, happy customers, materials available
- Scroll-triggered animations with Framer Motion whileInView

### 2. Sign In Page  /signin
- Centered glassmorphism card
- Email + password fields (RHF + Zod validation)
- "Remember me" toggle
- Link to /signup
- OAuth placeholders (Google, GitHub)
- Error shake animation
- On success → redirect to previous route or /

### 3. Sign Up Page  /signup
- Full name, email, password, confirm password
- Password strength indicator bar
- Terms checkbox
- On submit → useAuthViewModel.register() → auto sign in → redirect /

### 4. Products Page  /products
- Search bar top — debounced 300ms, filters products by name/tags
- Filter panel (sidebar on desktop, drawer on mobile):
  - Collections checkboxes: Home Decor, Mechanical Parts, Art & Sculptures, Jewelry, Architecture
  - Material checkboxes: PLA, ABS, PETG, Resin, TPU, Nylon
  - Price range slider
  - Sort: Newest, Price Low–High, Most Popular
- Responsive product grid (1→2→3→4 cols)
- ProductCard: image, name, material badge, price, "Add to Cart" button with + animation
- All filtering is client-side inside useProductsViewModel

### 5. Chat Page  /chat  [protected]
This is the core feature. Managed by useChatViewModel with a chatStep state: 'input' | 'confirm' | 'done'

STEP 1 — input:
- Chat bubble UI (user bubbles right, AI bubbles left)
- Input bar at bottom:
  - Text field
  - Image upload button (jpg/png/webp) with preview thumbnail
  - Send button
- On send → call AI service → set chatStep to 'confirm'

STEP 2 — confirm:
- AI response bubble contains an embedded  component showing a .glb 3D model
- ModelViewer has orbit controls, auto-rotate, environment lighting
- Below viewer: two buttons:
  - "Yes, this is it!" → confirmModel() → opens CartSidebar → set chatStep to 'done'
  - "Not quite, try again" → reset to chatStep 'input', focus input with placeholder "Describe it differently…"

STEP 3 — CartSidebar opens:
- Slides in from right (Framer Motion x: "100%" → 0)
- Shows confirmed model: thumbnail, name, qty, price
- Subtotal
- "Checkout" button → navigate to /checkout
- "Continue Chatting" button → close sidebar, reset chat

### 6. Upload Page  /upload  [protected]
- Drag-and-drop zone accepting .stl, .obj, .glb, .gltf (max 50MB)
- File type + size validation
- After upload: 3D preview renders in 
- Form fields: Model Name, Material selector, Color picker, Quantity, Price
- "Add to Cart" button → cartStore.addItem() → CartSidebar opens

### 7. Cart Sidebar  (global component, not a page)
- Controlled by cartStore.isOpen
- Accessible from Navbar cart icon from any page
- List of CartItems: thumbnail, name, qty stepper (+/–), remove, line price
- Subtotal + estimated shipping
- "Checkout →" button → navigate to /checkout

### 8. Checkout Page  /checkout  [protected]
3-step progress bar: Shipping → Payment → Review
- Step 1 Shipping: full name, address, city, country, postal code (RHF + Zod)
- Step 2 Payment: card number (masked), expiry, CVV, OR "Cash on Delivery" toggle
- Step 3 Review: full order summary, items, total, "Place Order" button
- On success: animated checkmark screen + order number + "Back to Home" button

### 9. Profile Page  /profile  [protected]
- Clickable avatar upload
- Edit: display name, email, phone, address
- Order history table: ID, date, status badge, total, "View" button
- Saved models section
- Change password section (current, new, confirm)
- Delete account with confirmation modal

---

## MODELS (TypeScript interfaces in src/models/)

```typescript
// User.ts
interface User { id: string; name: string; email: string; avatarUrl?: string; address?: Address; createdAt: Date; }

// Product.ts
type MaterialType = 'PLA' | 'ABS' | 'PETG' | 'Resin' | 'TPU' | 'Nylon';
type CollectionType = 'Home Decor' | 'Mechanical Parts' | 'Art & Sculptures' | 'Jewelry' | 'Architecture';
interface Product { id: string; name: string; description: string; imageUrl: string; modelUrl?: string; price: number; material: MaterialType; collection: CollectionType; tags: string[]; rating: number; stock: number; }

// CartItem.ts
interface CartItem { id: string; product: Product; quantity: number; customModelUrl?: string; }

// ChatMessage.ts
interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; imageUrl?: string; modelUrl?: string; confirmed?: boolean; timestamp: Date; }

// Order.ts
interface Order { id: string; userId: string; items: CartItem[]; shipping: Address; total: number; status: 'pending'|'processing'|'shipped'|'delivered'; createdAt: Date; }
```

---

## VIEWMODELS (custom hooks, no JSX)
- useAuthViewModel — login, register, logout, updateProfile
- useProductsViewModel — products state, search, filters, sort (all client-side)
- useCartViewModel — wraps cartStore, exposes totalItems and subtotal
- useChatViewModel — messages state, chatStep, sendMessage(text?, image?), confirmModel(), rejectModel()
- useUploadViewModel — file state, preview, validation, addToCart
- useProfileViewModel — profile editing, order history, avatar upload, password change

---

## 3D MODEL VIEWER COMPONENT
File: src/views/components/ModelViewer.tsx
Props: modelUrl: string, autoRotate?: boolean, height?: string
- Use @react-three/fiber canvas with OrbitControls and Environment from @react-three/drei
- Loading state: blueprint shimmer skeleton
- Error state: "Model unavailable" message with retry
- Lazy loaded via React.lazy() + Suspense to avoid blocking page render

---

## ROUTING in App.tsx
```
/ → LandingPage
/signin → SignInPage
/signup → SignUpPage
/products → ProductsPage
/chat → ProtectedRoute → ChatPage
/upload → ProtectedRoute → UploadPage
/checkout → ProtectedRoute → CheckoutPage
/profile → ProtectedRoute → ProfilePage
* → Navigate to /
```
CartSidebar rendered globally in App.tsx, outside Routes, controlled by cartStore.

---

## INSTALL COMMANDS
```bash
npm create vite@latest etbaly -- --template react-ts
cd etbaly
npm install react-router-dom zustand framer-motion axios react-hook-form zod @hookform/resolvers lucide-react
npm install @react-three/fiber @react-three/drei three @types/three
npm install @google/model-viewer
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npx tailwindcss init -p
```

---

## CONSTRAINTS
1. No business logic in view components — all in viewmodels
2. No direct API calls in components — always service → viewmodel → view
3. All colors via CSS variables — never hardcode
4. TypeScript strict mode — no `any`
5. Mobile-first responsive — test at 375px, 768px, 1280px
6. All interactive elements: aria-label, keyboard navigable
7. ModelViewer always lazy loaded