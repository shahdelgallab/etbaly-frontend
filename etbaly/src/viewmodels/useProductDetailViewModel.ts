import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { designService } from '../services/designService';
import { useCartStore } from '../store/cartStore';
import type { Product, MaterialType, PrintQuality } from '../models/Product';
import type { ApiProduct } from '../types/api';

// ─── Map API product → local Product ─────────────────────────────────────────

function mapApiToProduct(p: ApiProduct): Product {
  return {
    id:          p._id,
    name:        p.name,
    description: p.description ?? '',
    imageUrl:    p.images[0] ?? '',
    gallery:     p.images.slice(1),
    price:       p.currentBasePrice,
    material:    'PLA',
    collection:  'Home Decor',
    tags:        [],
    rating:      0,
    reviewCount: 0,
    stock:       p.stockLevel,
    isFeatured:  false,
    isActive:    p.isActive,
    createdAt:   new Date(p.createdAt),
  };
}

// ─── Pricing multipliers ──────────────────────────────────────────────────────

export const MATERIAL_MULTIPLIERS: Record<MaterialType, number> = {
  PLA:   1.00,
  ABS:   1.10,
  PETG:  1.15,
  Resin: 1.60,
  TPU:   1.25,
  Nylon: 1.40,
};

export const QUALITY_MULTIPLIERS: Record<PrintQuality, number> = {
  draft:    0.80,
  standard: 1.00,
  high:     1.35,
  ultra:    1.75,
};

// Size scale: 50% → 200% in 25% steps
export const SIZE_OPTIONS = [50, 75, 100, 125, 150, 175, 200] as const;
export type SizePercent = typeof SIZE_OPTIONS[number];

const SIZE_MULTIPLIERS: Record<SizePercent, number> = {
  50:  0.55,
  75:  0.75,
  100: 1.00,
  125: 1.30,
  150: 1.65,
  175: 2.05,
  200: 2.50,
};

