// Utility functions for managing orders in localStorage
import { recordReferralCompletion } from "./referralStorage.js";

const STORAGE_KEY = "tailorShopOrders";

export const getOrders = () => {
  try {
    const orders = localStorage.getItem(STORAGE_KEY);
    return orders ? JSON.parse(orders) : [];
  } catch (error) {
    console.error("Error loading orders:", error);
    return [];
  }
};

export const saveOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error("Error saving orders:", error);
    return false;
  }
};

export const addOrder = (orderData) => {
  const orders = getOrders();
  const newOrder = {
    ...orderData,
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    status: orderData.status || "Mới",
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrder = (orderId, updates) => {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index !== -1) {
    const previousStatus = orders[index].status;
    orders[index] = { ...orders[index], ...updates };
    saveOrders(orders);
    if (
      orders[index].referralCode &&
      updates.status === "Hoàn thành" &&
      previousStatus !== "Hoàn thành"
    ) {
      recordReferralCompletion({
        code: orders[index].referralCode,
        orderId,
      });
    }
    return orders[index];
  }
  return null;
};

export const deleteOrder = (orderId) => {
  const orders = getOrders();
  const filtered = orders.filter((o) => o.id !== orderId);
  saveOrders(filtered);
  return filtered.length < orders.length;
};

export const getOrderById = (orderId) => {
  const orders = getOrders();
  return orders.find((o) => o.id === orderId);
};

export const generateOrderId = () => {
  const orders = getOrders();
  const maxId = orders.reduce((max, order) => {
    const num = parseInt(order.id.replace("O-", "")) || 0;
    return num > max ? num : max;
  }, 0);
  return `O-${String(maxId + 1).padStart(3, "0")}`;
};

export const initializeDefaultOrders = () => {
  const orders = getOrders();
  if (orders.length === 0) {
    const defaultOrders = [
      {
        id: "O-001",
        name: "Nguyễn Văn A",
        phone: "0901234567",
        receive: "2025-11-25",
        due: "2025-11-30",
        status: "Mới",
        total: "800,000",
        deposit: "300,000",
        notes: "Đo may áo dài nữ",
        measurements: {
          chest: "88",
          waist: "72",
          hip: "92",
          shoulder: "38",
          sleeveLength: "58",
          shirtLength: "120",
          neck: "38",
        },
        sampleImages: [
          "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400",
          "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "O-002",
        name: "Trần Thị B",
        phone: "0902233333",
        receive: "2025-11-26",
        due: "2025-12-05",
        status: "Đang may",
        total: "1,500,000",
        deposit: "500,000",
        notes: "May vest nam",
        measurements: {
          chest: "102",
          waist: "86",
          hip: "96",
          shoulder: "45",
          sleeveLength: "62",
          shirtLength: "75",
          pantsLength: "105",
          neck: "42",
          waistband: "88",
        },
        sampleImages: [
          "https://images.unsplash.com/photo-1594938291221-94f18a24494e?w=400",
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "O-003",
        name: "Lê Văn C",
        phone: "0909999999",
        receive: "2025-11-20",
        due: "2025-11-28",
        status: "Hoàn thành",
        total: "600,000",
        deposit: "600,000",
        notes: "Sửa quần dài",
        measurements: {
          waist: "82",
          hip: "98",
          pantsLength: "100",
          waistband: "84",
          inseam: "75",
          thigh: "58",
        },
        sampleImages: [],
        createdAt: new Date().toISOString(),
      },
    ];
    saveOrders(defaultOrders);
    return defaultOrders;
  }
  return orders;
};

