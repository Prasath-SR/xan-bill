import { DiningMode, OrderStatus, PaymentMethod, UserRole } from "@prisma/client";
import {
  CompanyProfile,
  DashboardData,
  MenuCategory,
  MenuItem,
  PosTable,
  ReportCard,
  RestaurantTable,
  StaffMember,
} from "@/lib/types";
import { getPrismaClient } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function logServerDataError(scope: string, error: unknown) {
  console.error(`[server-data] ${scope} failed`, error);
}

export async function getActiveBranchId() {
  try {
    const user = await getSessionUser();
    if (!user) return null;
    if (user.branchId) return user.branchId;
    const prisma = getPrismaClient();
    const firstBranch = await prisma.branch.findFirst({ orderBy: { code: "asc" } });
    return firstBranch?.id ?? null;
  } catch (error) {
    logServerDataError("getActiveBranchId", error);
    return null;
  }
}

const defaultCompanyProfile: CompanyProfile = {
  companyName: "Xan Bill",
  address: "Your restaurant address",
  gstin: "",
  fssai: "",
  phone: "",
  email: "",
  logoUrl: "",
  invoiceTitle: "TAX INVOICE",
};

const shortcuts: DashboardData["shortcuts"] = [
  {
    title: "Open quick bill",
    description: "Jump straight into the POS for rush-hour billing.",
    target: "/billing",
  },

  {
    title: "See today’s reports",
    description: "Open operational sales, tax, and cancellation summaries.",
    target: "/reports",
  },
];

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function asNumber(value: { toNumber?: () => number } | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return 0;
}

function formatDiningMode(mode: DiningMode) {
  if (mode === "DINE_IN") return "Dine-in";
  if (mode === "PARCEL") return "Parcel";
  return "Parcel";
}

function formatRole(role: UserRole): StaffMember["role"] {
  if (role === "ADMIN") return "Admin";
  return "Cashier";
}


export async function getDashboardData(): Promise<DashboardData> {
  try {
    const prisma = getPrismaClient();
    const today = startOfToday();
    const previousWeekStart = daysAgo(14);
    const currentWeekStart = daysAgo(7);
    const branchId = await getActiveBranchId();
    const branchFilter = branchId ? { branchId } : {};

    const [todaysOrders, previousWeekOrders, currentWeekOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: today }, ...branchFilter },
        select: {
          id: true,
          orderNumber: true,
          diningMode: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          table: { select: { name: true } },
          items: {
            select: { quantity: true, menuItem: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: previousWeekStart, lt: currentWeekStart }, ...branchFilter },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: currentWeekStart }, ...branchFilter },
        select: { totalAmount: true },
      }),
    ]);

    const dailyRevenue = todaysOrders.reduce((sum, order) => sum + asNumber(order.totalAmount), 0);
    const avgOrderTime =
      todaysOrders.length > 0
        ? Math.round(
            todaysOrders.reduce((sum, order) => {
              const duration = order.updatedAt.getTime() - order.createdAt.getTime();
              return sum + Math.max(1, Math.round(duration / 60000));
            }, 0) / todaysOrders.length,
          )
        : 0;

    const previousRevenue = previousWeekOrders.reduce(
      (sum, order) => sum + asNumber(order.totalAmount),
      0,
    );
    const currentRevenue = currentWeekOrders.reduce(
      (sum, order) => sum + asNumber(order.totalAmount),
      0,
    );
    const weeklyGrowth =
      previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;

    const revenueChannels = (["DINE_IN", "PARCEL"] as const).map((mode) => {
      const value = todaysOrders
        .filter((order) => order.diningMode === mode)
        .reduce((sum, order) => sum + asNumber(order.totalAmount), 0);

      return {
        label: formatDiningMode(mode),
        value,
        share: dailyRevenue > 0 ? Math.round((value / dailyRevenue) * 100) : 0,
      };
    });

    return {
      salesSummary: {
        dailyRevenue,
        totalOrders: todaysOrders.length,
        weeklyGrowth,
        avgOrderTime,
      },
      shortcuts,
      revenueChannels,
    };
  } catch (error) {
    logServerDataError("getDashboardData", error);
    return {
      salesSummary: {
        dailyRevenue: 0,
        totalOrders: 0,
        weeklyGrowth: 0,
        avgOrderTime: 0,
      },
      shortcuts,
      revenueChannels: [
        { label: "Dine-in", value: 0, share: 0 },
        { label: "Parcel", value: 0, share: 0 },
      ],
    };
  }
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  try {
    const prisma = getPrismaClient();
    const profile = await prisma.companyProfile.findUnique({
      where: { code: "default" },
    });

    const branchId = await getActiveBranchId();
    const branch = branchId ? await prisma.branch.findUnique({ where: { id: branchId } }) : null;

    if (!profile) {
      return defaultCompanyProfile;
    }

    return {
      companyName: profile.companyName,
      address: branch?.address || profile.address,
      gstin: profile.gstin ?? "",
      fssai: profile.fssai ?? "",
      phone: (branch?.phone || profile.phone) ?? "",
      email: profile.email ?? "",
      logoUrl: profile.logoUrl ?? "",
      invoiceTitle: profile.invoiceTitle,
    };
  } catch (error) {
    logServerDataError("getCompanyProfile", error);
    return defaultCompanyProfile;
  }
}

