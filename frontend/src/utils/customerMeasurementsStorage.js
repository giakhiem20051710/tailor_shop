// Utility functions for managing customer measurements in localStorage

const STORAGE_KEY = "customerMeasurements";

// Get all measurements for a customer
export const getCustomerMeasurements = (customerId) => {
  try {
    const allMeasurements = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return allMeasurements[customerId] || [];
  } catch (error) {
    console.error("Error loading measurements:", error);
    return [];
  }
};

// Save measurements for a customer
export const saveCustomerMeasurements = (customerId, measurements) => {
  try {
    const allMeasurements = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!allMeasurements[customerId]) {
      allMeasurements[customerId] = [];
    }
    
    // Add timestamp and ID
    const measurementRecord = {
      id: `M-${Date.now()}`,
      ...measurements,
      savedAt: new Date().toISOString(),
      orderId: measurements.orderId || null,
    };
    
    allMeasurements[customerId].push(measurementRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMeasurements));
    return measurementRecord;
  } catch (error) {
    console.error("Error saving measurements:", error);
    return null;
  }
};

// Get latest measurements for a customer
export const getLatestMeasurements = (customerId) => {
  const measurements = getCustomerMeasurements(customerId);
  if (measurements.length === 0) return null;
  
  // Sort by date, newest first
  const sorted = [...measurements].sort((a, b) => 
    new Date(b.savedAt) - new Date(a.savedAt)
  );
  return sorted[0];
};

// Get all measurements
export const getAllMeasurements = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    console.error("Error loading all measurements:", error);
    return {};
  }
};

// Delete a measurement record
export const deleteMeasurement = (customerId, measurementId) => {
  try {
    const allMeasurements = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (allMeasurements[customerId]) {
      allMeasurements[customerId] = allMeasurements[customerId].filter(
        (m) => m.id !== measurementId
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allMeasurements));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting measurement:", error);
    return false;
  }
};

