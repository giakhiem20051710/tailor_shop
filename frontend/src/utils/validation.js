/**
 * Professional Form Validation Utilities
 * Provides comprehensive validation for forms throughout the application
 */

export const validators = {
  required: (value, fieldName = "Trường này") => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${fieldName} là bắt buộc`;
    }
    return null;
  },

  email: (value, fieldName = "Email") => {
    if (!value) return null; // Use required validator for empty check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${fieldName} không hợp lệ`;
    }
    return null;
  },

  phone: (value, fieldName = "Số điện thoại") => {
    if (!value) return null;
    // Vietnamese phone: 10-11 digits, may start with 0 or +84
    const phoneRegex = /^(0|\+84)[1-9][0-9]{8,9}$/;
    const cleaned = value.replace(/\s+/g, "");
    if (!phoneRegex.test(cleaned)) {
      return `${fieldName} phải là số điện thoại Việt Nam hợp lệ (10-11 chữ số)`;
    }
    return null;
  },

  minLength: (min) => (value, fieldName = "Trường này") => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} phải có ít nhất ${min} ký tự`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName = "Trường này") => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} không được vượt quá ${max} ký tự`;
    }
    return null;
  },

  number: (value, fieldName = "Trường này") => {
    if (!value) return null;
    if (isNaN(value) || value === "") {
      return `${fieldName} phải là số`;
    }
    return null;
  },

  min: (min) => (value, fieldName = "Trường này") => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num) || num < min) {
      return `${fieldName} phải lớn hơn hoặc bằng ${min}`;
    }
    return null;
  },

  max: (max) => (value, fieldName = "Trường này") => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num) || num > max) {
      return `${fieldName} phải nhỏ hơn hoặc bằng ${max}`;
    }
    return null;
  },

  date: (value, fieldName = "Ngày") => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} không hợp lệ`;
    }
    return null;
  },

  futureDate: (value, fieldName = "Ngày") => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(date.getTime())) {
      return `${fieldName} không hợp lệ`;
    }
    if (date < today) {
      return `${fieldName} phải là ngày trong tương lai`;
    }
    return null;
  },

  url: (value, fieldName = "URL") => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return `${fieldName} không hợp lệ`;
    }
  },

  pattern: (regex, message) => (value, fieldName = "Trường này") => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message || `${fieldName} không đúng định dạng`;
    }
    return null;
  },
};

/**
 * Validate a single field with multiple validators
 */
export const validateField = (value, validatorsList, fieldName) => {
  for (const validator of validatorsList) {
    const error = typeof validator === "function" 
      ? validator(value, fieldName)
      : validator(value, fieldName);
    if (error) return error;
  }
  return null;
};

/**
 * Validate entire form object
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach((fieldName) => {
    const value = formData[fieldName];
    const rules = validationRules[fieldName];
    
    if (Array.isArray(rules)) {
      const error = validateField(value, rules, fieldName);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    } else if (typeof rules === "function") {
      const error = rules(value, fieldName);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    }
  });

  return { errors, isValid };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $3 $4");
  }
  return phone;
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = "₫") => {
  if (typeof amount !== "number") {
    amount = parseFloat(amount) || 0;
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + ` ${currency}`;
};

/**
 * Validate Vietnamese ID card
 */
export const validateVietnamID = (id) => {
  if (!id) return null;
  const cleaned = id.replace(/\s+/g, "");
  // Vietnamese ID: 9 or 12 digits
  const idRegex = /^\d{9}$|^\d{12}$/;
  if (!idRegex.test(cleaned)) {
    return "CMND/CCCD phải có 9 hoặc 12 chữ số";
  }
  return null;
};

