import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProductsThunk } from '../store/slices/productsSlice';
import type { ApiProduct } from '../types/api';
import type { Product, MaterialType, CollectionType, SortOption } from '../models/Product';

export type { SortOption };

export interface ProductFilters {
  search:      string;
  collections: CollectionType[];
  materials:   MaterialType[];
  priceMin:    number;
  priceMax:    number;
  sort:        SortOption;
  inStockOnly: boolean;
}

const DEFAULT_FILTERS: ProductFilters = {
  search:      '',
  collections: [],
  materials:   [],
  priceMin:    0,
  priceMax:    9999,
  sort:        'newest',
  inStockOnly: false,
};

// ─── Map API product → local Product model ────────────────────────────────────

function mapApiProduct(p: ApiProduct): Product {
  return {
    id:          p._id,
    name:        p.name,
    description: p.description ?? '',
    imageUrl:    p.images[0] ?? '',
    gallery:     p.images.slice(1),
    price:       p.currentBasePrice,
    material:    'PLA',          // API products don't carry material — default
    collection:  'Home Decor',   // API products don't carry collection — default
    tags:        [],
    rating:      0,
    reviewCount: 0,
    stock:       p.stockLevel,
    isFeatured:  false,
    isActive:    p.isActive,
    createdAt:   new Date(p.createdAt),
    updatedAt:   p.updatedAt ? new Date(p.updatedAt) : undefined,
  };
}

