/**
 * Data Export Utilities
 * Export data for backup, migration, or analysis
 */

import { getOrders } from "./orderStorage.js";
import { getAppointments } from "./appointmentStorage.js";
import { getWorkingSlots } from "./workingSlotStorage.js";
import { getFabricInventory } from "./fabricInventoryStorage.js";
import { getStyles } from "./styleStorage.js";
import { getFabricHolds } from "./fabricHoldStorage.js";

/**
 * Export all data to JSON file
 */
export const exportAllData = () => {
  const data = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    data: {
      orders: getOrders(),
      appointments: getAppointments(),
      workingSlots: getWorkingSlots(),
      fabrics: getFabricInventory(),
      styles: getStyles(),
      fabricHolds: getFabricHolds(),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tailor-shop-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export orders to CSV
 */
export const exportOrdersToCSV = () => {
  const orders = getOrders();
  
  if (orders.length === 0) {
    return null;
  }

  // CSV Headers
  const headers = [
    "ID",
    "Tên khách hàng",
    "Số điện thoại",
    "Email",
    "Sản phẩm",
    "Trạng thái",
    "Tổng tiền",
    "Ngày tạo",
    "Ngày hoàn thành",
  ];

  // CSV Rows
  const rows = orders.map((order) => [
    order.id || "",
    order.name || "",
    order.phone || "",
    order.email || "",
    order.productName || "",
    order.status || "",
    order.total || "",
    order.createdAt || "",
    order.completedAt || "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  // Download
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export appointments to CSV
 */
export const exportAppointmentsToCSV = () => {
  const appointments = getAppointments();
  
  if (appointments.length === 0) {
    return null;
  }

  const headers = [
    "ID",
    "Khách hàng",
    "Loại",
    "Trạng thái",
    "Ngày",
    "Ghi chú",
    "Ngày tạo",
  ];

  const rows = appointments.map((apt) => [
    apt.id || "",
    apt.customerId || "",
    apt.type || "",
    apt.status || "",
    apt.date || "",
    apt.note || "",
    apt.createdAt || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments-export-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import data from JSON file
 */
export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error("Invalid JSON file"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
};

