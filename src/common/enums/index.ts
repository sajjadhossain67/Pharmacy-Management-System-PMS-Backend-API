export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  CASHIER = 'cashier',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum MedicineStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export enum MedicineType {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  SYRUP = 'syrup',
  INJECTION = 'injection',
  CREAM = 'cream',
  OINTMENT = 'ointment',
  DROPS = 'drops',
  INHALER = 'inhaler',
  PATCH = 'patch',
  SUPPOSITORY = 'suppository',
  OTHER = 'other',
}

export enum StockMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
}

export enum StockMovementDirection {
  IN = 'in',
  OUT = 'out',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
  INSURANCE = 'insurance',
  CREDIT = 'credit',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PrescriptionStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  DISPENSED = 'dispensed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum NotificationType {
  LOW_STOCK = 'low_stock',
  EXPIRY_ALERT = 'expiry_alert',
  PURCHASE_ORDER = 'purchase_order',
  SALE = 'sale',
  SYSTEM = 'system',
  PAYMENT = 'payment',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SOFT_DELETE = 'soft_delete',
  RESTORE = 'restore',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
}

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
