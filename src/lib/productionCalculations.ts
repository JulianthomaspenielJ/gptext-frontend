// Production calculation utilities based on textile industry formulas

/**
 * Calculate Production per Day per Loom using the formula:
 * (Loom Speed x 60 x 24 x 0.65) / (39.36 x warp yarn count) x Width/Loom
 *
 * @param loomSpeed - Loom speed in RPM (picks per minute)
 * @param warpYarnCount - Warp yarn count (4th value in construction details)
 * @param loomWidth - Loom width in inches
 * @returns Production in meters per day per loom
 */
export const calculateProductionPerDayPerLoom = (
  loomSpeed: number,
  warpYarnCount: number, // This is "value 4" of construction
  loomWidth: number,
): number => {
  if (!loomSpeed || !warpYarnCount || !loomWidth) {
    return 0;
  }

  // Formula: (Loom Speed x 60 x 24 x 0.65) / (39.36 x warp yarn count) x Width/Loom
  const numerator = loomSpeed * 60 * 24 * 0.65; // Picks per day with efficiency factor
  const denominator = 39.36 * warpYarnCount; // Conversion factor with yarn count
  const widthFactor = loomWidth; // Width factor

  const production = (numerator / denominator) * widthFactor;

  return Math.round(production * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate total daily production for multiple looms
 */
export const calculateTotalDailyProduction = (
  looms: Array<{
    speed: number;
    width: number;
    efficiency?: number;
  }>,
  warpYarnCount: number,
): number => {
  return looms.reduce((total, loom) => {
    const efficiency = loom.efficiency || 65; // Default 65% efficiency
    const adjustedSpeed = loom.speed * (efficiency / 100);
    return (
      total +
      calculateProductionPerDayPerLoom(adjustedSpeed, warpYarnCount, loom.width)
    );
  }, 0);
};

/**
 * Calculate estimated completion days based on order quantity and production capacity
 */
export const calculateCompletionDays = (
  orderQuantity: number,
  productionPerDay: number,
): number => {
  if (!productionPerDay || productionPerDay === 0) {
    return 0;
  }

  return Math.ceil(orderQuantity / productionPerDay);
};

/**
 * Calculate required number of looms for a given order
 */
export const calculateRequiredLooms = (
  orderQuantity: number,
  targetDays: number,
  loomSpeed: number,
  warpYarnCount: number,
  loomWidth: number,
): number => {
  const productionPerLoomPerDay = calculateProductionPerDayPerLoom(
    loomSpeed,
    warpYarnCount,
    loomWidth,
  );

  if (!productionPerLoomPerDay) {
    return 1; // Minimum one loom
  }

  const totalProductionNeeded = orderQuantity;
  const totalProductionCapacity = productionPerLoomPerDay * targetDays;

  return Math.ceil(totalProductionNeeded / totalProductionCapacity);
};

/**
 * Parse yarn count from string format (e.g., "20s", "16s") to number
 */
export const parseYarnCount = (yarnCountString: string): number => {
  if (!yarnCountString) return 0;

  // Extract number from string like "20s", "16", "30/1", etc.
  const match = yarnCountString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Format production value for display
 */
export const formatProduction = (production: number): string => {
  if (production === 0) return "0";
  if (production < 1) return production.toFixed(3);
  if (production < 10) return production.toFixed(2);
  return production.toFixed(1);
};

/**
 * Calculate efficiency-adjusted production
 */
export const calculateEfficiencyAdjustedProduction = (
  baseProduction: number,
  efficiency: number,
): number => {
  return baseProduction * (efficiency / 100);
};

/**
 * Validate production calculation inputs
 */
export const validateProductionInputs = (
  loomSpeed: number,
  warpYarnCount: number,
  loomWidth: number,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!loomSpeed || loomSpeed <= 0) {
    errors.push("Loom speed must be greater than 0");
  }

  if (!warpYarnCount || warpYarnCount <= 0) {
    errors.push("Warp yarn count must be greater than 0");
  }

  if (!loomWidth || loomWidth <= 0) {
    errors.push("Loom width must be greater than 0");
  }

  if (loomSpeed > 1000) {
    errors.push("Loom speed seems too high (>1000 RPM)");
  }

  if (warpYarnCount > 200) {
    errors.push("Warp yarn count seems too high (>200)");
  }

  if (loomWidth > 500) {
    errors.push("Loom width seems too high (>500 inches)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
