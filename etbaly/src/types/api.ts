// ─── Standard API envelope ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  data?: { errors: { field: string; message: string }[] };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Backend User shape ───────────────────────────────────────────────────────

export interface ApiProfile {
  firstName:  string;
  lastName:   string;
  phoneNumber?: string;
  bio?:         string;
  avatarUrl?:   string;
  avatarDriveFileId?: string;
}

export interface ApiAddress {
  _id?:    string;   // present when stored in savedAddresses
  street:  string;
  city:    string;
  country: string;
  zip:     string;
}

export interface ApiUser {
  _id:             string;
  email:           string;
  role:            'client' | 'admin' | 'operator';
  isVerified:      boolean;
  profile:         ApiProfile;
  savedAddresses:  ApiAddress[];   // top-level, not inside profile
  createdAt:       string;
  updatedAt?:      string;
}

// ─── PATCH /users/me request body ────────────────────────────────────────────

export interface UpdateMePayload {
  firstName?:      string;
  lastName?:       string;
  phoneNumber?:    string;
  bio?:            string;
  avatarUrl?:      string;
  savedAddresses?: ApiAddress[];
}

// ─── Auth responses ───────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export interface AuthData {
  user:         ApiUser;
  accessToken:  string;
  refreshToken: string;
}

export interface RegisterData {
  user: ApiUser;
}

// ─── Backend Product shape ────────────────────────────────────────────────────

export interface ApiProduct {
  _id:              string;
  name:             string;
  description?:     string;
  images:           string[];
  currentBasePrice: number;
  isActive:         boolean;
  stockLevel:       number;
  linkedDesignId?:  string;
  createdAt:        string;
  updatedAt?:       string;
}

// ─── Backend Design shape ─────────────────────────────────────────────────────

export type ApiMaterialType = 'PLA' | 'ABS' | 'Resin' | 'TPU' | 'PETG';

export interface ApiDesign {
  _id:         string;
  name:        string;
  isPrintable: boolean;
  fileUrl:     string;
  ownerId:     string;
  metadata: {
    volumeCm3:           number;
    dimensions:          { x: number; y: number; z: number };
    estimatedPrintTime:  number;
    supportedMaterials:  ApiMaterialType[];
  };
  createdAt:  string;
  updatedAt?: string;
}

// ─── Backend Cart shape ───────────────────────────────────────────────────────

export interface ApiCustomization {
  color?:             string;
  infillPercentage?:  number;
  layerHeight?:       number;
  scale?:             number;
  customFields?:      Record<string, unknown>;
  materialId?:        string;
}

export interface ApiCartItem {
  _id:           string;
  itemType:      'Product' | 'Design';
  itemRefId:     string;
  quantity:      number;
  unitPrice:     number;
  customization?: ApiCustomization;
}

export interface ApiPricingSummary {
  subtotal:       number;
  taxAmount:      number;
  shippingCost:   number;
  discountAmount: number;
  total:          number;
}

export interface ApiCart {
  _id:            string;
  userId:         string;
  items:          ApiCartItem[];
  pricingSummary: ApiPricingSummary;
  expiresAt:      string;
}

// ─── Backend Order shape ──────────────────────────────────────────────────────

export type ApiOrderStatus    = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type ApiPaymentMethod  = 'Card' | 'Wallet' | 'COD';
export type ApiPaymentStatus  = 'Pending' | 'Paid' | 'Failed';
export type ApiItemStatus     = 'Queued' | 'Printing' | 'Ready';

export interface ApiOrderItem {
  _id:           string;
  itemType:      'Product' | 'Design';
  itemRefId:     string;
  quantity:      number;
  price:         number;
  status:        ApiItemStatus;
  customization?: ApiCustomization;
  materialId?:   string;
}

export interface ApiOrder {
  _id:         string;
  orderNumber: string;
  status:      ApiOrderStatus;
  items:       ApiOrderItem[];
  shippingAddressSnapshot: ApiAddress;
  paymentInfo: {
    method:        ApiPaymentMethod;
    status:        ApiPaymentStatus;
    amountPaid:    number;
    transactionId?: string;
    paidAt?:       string;
  };
  pricingSummary: ApiPricingSummary;
  userId:      string;
  createdAt:   string;
  updatedAt?:  string;
}

// ─── Pagination wrapper ───────────────────────────────────────────────────────

export interface PaginatedData<T> {
  results: T[];
  total:   number;
  page:    number;
  limit:   number;
}