// ─── Fallback mock data (used when API is unavailable) ────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Geometric Vase', description: 'Modern low-poly vase with sharp geometric facets.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', price: 29.99, material: 'PLA', collection: 'Home Decor', tags: ['vase', 'geometric', 'modern'], rating: 4.5, reviewCount: 38, stock: 15, isFeatured: true, isActive: true, printTimeHours: 6, dimensions: { width: 80, height: 200, depth: 80, unit: 'mm' }, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Gear Assembly Kit', description: 'Precision interlocking gear set for robotics.', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600', price: 49.99, material: 'ABS', collection: 'Mechanical Parts', tags: ['gears', 'mechanical', 'engineering'], rating: 4.8, reviewCount: 62, stock: 8, isFeatured: true, isActive: true, printTimeHours: 10, createdAt: new Date('2024-02-10') },
  { id: '3', name: 'Dragon Sculpture', description: 'Highly detailed articulated dragon with movable joints.', imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600', price: 89.99, material: 'Resin', collection: 'Art & Sculptures', tags: ['dragon', 'art', 'sculpture'], rating: 4.9, reviewCount: 91, stock: 5, isFeatured: true, isActive: true, printTimeHours: 18, createdAt: new Date('2024-03-05') },
  { id: '4', name: 'Lattice Ring', description: 'Elegant open-lattice ring with a futuristic aesthetic.', imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', price: 19.99, material: 'Nylon', collection: 'Jewelry', tags: ['ring', 'jewelry', 'lattice'], rating: 4.3, reviewCount: 27, stock: 20, isFeatured: false, isActive: true, printTimeHours: 2, createdAt: new Date('2024-01-20') },
  { id: '5', name: 'City Block Model', description: 'Architectural 1:500 scale city block.', imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600', price: 129.99, material: 'PLA', collection: 'Architecture', tags: ['city', 'architecture', 'model'], rating: 4.7, reviewCount: 44, stock: 3, isFeatured: true, isActive: true, printTimeHours: 24, dimensions: { width: 300, height: 60, depth: 300, unit: 'mm' }, createdAt: new Date('2024-02-28') },
  { id: '6', name: 'Flexible Phone Stand', description: 'Adjustable multi-angle phone holder.', imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600', price: 14.99, material: 'TPU', collection: 'Home Decor', tags: ['phone', 'stand', 'flexible'], rating: 4.2, reviewCount: 115, stock: 30, isFeatured: false, isActive: true, printTimeHours: 3, createdAt: new Date('2024-03-15') },
  { id: '7', name: 'Miniature Eiffel Tower', description: 'Faithful 1:1000 replica of the Eiffel Tower.', imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600', price: 39.99, material: 'PLA', collection: 'Architecture', tags: ['eiffel', 'paris', 'miniature'], rating: 4.6, reviewCount: 53, stock: 12, isFeatured: false, isActive: true, printTimeHours: 8, createdAt: new Date('2024-01-30') },
  { id: '8', name: 'PETG Bracket Set', description: 'Industrial-grade mounting brackets.', imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600', price: 24.99, material: 'PETG', collection: 'Mechanical Parts', tags: ['bracket', 'industrial', 'mounting'], rating: 4.4, reviewCount: 78, stock: 25, isFeatured: false, isActive: true, printTimeHours: 4, createdAt: new Date('2024-02-15') },
  { id: '9', name: 'Resin Pendant Necklace', description: 'Delicate geometric pendant with polished resin finish.', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', price: 34.99, material: 'Resin', collection: 'Jewelry', tags: ['necklace', 'pendant', 'jewelry'], rating: 4.6, reviewCount: 31, stock: 18, isFeatured: false, isActive: true, printTimeHours: 3, createdAt: new Date('2024-03-20') },
  { id: '10', name: 'Desk Organiser', description: 'Modular desk organiser with slots for pens and gadgets.', imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600', price: 22.99, material: 'PLA', collection: 'Home Decor', tags: ['desk', 'organiser', 'office'], rating: 4.1, reviewCount: 89, stock: 22, isFeatured: false, isActive: true, printTimeHours: 7, createdAt: new Date('2024-04-01') },
  { id: '11', name: 'Nylon Hinge Set', description: 'Flexible living-hinge set for enclosures.', imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600', price: 18.99, material: 'Nylon', collection: 'Mechanical Parts', tags: ['hinge', 'flexible', 'enclosure'], rating: 4.3, reviewCount: 22, stock: 0, isFeatured: false, isActive: true, printTimeHours: 2, createdAt: new Date('2024-03-10') },
  { id: '12', name: 'Abstract Wall Art', description: 'Layered abstract wall panel with depth-illusion design.', imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600', price: 74.99, material: 'PLA', collection: 'Art & Sculptures', tags: ['wall', 'art', 'abstract'], rating: 4.7, reviewCount: 47, stock: 7, isFeatured: true, isActive: true, printTimeHours: 14, createdAt: new Date('2024-02-05') },
];

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useProductsViewModel() {
  const dispatch     = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { items: apiItems, loading: apiLoading, error: apiError } = useAppSelector(s => s.products);

  const [filters, setFilters] = useState<ProductFilters>(() => ({
    ...DEFAULT_FILTERS,
    search: searchParams.get('q') ?? '',
  }));

  // Fetch from Redux (real API) on mount
  useEffect(() => {
    dispatch(fetchProductsThunk({ limit: 100 }));
  }, [dispatch]);

  // While loading → empty (page shows skeleton)
  // After load with results → use API data
  // After load with no results AND error → fall back to mocks
  // After load with no results and no error → empty (backend has no products yet)
  const allProducts = useMemo<Product[]>(() => {
    if (apiLoading) return [];
    if (apiItems.length > 0) return apiItems.map(mapApiProduct);
    if (apiError) return MOCK_PRODUCTS;   // API unreachable — show demo data
    return [];
  }, [apiItems, apiLoading, apiError]);

  const loading = apiLoading;

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...allProducts.map(p => p.price), 200)),
    [allProducts]
  );

  const filtered = useMemo(() => {
    // Public API already returns only active products.
    // Don't double-filter by isActive to avoid hiding valid results.
    let result = [...allProducts];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.collections.length > 0) result = result.filter(p => filters.collections.includes(p.collection));
    if (filters.materials.length > 0)   result = result.filter(p => filters.materials.includes(p.material));
    result = result.filter(p => p.price >= filters.priceMin && p.price <= filters.priceMax);
    if (filters.inStockOnly) result = result.filter(p => p.stock > 0);

    switch (filters.sort) {
      case 'price-asc':  result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'popular':    result = [...result].sort((a, b) => b.reviewCount - a.reviewCount); break;
      case 'rating':     result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'newest':     result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return result;
  }, [allProducts, filters]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.collections.length) n += filters.collections.length;
    if (filters.materials.length)   n += filters.materials.length;
    if (filters.inStockOnly)        n++;
    if (filters.priceMin > 0 || filters.priceMax < maxPrice) n++;
    return n;
  }, [filters, maxPrice]);

  const setSearch      = (search: string)          => setFilters(f => ({ ...f, search }));
  const setSort        = (sort: SortOption)         => setFilters(f => ({ ...f, sort }));
  const setPriceRange  = (min: number, max: number) => setFilters(f => ({ ...f, priceMin: min, priceMax: max }));
  const setInStockOnly = (v: boolean)               => setFilters(f => ({ ...f, inStockOnly: v }));
  const resetFilters   = ()                         => setFilters(DEFAULT_FILTERS);

  const toggleCollection = (c: CollectionType) =>
    setFilters(f => ({
      ...f,
      collections: f.collections.includes(c) ? f.collections.filter(x => x !== c) : [...f.collections, c],
    }));

  const toggleMaterial = (m: MaterialType) =>
    setFilters(f => ({
      ...f,
      materials: f.materials.includes(m) ? f.materials.filter(x => x !== m) : [...f.materials, m],
    }));

  return {
    products: filtered,
    totalCount: allProducts.length,
    loading,
    filters,
    maxPrice,
    activeFilterCount,
    setSearch,
    setSort,
    setPriceRange,
    setInStockOnly,
    toggleCollection,
    toggleMaterial,
    resetFilters,
  };
}