export async function getMenuPageData() {
  try {
    const prisma = getPrismaClient();
    const categories = await prisma.category.findMany({
      include: { menuItems: true },
      orderBy: { name: "asc" },
    });

    const mappedCategories: MenuCategory[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      itemCount: category.menuItems.length,
    }));

    const mappedItems: MenuItem[] = categories.flatMap((category) =>
      category.menuItems.map((item) => ({
        id: item.id,
        categoryId: category.id,
        categoryName: category.name,
        name: item.name,
        description: item.description ?? "",
        price: asNumber(item.price),
        parcelPrice: item.parcelPrice ? asNumber(item.parcelPrice) : undefined,
        gstRate: asNumber(item.gstRate),
        enabled: item.isEnabled,
        available: item.isAvailable,
        isCombo: item.isCombo,
        image: item.imageUrl ?? "",
      })),
    );

    return { categories: mappedCategories, items: mappedItems };
  } catch (error) {
    logServerDataError("getMenuPageData", error);
    return { categories: [], items: [] };
  }
}


export async function getTablesPageData(): Promise<RestaurantTable[]> {
  try {
    const prisma = getPrismaClient();
    const branchId = await getActiveBranchId();
    const tables = await prisma.restaurantTable.findMany({ where: branchId ? { branchId } : {}, orderBy: { name: "asc" } });

    return tables.map((table) => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      zone: table.zone ?? "",
      reservedFor: table.reservedFor ?? undefined,
    }));
  } catch (error) {
    logServerDataError("getTablesPageData", error);
    return [];
  }
}


export async function getPosTablesData(): Promise<{ tables: PosTable[], parcelOrders: any[] }> {
  try {
    const prisma = getPrismaClient();
    const branchId = await getActiveBranchId();
    const branchFilter = branchId ? { branchId } : {};

    const tables = await prisma.restaurantTable.findMany({ where: branchFilter, orderBy: { name: "asc" } });

    const activeOrders = await prisma.order.findMany({
      where: { status: "OPEN", ...branchFilter },
      include: {
        items: { include: { menuItem: true } }
      }
    });

    const parcelOrders = activeOrders.filter(o => o.diningMode === "PARCEL");

    const tablesWithOrders = tables.map((table) => {
      const orders = activeOrders.filter(o => o.tableId === table.id);
      return {
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        zone: table.zone ?? "",
        reservedFor: table.reservedFor ?? undefined,
        activeOrders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          diningMode: order.diningMode,
          customerName: order.customerName ?? "",
          discountAmount: asNumber(order.discountAmount),
          totalAmount: asNumber(order.totalAmount),
          items: order.items.map(i => ({
            id: i.id,
            menuItemId: i.menuItemId,
            name: i.menuItem.name,
            price: asNumber(i.unitPrice),
            quantity: i.quantity,
            gstRate: asNumber(i.taxRate)
          }))
        }))
      };
    });

    return {
      tables: tablesWithOrders,
      parcelOrders: parcelOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        diningMode: order.diningMode,
        customerName: order.customerName ?? "",
        discountAmount: asNumber(order.discountAmount),
        totalAmount: asNumber(order.totalAmount),
        items: order.items.map(i => ({
          id: i.id,
          menuItemId: i.menuItemId,
          name: i.menuItem.name,
          price: asNumber(i.unitPrice),
          quantity: i.quantity,
          gstRate: asNumber(i.taxRate)
        }))
      }))
    };
  } catch (error) {
    logServerDataError("getPosTablesData", error);
    return { tables: [], parcelOrders: [] };
  }
}

export async function getStaffPageData(): Promise<StaffMember[]> {
  try {
    const prisma = getPrismaClient();
    const branchId = await getActiveBranchId();
    
    const users = await prisma.user.findMany({
      where: { isActive: true, ...(branchId ? { branchId } : {}) },
      orderBy: { name: "asc" },
    });

    return users.map((user) => {
      return {
        id: user.id,
        staffCode: user.staffCode,
        name: user.name,
        email: user.email,
        role: formatRole(user.role),
        roleEnum: user.role,
        performanceNote: user.isActive ? "Active employee" : "Deactivated",
        isActive: user.isActive,
      };
    });
  } catch (error) {
    logServerDataError("getStaffPageData", error);
    return [];
  }
}
import { ItemSalesData } from "./types";