// Mock data (same as useProductsViewModel — in production both would call the same service)
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Geometric Vase', description: 'Modern low-poly vase with sharp geometric facets. Perfect as a centrepiece or shelf accent. Printed with precision layer-by-layer to achieve crisp edges and a smooth finish.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', price: 29.99, material: 'PLA', collection: 'Home Decor', tags: ['vase', 'geometric', 'modern', 'decor'], rating: 4.5, reviewCount: 38, stock: 15, isFeatured: true, isActive: true, printTimeHours: 6, dimensions: { width: 80, height: 200, depth: 80, unit: 'mm' }, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Gear Assembly Kit', description: 'Precision interlocking gear set for robotics and mechanical prototyping projects. Each gear is dimensionally accurate to within 0.1mm.', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', price: 49.99, material: 'ABS', collection: 'Mechanical Parts', tags: ['gears', 'mechanical', 'engineering', 'robotics'], rating: 4.8, reviewCount: 62, stock: 8, isFeatured: true, isActive: true, printTimeHours: 10, createdAt: new Date('2024-02-10') },
  { id: '3', name: 'Dragon Sculpture', description: 'Highly detailed articulated dragon with movable joints. A showpiece for any collection. Printed in high-resolution resin for maximum detail.', imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', price: 89.99, material: 'Resin', collection: 'Art & Sculptures', tags: ['dragon', 'art', 'sculpture', 'fantasy'], rating: 4.9, reviewCount: 91, stock: 5, isFeatured: true, isActive: true, printTimeHours: 18, createdAt: new Date('2024-03-05') },
  { id: '4', name: 'Lattice Ring', description: 'Elegant open-lattice ring with a futuristic aesthetic. Available in multiple sizes. Lightweight yet strong thanks to the optimised lattice structure.', imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', price: 19.99, material: 'Nylon', collection: 'Jewelry', tags: ['ring', 'jewelry', 'lattice', 'fashion'], rating: 4.3, reviewCount: 27, stock: 20, isFeatured: false, isActive: true, printTimeHours: 2, createdAt: new Date('2024-01-20') },
  { id: '5', name: 'City Block Model', description: 'Architectural 1:500 scale city block with detailed building facades and street layout. Ideal for urban planning presentations.', imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', price: 129.99, material: 'PLA', collection: 'Architecture', tags: ['city', 'architecture', 'model', 'urban'], rating: 4.7, reviewCount: 44, stock: 3, isFeatured: true, isActive: true, printTimeHours: 24, dimensions: { width: 300, height: 60, depth: 300, unit: 'mm' }, createdAt: new Date('2024-02-28') },
  { id: '6', name: 'Flexible Phone Stand', description: 'Adjustable multi-angle phone holder with a non-slip base. Works with all phone sizes. The TPU material provides natural grip.', imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800', price: 14.99, material: 'TPU', collection: 'Home Decor', tags: ['phone', 'stand', 'flexible', 'desk'], rating: 4.2, reviewCount: 115, stock: 30, isFeatured: false, isActive: true, printTimeHours: 3, createdAt: new Date('2024-03-15') },
  { id: '7', name: 'Miniature Eiffel Tower', description: 'Faithful 1:1000 replica of the Eiffel Tower with intricate lattice ironwork detail. A classic desk ornament.', imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', price: 39.99, material: 'PLA', collection: 'Architecture', tags: ['eiffel', 'paris', 'miniature', 'landmark'], rating: 4.6, reviewCount: 53, stock: 12, isFeatured: false, isActive: true, printTimeHours: 8, createdAt: new Date('2024-01-30') },
  { id: '8', name: 'PETG Bracket Set', description: 'Industrial-grade mounting brackets for shelving, electronics, and workshop use. PETG provides excellent strength and heat resistance.', imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', price: 24.99, material: 'PETG', collection: 'Mechanical Parts', tags: ['bracket', 'industrial', 'mounting', 'hardware'], rating: 4.4, reviewCount: 78, stock: 25, isFeatured: false, isActive: true, printTimeHours: 4, createdAt: new Date('2024-02-15') },
  { id: '9', name: 'Resin Pendant Necklace', description: 'Delicate geometric pendant with a polished resin finish. Includes a 60cm chain. Each piece is hand-finished for a flawless surface.', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800', price: 34.99, material: 'Resin', collection: 'Jewelry', tags: ['necklace', 'pendant', 'jewelry', 'resin'], rating: 4.6, reviewCount: 31, stock: 18, isFeatured: false, isActive: true, printTimeHours: 3, createdAt: new Date('2024-03-20') },
  { id: '10', name: 'Desk Organiser', description: 'Modular desk organiser with slots for pens, cards, and small gadgets. Stackable design lets you build the configuration you need.', imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800', price: 22.99, material: 'PLA', collection: 'Home Decor', tags: ['desk', 'organiser', 'office', 'storage'], rating: 4.1, reviewCount: 89, stock: 22, isFeatured: false, isActive: true, printTimeHours: 7, createdAt: new Date('2024-04-01') },
  { id: '11', name: 'Nylon Hinge Set', description: 'Flexible living-hinge set for enclosures and prototype assemblies. Nylon provides thousands of flex cycles without fatigue.', imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800', price: 18.99, material: 'Nylon', collection: 'Mechanical Parts', tags: ['hinge', 'flexible', 'enclosure', 'prototype'], rating: 4.3, reviewCount: 22, stock: 0, isFeatured: false, isActive: true, printTimeHours: 2, createdAt: new Date('2024-03-10') },
  { id: '12', name: 'Abstract Wall Art', description: 'Layered abstract wall panel with a depth-illusion design. Mounts flush to any wall. The multi-layer construction creates a striking 3D shadow effect.', imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', price: 74.99, material: 'PLA', collection: 'Art & Sculptures', tags: ['wall', 'art', 'abstract', 'decor'], rating: 4.7, reviewCount: 47, stock: 7, isFeatured: true, isActive: true, printTimeHours: 14, createdAt: new Date('2024-02-05') },
];

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useProductDetailViewModel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct]       = useState<Product | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [modelUrl, setModelUrl]     = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  // Customisation state
  const [material, setMaterial]     = useState<MaterialType>('PLA');
  const [quality, setQuality]       = useState<PrintQuality>('standard');
  const [size, setSize]             = useState<SizePercent>(100);
  const [quantity, setQuantity]     = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { addItem, openCart } = useCartStore();

  // Load product
  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
      setModelUrl(null);

      try {
        const apiProduct = await productService.getById(id);
        const p = mapApiToProduct(apiProduct);
        setProduct(p);
        setMaterial(p.material);
        
        console.log('[ProductDetail] Product loaded:', apiProduct);
        console.log('[ProductDetail] Linked design ID:', apiProduct.linkedDesignId);
        
        // Fetch linked design for 3D model URL
        if (apiProduct.linkedDesignId) {
          setModelLoading(true);
          try {
            const design = await designService.getById(apiProduct.linkedDesignId);
            console.log('[ProductDetail] Design loaded:', design);
            console.log('[ProductDetail] Model URL:', design.fileUrl);
            setModelUrl(design.fileUrl);
          } catch (err) {
            console.error('[ProductDetail] Failed to load design:', err);
            setModelUrl(null);
          } finally {
            setModelLoading(false);
          }
        } else {
          console.warn('[ProductDetail] No linkedDesignId found');
        }
      } catch (err) {
        console.error('[ProductDetail] Failed to load product:', err);
        const mock = MOCK_PRODUCTS.find(p => p.id === id);
        if (mock) { 
          setProduct(mock); 
          setMaterial(mock.material);
          console.log('[ProductDetail] Using mock product:', mock);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Handle case where no ID is provided
  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
    }
  }, [id]);

  // Computed price
  const computedPrice = useMemo(() => {
    if (!product) return 0;
    return product.price
      * MATERIAL_MULTIPLIERS[material]
      * QUALITY_MULTIPLIERS[quality]
      * SIZE_MULTIPLIERS[size];
  }, [product, material, quality, size]);

  // Computed print time
  const computedPrintTime = useMemo(() => {
    if (!product?.printTimeHours) return null;
    return Math.round(product.printTimeHours * SIZE_MULTIPLIERS[size] * QUALITY_MULTIPLIERS[quality]);
  }, [product, size, quality]);

  const addToCart = () => {
    if (!product) return;
    // Build a customised product snapshot
    const customised: Product = {
      ...product,
      material,
      price: computedPrice,
      printQuality: quality,
    };
    addItem(customised, quantity);
    openCart();
  };

  const goBack = () => navigate(-1);

  const images = product
    ? [product.imageUrl, ...(product.gallery ?? [])].filter(Boolean)
    : [];

  return {
    product,
    loading,
    notFound,
    modelUrl,
    modelLoading,
    material,  setMaterial,
    quality,   setQuality,
    size,      setSize,
    quantity,  setQuantity,
    activeImage, setActiveImage,
    computedPrice,
    computedPrintTime,
    images,
    addToCart,
    goBack,
  };
}
