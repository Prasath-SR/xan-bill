export type DiningMode = "DINE_IN" | "PARCEL";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED";

export type MenuCategory = {
  description: string;
  id: string;
  itemCount: number;
  name: string;
};

export type MenuItem = {
  available: boolean;
  categoryId: string;
  categoryName?: string;
  description: string;
  enabled: boolean;
  gstRate: number;
  id: string;
  image: string;
  isCombo: boolean;
  name: string;
  price: number;
  parcelPrice?: number;
};

export type RestaurantTable = {
  capacity: number;
  id: string;
  name: string;
  reservedFor?: string;
  status: TableStatus;
  zone: string;
};

export type ActiveOrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  gstRate: number;
};

export type ActiveOrder = {
  id: string;
  orderNumber: string;
  diningMode: DiningMode;
  items: ActiveOrderItem[];
  discountAmount: number;
  customerName: string;
  totalAmount: number;
};

export type PosTable = RestaurantTable & {
  activeOrders: ActiveOrder[];
};


export type StaffMember = {
  id: string;
  staffCode: string;
  name: string;
  email: string | null;
  role: string;
  roleEnum: "ADMIN" | "CASHIER";

  performanceNote: string;
  isActive: boolean;
};

export type RevenueChannel = {
  label: string;
  share: number;
  value: number;
};

export type Shortcut = {
  description: string;
  target: string;
  title: string;
};

export type DashboardData = {

  revenueChannels: RevenueChannel[];
  salesSummary: {
    avgOrderTime: number;
    dailyRevenue: number;
    totalOrders: number;
    weeklyGrowth: number;
  };
  shortcuts: Shortcut[];

};

export type ReportCard = {
  description: string;
  period: string;
  title: string;
  value: string;
};

export type SessionUser = {
  id: string;
  name: string;
  role: "ADMIN" | "CASHIER";
  staffCode: string;
  branchId?: string | null;
};

export type ItemSalesData = {
  menuItemId: string;
  name: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
};

export type CompanyProfile = {
  address: string;
  companyName: string;
  email: string;
  fssai: string;
  gstin: string;
  invoiceTitle: string;
  logoUrl: string;
  phone: string;
};