export async function getReportsPageData(period?: string, startStr?: string, endStr?: string) {
  try {
    const prisma = getPrismaClient();
    const branchId = await getActiveBranchId();
    const branchFilter = branchId ? { branchId } : {};

    let targetStart: Date;
    let targetEnd: Date;
    let periodLabel: string;

    if (period === "daily") {
      targetStart = startOfToday();
      targetEnd = new Date(targetStart);
      targetEnd.setHours(23, 59, 59, 999);
      periodLabel = "Today";
    } else if (period === "weekly") {
      targetStart = startOfToday();
      targetStart.setDate(targetStart.getDate() - targetStart.getDay());
      targetEnd = new Date(targetStart);
      targetEnd.setDate(targetEnd.getDate() + 6);
      targetEnd.setHours(23, 59, 59, 999);
      periodLabel = "This Week";
    } else if (period === "custom" && startStr && endStr) {
      targetStart = new Date(startStr);
      targetStart.setHours(0, 0, 0, 0);
      targetEnd = new Date(endStr);
      targetEnd.setHours(23, 59, 59, 999);
      periodLabel = `${targetStart.toLocaleDateString()} - ${targetEnd.toLocaleDateString()}`;
    } else {
      targetStart = startOfMonth();
      targetEnd = new Date(targetStart);
      targetEnd.setMonth(targetEnd.getMonth() + 1);
      targetEnd.setDate(0);
      targetEnd.setHours(23, 59, 59, 999);
      periodLabel = "This Month";
    }

    const [ordersInPeriod, cancelledCount, payments, orderItems] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: targetStart, lte: targetEnd }, ...branchFilter },
        select: { totalAmount: true, taxAmount: true, status: true },
      }),
      prisma.bill.count({
        where: { cancelledAt: { gte: targetStart, lte: targetEnd }, order: branchFilter },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: targetStart, lte: targetEnd }, order: branchFilter },
        select: { amount: true, method: true },
      }),

      prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: targetStart, lte: targetEnd }, ...branchFilter } },
        include: { menuItem: { include: { category: true } } },
      }),
    ]);

    const sales = ordersInPeriod.reduce((sum, order) => sum + asNumber(order.totalAmount), 0);
    const tax = ordersInPeriod.reduce((sum, order) => sum + asNumber(order.taxAmount), 0);
    const paymentMix = payments.reduce((acc, payment) => {
      const key = payment.method as PaymentMethod;
      acc[key] = (acc[key] ?? 0) + asNumber(payment.amount);
      return acc;
    }, {} as Record<PaymentMethod, number>);

    const itemSalesMap = new Map<string, ItemSalesData>();
    for (const item of orderItems) {
      if (!item.menuItem) continue;
      const existing = itemSalesMap.get(item.menuItemId);
      const quantity = item.quantity;
      const revenue = asNumber(item.totalAmount);
      
      if (existing) {
        existing.quantitySold += quantity;
        existing.totalRevenue += revenue;
      } else {
        itemSalesMap.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
          category: item.menuItem.category?.name ?? "Uncategorized",
          quantitySold: quantity,
          totalRevenue: revenue,
        });
      }
    }
    const itemSales = Array.from(itemSalesMap.values()).sort((a, b) => b.quantitySold - a.quantitySold);

    const reports: ReportCard[] = [
      {
        title: "Sales report",
        value: `Rs ${sales.toLocaleString()}`,
        period: periodLabel,
        description: "Total revenue generated from completed order records.",
      },
      {
        title: "GST report",
        value: `Rs ${tax.toLocaleString()}`,
        period: periodLabel,
        description: "Tax totals collected from recorded orders.",
      },
      {
        title: "Cancelled bills",
        value: `${cancelledCount} bills`,
        period: periodLabel,
        description: `Recorded payments: ${Object.keys(paymentMix).length}.`,
      },
    ];

    return {
      reports,
      dashboard: await getDashboardData(),
      itemSales,
      periodLabel,
    };
  } catch (error) {
    logServerDataError("getReportsPageData", error);
    return {
      reports: [
        {
          title: "Sales report",
          value: "Rs 0",
          period: "Unavailable",
          description: "Report data is temporarily unavailable.",
        },
        {
          title: "GST report",
          value: "Rs 0",
          period: "Unavailable",
          description: "Report data is temporarily unavailable.",
        },
        {
          title: "Cancelled bills",
          value: "0 bills",
          period: "Unavailable",
          description: "Report data is temporarily unavailable.",
        },
      ],
      dashboard: await getDashboardData(),
      itemSales: [],
      periodLabel: "Unavailable",
    };
  }
}

export async function getOrdersForApi() {
  try {
    const prisma = getPrismaClient();
    const branchId = await getActiveBranchId();
    
    const orders = await prisma.order.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        status: {
          in: [OrderStatus.OPEN, OrderStatus.BILLED],
        },
      },
      include: { table: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      id: order.orderNumber,
      mode: order.diningMode,
      table: order.table?.name ?? "-",
      status: order.status,
      amount: asNumber(order.totalAmount),
    }));
  } catch (error) {
    logServerDataError("getOrdersForApi", error);
    return [];
  }
}
