// Utility functions for managing authentication and user roles

const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  TAILOR: "tailor",
  CUSTOMER: "customer",
};

export { ROLES };

// Initialize default users for each role
export const initializeDefaultUsers = () => {
  const defaultUsers = {
    admin: [
      {
        username: "admin",
        password: "admin123",
        role: ROLES.ADMIN,
        name: "Quản trị viên",
        email: "admin@tailorshop.com",
        phone: "0900000000",
      },
    ],
    staff: [
      {
        username: "staff",
        password: "staff123",
        role: ROLES.STAFF,
        name: "Nhân viên",
        email: "staff@tailorshop.com",
        phone: "0900000001",
      },
    ],
    tailor: [
      {
        username: "tho1",
        password: "tho123",
        role: ROLES.TAILOR,
        name: "Thợ may 1",
        email: "tho1@tailorshop.com",
        phone: "0900000002",
      },
    ],
    customer: [],
  };

  Object.keys(defaultUsers).forEach((role) => {
    const key = `users_${role}`;
    const existingUsers = JSON.parse(localStorage.getItem(key) || "[]");
    if (existingUsers.length === 0) {
      localStorage.setItem(key, JSON.stringify(defaultUsers[role]));
    }
  });
};

// Get users by role
export const getUsersByRole = (role) => {
  try {
    const key = `users_${role}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
};

// Save users by role
export const saveUsersByRole = (role, users) => {
  try {
    const key = `users_${role}`;
    localStorage.setItem(key, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error("Error saving users:", error);
    return false;
  }
};

// Authenticate user
export const authenticateUser = (role, username, password) => {
  const users = getUsersByRole(role);
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  // Demo: Accept any credentials for demo purposes
  if (user || (username && password)) {
    const userData = user || {
      username,
      role,
      name: username,
    };

    // Store authentication info - ensure role is lowercase
    const normalizedRole = role ? role.toLowerCase() : role;
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", normalizedRole);
    localStorage.setItem("username", userData.username || username);
    localStorage.setItem("userData", JSON.stringify(userData));

    // Debug log
    console.log("User authenticated:", {
      username: userData.username || username,
      role: normalizedRole,
      userData: userData
    });

    return userData;
  }

  return null;
};

// Get current user
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

// Get current user role
export const getCurrentUserRole = () => {
  return localStorage.getItem("userRole");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem("isAuthenticated") === "true";
};

// Logout
export const logout = () => {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
  localStorage.removeItem("userData");
};

// Check if user has required role
export const hasRole = (requiredRole) => {
  const currentRole = getCurrentUserRole();
  return currentRole === requiredRole;
};

