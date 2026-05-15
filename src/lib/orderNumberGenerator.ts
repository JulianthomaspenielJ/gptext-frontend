// Order Number Generation Utility
import { OrderStorage } from "./orderStorage";

interface CompanySettings {
  name: string;
  logo?: string | null;
}

// Get company settings from localStorage or default
export const getCompanySettings = (): CompanySettings => {
  try {
    const stored = localStorage.getItem("gp_textiles_company_settings");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading company settings:", error);
  }

  return {
    name: "Stritn Textile",
    logo: null,
  };
};

// Save company settings
export const saveCompanySettings = (settings: CompanySettings): void => {
  try {
    localStorage.setItem(
      "gp_textiles_company_settings",
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("Error saving company settings:", error);
  }
};

// Generate company prefix from company name
export const generateCompanyPrefix = (companyName: string): string => {
  if (!companyName) return "GP";

  // Split by spaces and take first letter of each word
  const words = companyName.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word, take first 2 letters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words, take first letter of each word (max 3)
    return words
      .slice(0, 3)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }
};

// Generate next order number
export const generateOrderNumber = (): string => {
  const companySettings = getCompanySettings();
  const prefix = generateCompanyPrefix(companySettings.name);

  // Get existing orders to find the next number
  const existingOrders = OrderStorage.getOrders();

  // Filter orders with the same prefix and extract numbers
  const prefixPattern = new RegExp(`^${prefix}-?(\\d+)$`, "i");
  const existingNumbers = existingOrders
    .map((order) => {
      const match = order.id.match(prefixPattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => num > 0);

  // Find the next available number
  const nextNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

  // Format with leading zeros (3 digits)
  return `${prefix}-${nextNumber.toString().padStart(3, "0")}`;
};

// Validate order number format
export const isValidOrderNumber = (orderNumber: string): boolean => {
  const companySettings = getCompanySettings();
  const prefix = generateCompanyPrefix(companySettings.name);
  const pattern = new RegExp(`^${prefix}-\\d{3}$`, "i");
  return pattern.test(orderNumber);
};

// Examples:
// Stritn Textile -> ST-001, ST-002, etc.
// GP Textiles -> GP-001, GP-002, etc.
// ABC Manufacturing Co -> ABC-001, ABC-002, etc.
// SingleWord -> SI-001, SI-002, etc.
