import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Calculator,
  Factory,
  Calendar,
  Loader2,
  Users,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStorage } from "@/lib/orderStorage";
import { useToast } from "@/hooks/use-toast";
import ENDPOINTS from "@/services/api";
interface EnhancedOrderFormProps {
  onSubmit?: (orderData: any) => void;
  onCancel: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mode?: "create" | "edit";
  orderId?: string | number | null;
}
interface LoomType {
  id: string;
  loomtype: string;
}
interface LoomStatus {
  id: string;
  loomstatus: string;
}
interface Loom {
  id: string;
  name: string;
  loomtype: string;
  status: string;
  efficiency: string;
  currentorder: string | null;
  nextmaintenance: string;
  location: string;
  manufacturer: string;
  model: string;
  assignedweaver: string;
  assignedweaverid?: string;
  width: string;
  reedspace: string;
  maxrpm: string;
  createddate?: string;
  updateddate?: string;
  createdby?: string | null;
  updatedby?: string | null;
  loomspeed?: string;
}
interface LoomPlanningRow {
  id: string;
  loomType: string;
  loomSpeed: string;
  widthLoom: string;
  beamLoom: string;
  productionPerDayLoom: string;
  availableDays: string;
  loomsRequired: string;
  loomsPlanned: string;
}

export const EnhancedOrderForm: React.FC<EnhancedOrderFormProps> = ({
  onSubmit,
  onCancel,
  isOpen,
  setIsOpen,
  mode = "create",
  orderId,
}) => {
  const [gptId, setGptId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // No cache clearing needed when form is closed
  useEffect(() => {
    // This effect can be removed since we're not using cache anymore
  }, [isOpen]);

  const [formData, setFormData] = useState({
    // Basic Order Details

    customer: "",
    buyerPO: "",
    // Construction split into 5 fields
    construction1: "", // First value
    construction2: "", // Second value
    construction3: "", // Third value
    construction4: "", // Fourth value
    construction5: "", // Fifth value
    checklist: "",
    fabric: "",
    deliveryDate: "",
    meters: "", // Added field
    gsm: "", // Added field
    rate: "", // Added field
    // Technical Specifications
    fabricStock: "",
    toBeProduced: "",
    endsDents: "", // Added missing field
    warpEndsBeam: "",
    warpCrimp: "",
    warpMeterReqd: "",
    warpYarnCount: "",
    warpYarnMill: "",
    reedYarnKgs: "",
    partialDispatchQty: "",
    // Production Details
    reedOnLoom: "",
    reedSpace: "",
    flangeWidth: "",
    weftGmsMtr: "",
    weftYarnCount: "",
    weftYarnMill: "",
    weftYarnKgs: "",
    // Production Planning (moved to earlier tab)
    loomType: "",
    loomSpeed: "",
    widthLoom: "",
    beamLoom: "",
    productionPerDayLoom: "",
    availableDays: "",
    loomsRequired: "",
    loomsPlanned: "",
    selectedLooms: [] as Array<Loom>,
    isJobWork: false,
    // timeActionPlan: [] as any[],
    // tasks: [] as any[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loomMismatchAlert, setLoomMismatchAlert] = useState(false);
  const { toast } = useToast();
  const [loomTypes, setLoomTypes] = useState<LoomType[]>([]);
  const [loadingLoomTypes, setLoadingLoomTypes] = useState(true);
  const [availableLooms, setAvailableLooms] = useState<Loom[]>([]);
  const [loomsError, setLoomsError] = useState(false);
  const [loadingLooms, setLoadingLooms] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [selectedLoomDetails, setSelectedLoomDetails] = useState<Loom[]>([]);
  const [hasLoomSelectionChanged, setHasLoomSelectionChanged] = useState(false);
  const [additionalLoomPlans, setAdditionalLoomPlans] = useState<
    LoomPlanningRow[]
  >([]);
  const [additionalLooms, setAdditionalLooms] = useState<
    Record<string, Loom[]>
  >({});
  const createNewLoomPlanRow = (): LoomPlanningRow => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    loomType: "",
    loomSpeed: "",
    widthLoom: "",
    beamLoom: "",
    productionPerDayLoom: "",
    availableDays: "",
    loomsRequired: "",
    loomsPlanned: "",
  });
  const calculateLoomsRequiredForPlanRow = (
    toBeProduced: string,
    productionPerDayLoom: string,
    availableDays: string,
  ) => {
    const toBeProducedNum = parseFloat(toBeProduced) || 0;
    const productionPerDayNum = parseFloat(productionPerDayLoom) || 0;
    const availableDaysNum = parseFloat(availableDays) || 0;
    if (
      toBeProducedNum <= 0 ||
      productionPerDayNum <= 0 ||
      availableDaysNum <= 0
    ) {
      return {
        loomsRequired: "0",
        loomsPlanned: "0",
      };
    }
    const dailyCapacityTotalNeeded = toBeProducedNum / availableDaysNum;
    const loomsRequiredRaw = dailyCapacityTotalNeeded / productionPerDayNum;
    const loomsRequired = Math.ceil(loomsRequiredRaw);
    return {
      loomsRequired: loomsRequired.toString(),
      loomsPlanned: loomsRequired.toString(),
    };
  };
  const computeAdditionalLoomPlanDerivedFields = (
    row: LoomPlanningRow,
  ): LoomPlanningRow => {
    const availableDays = calculateAvailableDays(formData.deliveryDate);
    const productionPerDayLoom = calculateProductionPerDayLoom(
      row.loomSpeed,
      formData.construction4,
      row.widthLoom || "1",
    );
    const { loomsRequired, loomsPlanned } = calculateLoomsRequiredForPlanRow(
      formData.toBeProduced,
      productionPerDayLoom,
      availableDays,
    );
    return {
      ...row,
      availableDays,
      productionPerDayLoom,
      loomsRequired,
      loomsPlanned,
    };
  };
  const updateAdditionalLoomPlan = (
    rowId: string,
    field: keyof Omit<LoomPlanningRow, "id">,
    value: string,
  ) => {
    setAdditionalLoomPlans((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const updatedRow = { ...row, [field]: value } as LoomPlanningRow;

        // Clear loomsPlanned when loomType changes
        if (field === "loomType") {
          updatedRow.loomsPlanned = "0";
        }

        return computeAdditionalLoomPlanDerivedFields(updatedRow);
      }),
    );
  };
  useEffect(() => {
    if (additionalLoomPlans.length === 0) return;
    setAdditionalLoomPlans((prev) =>
      prev.map((row) => computeAdditionalLoomPlanDerivedFields(row)),
    );
  }, [formData.deliveryDate, formData.toBeProduced, formData.construction5]);

  const removeAdditionalLoomPlan = (rowId: string) => {
    setAdditionalLoomPlans((prev) => {
      // Find the loom type being removed
      const removedPlan = prev.find((row) => row.id === rowId);
      if (!removedPlan) return prev.filter((row) => row.id !== rowId);

      // Get the loom type that's being removed
      const removedLoomType = removedPlan.loomType;

      // Filter out the deleted plan
      const newPlans = prev.filter((row) => row.id !== rowId);

      // Clean up additional looms for the removed loom type
      if (removedLoomType) {
        setAdditionalLooms((prevAdditional) => {
          const newAdditional = { ...prevAdditional };
          delete newAdditional[removedLoomType];
          return newAdditional;
        });

        setFormData((prevFormData) => {
          // Get all remaining loom types (main + additional)
          const remainingLoomTypes = [
            prevFormData.loomType,
            ...newPlans.map((plan) => plan.loomType),
          ].filter(Boolean);

          // Filter selectedLooms to only keep those that match remaining loom types
          const remainingSelectedLooms = prevFormData.selectedLooms.filter(
            (loom) => {
              const loomType = loom.loomtype;
              return loomType && remainingLoomTypes.includes(loomType);
            },
          );

          return {
            ...prevFormData,
            selectedLooms: remainingSelectedLooms,
            loomsPlanned: remainingSelectedLooms.length.toString(),
          };
        });
      }

      return newPlans;
    });
  };

  // Calculation helper functions
  const calculateToBeProduced = (meters: string, fabricStock: string) => {
    const metersNum = parseFloat(meters) || 0;
    const stockNum = parseFloat(fabricStock) || 0;
    return Math.max(0, metersNum - stockNum).toString();
  };
  const calculateWarpEndsBeam = (
    construction3: string,
    construction5: string,
  ) => {
    const value3 = parseFloat(construction3) || 0;
    const value5 = parseFloat(construction5) || 0;
    // Excel MROUND equivalent: =MROUND((value3*value5)+16,4)
    const result = value3 * value5 + 16;
    return (Math.round(result / 4) * 4).toString();
  };
  const calculateWarpMeterReqd = (toBeProduced: string, warpCrimp: string) => {
    const produced = parseFloat(toBeProduced) || 0;
    const crimp = parseFloat(warpCrimp) || 0;
    const result = produced * (1 + crimp / 100);
    return result.toFixed(1); // Outputs "13200.0" for your example
  };
  const calculateReqdYarnKgs = (
    warpMeterReqd: string,
    warpEndsBeam: string,
    warpYarnCount: string,
  ) => {
    const meterReqd = parseFloat(warpMeterReqd) || 0;
    const endsBeam = parseFloat(warpEndsBeam) || 0;
    const yarnCount = parseFloat(warpYarnCount) || 0;
    if (yarnCount === 0) return "0";
    // =ROUND((warp meter reqd*warp ends/beam)/(1693*warp yarn count),0)
    const result = (meterReqd * endsBeam) / (1693 * yarnCount);
    return Math.round(result).toString();
  };
  const calculateReedSpace = (
    warpEndsBeam: string,
    reedOnLoom: string,
    endsDents: string,
  ) => {
    const endsBeam = parseFloat(warpEndsBeam) || 0;
    const reedLoom = parseFloat(reedOnLoom) || 0;
    const endsDent = parseFloat(endsDents) || 0;
    if (reedLoom === 0 || endsDent === 0 || endsBeam === 0) return "0.00";
    const result = (endsBeam * 2) / (reedLoom * endsDent) + 3;
    return result.toFixed(2);
  };
  const calculateWeftGmsMtr = (
    reedSpace: string,
    construction4: string,
    construction2: string,
  ) => {
    const space = parseFloat(reedSpace) || 0;
    const value4 = parseFloat(construction4) || 0;
    const value2 = parseFloat(construction2) || 0;
    if (value2 === 0) return "0.000";
    const result = (space * value4 * 0.00059) / value2;
    return result.toFixed(6); // Increased to 6 decimals for precision (outputs "0.146202")
  };
  const calculateWeftYarnKgs = (toBeProduced: string, weftGmsMtr: string) => {
    const produced = parseFloat(toBeProduced) || 0;
    const gmsPerMtr = parseFloat(weftGmsMtr) || 0;
    const result = produced * gmsPerMtr;
    return Math.round(result).toString(); // ROUND(..., 0)
  };
  const calculateProductionPerDayLoom = (
    loomSpeed: string,
    construction4: string,
    widthLoom: string,
  ) => {
    const speed = parseFloat(loomSpeed) || 0;
    const picksPerInch = parseFloat(construction4) || 0;
    const width = parseFloat(widthLoom) || 1; // default to 1 if empty
    if (speed === 0 || picksPerInch === 0) return "0.0";
    const numerator = speed * 60 * 24 * 0.65;
    const denominator = 39.36 * picksPerInch;
    const result = (numerator / denominator) * width;
    return result.toFixed(1); // e.g., "99.1"
  };
  const calculateAvailableDays = (
    deliveryDate: string,
    orderDate: string = "",
  ) => {
    if (!deliveryDate) return "0";
    const delivery = new Date(deliveryDate);
    const order = orderDate ? new Date(orderDate) : new Date();
    // Reset time to avoid hour/minute issues
    delivery.setHours(0, 0, 0, 0);
    order.setHours(0, 0, 0, 0);
    if (delivery < order) return "0"; // Changed to < to allow same day as 1?
    const timeDiff = delivery.getTime() - order.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    // Inclusive: add 1 day
    const inclusiveDays = Math.floor(daysDiff) + 1;
    return Math.max(1, inclusiveDays).toString(); // At least 1 if same day or future
  };
  // When in edit mode, fetch existing order data to prefill the form
  useEffect(() => {
    if (mode !== "edit" || !isOpen || !orderId) return;
    const fetchOrder = async () => {
      setIsLoadingOrder(true);
      try {
        const response = await ENDPOINTS.getOrderById(orderId);
        const order = response.data?.order;
        if (!order) throw new Error("Order not found");

        const gptId = order.gptid || "";
        setGptId(gptId); // Store the gptid in state

        // Pre-fill order details, technical details, and available days in production planning
        const availableDays = calculateAvailableDays(
          order.deliverydate ? order.deliverydate.split("T")[0] : "",
        );

        // Calculate meters as tobeproduced - actualproduction for edit mode
        const toBeProduced = parseFloat(order.tobeproduced) || 0;
        const actualProduction = parseFloat(order.actualproduction) || 0;
        const calculatedMeters = Math.max(
          0,
          toBeProduced - actualProduction,
        ).toString();

        // Calculate the toBeProduced value based on calculatedMeters and fabricStock
        const fabricStock = parseFloat(order.fabricstock) || 0;
        const calculatedToBeProduced = Math.max(
          0,
          parseFloat(calculatedMeters) - fabricStock,
        ).toString();

        // Recalculate dependent fields based on the updated values
        const warpCrimp = order.warpcrimp || "0";
        const calculatedWarpMeterReqd = calculateWarpMeterReqd(
          calculatedToBeProduced,
          warpCrimp,
        );

        const construction3 = order.constructionvalue3 || "0";
        const construction5 = order.constructionvalue5 || "0";
        const calculatedWarpEndsBeam = calculateWarpEndsBeam(
          construction3,
          construction5,
        );

        const warpYarnCount =
          order.warpyarncount || order.constructionvalue1 || "0";
        const calculatedReedYarnKgs = calculateReqdYarnKgs(
          calculatedWarpMeterReqd,
          calculatedWarpEndsBeam,
          warpYarnCount,
        );

        const reedOnLoom = order.reedonloom || "0";
        const endsDents = order.endsdents || "0";
        const calculatedReedSpace = calculateReedSpace(
          calculatedWarpEndsBeam,
          reedOnLoom,
          endsDents,
        );

        const construction4 = order.constructionvalue4 || "0";
        const construction2 = order.constructionvalue2 || "0";
        const calculatedWeftGmsMtr = calculateWeftGmsMtr(
          calculatedReedSpace,
          construction4,
          construction2,
        );
        const calculatedWeftYarnKgs = calculateWeftYarnKgs(
          calculatedToBeProduced,
          calculatedWeftGmsMtr,
        );

        // Load existing looms if they exist
        const existingLooms =
          order.productionPlanning?.[0]?.loomsselected || [];
        const productionPlanning = order.productionPlanning?.[0] || {};

        // Extract unique loom types from existing looms
        const existingLoomTypes = [
          ...new Set(
            existingLooms.map((loom) => loom.loomtype).filter(Boolean),
          ),
        ];
        const existingLoomType =
          existingLoomTypes.length > 0 ? existingLoomTypes[0] : "";

        setFormData((prev) => ({
          ...prev, // Keep any existing form state
          // Order Details
          customer: order.customername || "",
          buyerPO: order.buyerponumber || "",
          checklist: order.checklist || "",
          fabric: order.fabrictype || "",
          deliveryDate: order.deliverydate
            ? order.deliverydate.split("T")[0]
            : "",
          meters: calculatedMeters || "", // Use calculated value in edit mode
          gsm: order.gsm || "",
          rate: order.rate || "",
          construction1: order.constructionvalue1 || "",
          construction2: order.constructionvalue2 || "",
          construction3: order.constructionvalue3 || "",
          construction4: order.constructionvalue4 || "",
          construction5: order.constructionvalue5 || "",

          // Technical Details
          fabricStock: order.fabricstock || "0",
          toBeProduced: calculatedToBeProduced,
          endsDents: order.endsdents || "",
          warpEndsBeam: calculatedWarpEndsBeam,
          warpCrimp: order.warpcrimp || "",
          warpMeterReqd: calculatedWarpMeterReqd,
          warpYarnCount: order.warpyarncount || order.constructionvalue1 || "",
          warpYarnMill: order.warpyarnmill || "",
          reedYarnKgs: calculatedReedYarnKgs,
          partialDispatchQty: order.partialdispatchqty || "",
          reedOnLoom: order.reedonloom || "",
          reedSpace: calculatedReedSpace,
          flangeWidth: order.flangewidth || "",
          weftGmsMtr: calculatedWeftGmsMtr,
          weftYarnCount: order.weftyarncount || order.constructionvalue2 || "",
          weftYarnMill: order.weftyarnmill || "",
          weftYarnKgs: calculatedWeftYarnKgs,

          // Production Planning - Pre-fill with existing data if available
          loomType:
            existingLoomType ||
            productionPlanning.loomtype?.[0] ||
            order.loomtype?.[0] ||
            "",
          loomSpeed: "", // Will be set after fetching loom type data
          widthLoom: productionPlanning.loomwidth || order.loomwidth || "",
          beamLoom: productionPlanning.loombeam || order.loombeam || "",
          productionPerDayLoom:
            productionPlanning.productionperdayloom ||
            order.productionperdayloom ||
            "",
          availableDays: availableDays,
          loomsRequired:
            existingLooms.length > 0
              ? existingLooms.length.toString()
              : productionPlanning.loomsrequired || order.loomsrequired || "",
          loomsPlanned:
            existingLooms.length > 0
              ? existingLooms.length.toString()
              : productionPlanning.loomsplanned || order.loomsplanned || "",
          selectedLooms: existingLooms,
          isJobWork: order.status === "Job Work",
        }));

        // Explicitly fetch looms and set loom speed after setting loom type in edit mode
        const finalLoomType =
          existingLoomType ||
          productionPlanning.loomtype?.[0] ||
          order.loomtype?.[0] ||
          "";
        if (finalLoomType) {
          try {
            // Set loading state for loom speed
            setFormData((prev) => ({
              ...prev,
              loomSpeed: "Loading...",
            }));

            const response = await ENDPOINTS.getByLoomType(finalLoomType);
            const fetchedLooms = response.data?.looms || [];

            if (response.data?.message && fetchedLooms.length === 0) {
              toast({
                variant: "destructive",
                title: "No Looms Available",
                description: response.data.message,
              });
            }

            // No caching needed - fetch directly when needed

            let finalSpeed = "";
            if (fetchedLooms.length > 0) {
              const speedCounts = fetchedLooms.reduce(
                (acc: Record<string, number>, loom: any) => {
                  const speed = loom.loomspeed || "0";
                  acc[speed] = (acc[speed] || 0) + 1;
                  return acc;
                },
                {},
              );
              const mostCommonSpeed = Object.keys(speedCounts).reduce((a, b) =>
                speedCounts[a] > speedCounts[b] ? a : b,
              );
              finalSpeed = mostCommonSpeed;
            } else {
              // Fallback to API response value if no looms found
              finalSpeed =
                productionPlanning.loomspeed || order.loomspeed || "";
            }

            setFormData((prev) => ({
              ...prev,
              loomSpeed: finalSpeed,
            }));
          } catch (err) {
            console.error("Failed to fetch looms for edit mode:", err);
            // Fallback to API response value on error
            setFormData((prev) => ({
              ...prev,
              loomSpeed: productionPlanning.loomspeed || order.loomspeed || "",
            }));
          }
        }

        // Reset loom details
        setSelectedLoomDetails([]);

        // Create additional loom plans for each unique loom type (excluding the first one)
        if (existingLoomTypes.length > 1) {
          const additionalPlans = existingLoomTypes
            .slice(1)
            .map((loomType: string, index) => {
              // Get looms of this type to extract their speed
              const loomsOfThisType = existingLooms.filter(
                (loom) => loom.loomtype === loomType,
              );
              // Get the most common speed for looms of this type
              const speedCounts = loomsOfThisType.reduce(
                (acc: Record<string, number>, loom) => {
                  const speed = loom.loomspeed || "0";
                  acc[speed] = (acc[speed] || 0) + 1;
                  return acc;
                },
                {},
              );
              const mostCommonSpeed = Object.keys(speedCounts).reduce(
                (a, b) =>
                  (speedCounts[a] || 0) > (speedCounts[b] || 0) ? a : b,
                "",
              );

              return {
                id: `additional-${Date.now()}-${index}`,
                loomType,
                loomSpeed:
                  mostCommonSpeed ||
                  productionPlanning.loomspeed ||
                  order.loomspeed ||
                  "",
                widthLoom:
                  productionPlanning.loomwidth || order.loomwidth || "",
                beamLoom: productionPlanning.loombeam || order.loombeam || "",
                productionPerDayLoom:
                  productionPlanning.productionperdayloom ||
                  order.productionperdayloom ||
                  "",
                availableDays,
                loomsRequired: existingLooms
                  .filter((loom) => loom.loomtype === loomType)
                  .length.toString(),
                loomsPlanned: existingLooms
                  .filter((loom) => loom.loomtype === loomType)
                  .length.toString(),
              };
            });
          setAdditionalLoomPlans(additionalPlans);
        } else {
          setAdditionalLoomPlans([]);
        }

        setHasLoomSelectionChanged(true);
        setCurrentStep(0);

        toast({
          title: "Order Loaded",
          description: `Order ${gptId || order.id} loaded. Please create new production planning and loom assignment.`,
        });
      } catch (err: any) {
        console.error("Failed to load order for edit:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            err.message || "Could not load order details for editing.",
        });
      } finally {
        setIsLoadingOrder(false);
      }
    };
    fetchOrder();
  }, [mode, isOpen, orderId, toast]);
  const fetchMostCommonSpeedForLoomType = async (loomType: string) => {
    try {
      const response = await ENDPOINTS.getByLoomType(loomType);
      const fetchedLooms = response.data?.looms || [];

      // Check if API returned a specific message about no available looms
      if (response.data?.message && fetchedLooms.length === 0) {
        toast({
          variant: "destructive",
          title: "No Looms Available",
          description: response.data.message,
        });
      }

      if (fetchedLooms.length === 0) return "";
      const speedCounts = fetchedLooms.reduce(
        (acc: Record<string, number>, loom: any) => {
          const speed = loom.loomspeed || "0";
          acc[speed] = (acc[speed] || 0) + 1;
          return acc;
        },
        {},
      );
      return Object.keys(speedCounts).reduce((a, b) =>
        speedCounts[a] > speedCounts[b] ? a : b,
      );
    } catch (err) {
      console.error("Failed to fetch looms for speed calculation:", err);
      return "";
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      // Clear selected looms and reset loomsPlanned when loom type changes
      if (field === "loomType") {
        newData.selectedLooms = [];
        newData.loomsPlanned = "0";
        newData.loomSpeed = "Loading..."; // Set loading state

        // Fetch most common speed for the new loom type
        if (value) {
          fetchMostCommonSpeedForLoomType(value)
            .then((speed) => {
              setFormData((prev) => ({
                ...prev,
                loomSpeed: speed || "",
              }));
            })
            .catch((err) => {
              console.error("Failed to fetch loom speed:", err);
              setFormData((prev) => ({
                ...prev,
                loomSpeed: "",
              }));
            });
        }

        if (mode === "edit") {
          setHasLoomSelectionChanged(true);
        }
      }
      // Perform calculations based on field changes
      // 1. To be produced = Meters - Fabric stock
      if (field === "meters" || field === "fabricStock") {
        newData.toBeProduced = calculateToBeProduced(
          field === "meters" ? value : prev.meters,
          field === "fabricStock" ? value : prev.fabricStock,
        );
      }
      // 2. Warp ends/beam calculation
      if (field === "construction3" || field === "construction5") {
        newData.warpEndsBeam = calculateWarpEndsBeam(
          field === "construction3" ? value : prev.construction3,
          field === "construction5" ? value : prev.construction5,
        );
      }
      // 3. Warp yarn counts from construction
      if (field === "construction1") {
        newData.warpYarnCount = value;
      }
      if (field === "construction2") {
        newData.weftYarnCount = value;
      }
      // 4. Warp meter required calculation
      if (
        field === "toBeProduced" ||
        field === "warpCrimp" ||
        field === "meters" ||
        field === "fabricStock"
      ) {
        const toBeProduced =
          field === "toBeProduced" ? value : newData.toBeProduced;
        const currentWarpCrimp = field === "warpCrimp" ? value : prev.warpCrimp; // ← Fix: Use new value if changing warpCrimp
        newData.warpMeterReqd = calculateWarpMeterReqd(
          toBeProduced,
          currentWarpCrimp,
        );
      }
      // 5. Reqd Yarn in KGS calculation
      if (
        field === "warpMeterReqd" ||
        field === "warpEndsBeam" ||
        field === "construction1" ||
        field === "construction3" ||
        field === "construction5" ||
        field === "toBeProduced" ||
        field === "warpCrimp" ||
        field === "meters" ||
        field === "fabricStock"
      ) {
        const warpMeterReqd =
          field === "warpMeterReqd" ? value : newData.warpMeterReqd;
        const warpEndsBeam =
          field === "warpEndsBeam" ? value : newData.warpEndsBeam;
        const warpYarnCount =
          field === "construction1" ? value : newData.warpYarnCount;
        newData.reedYarnKgs = calculateReqdYarnKgs(
          warpMeterReqd,
          warpEndsBeam,
          warpYarnCount,
        );
      }
      // 6. Reed space calculation
      if (
        field === "warpEndsBeam" ||
        field === "reedOnLoom" ||
        field === "endsDents" ||
        field === "construction3" ||
        field === "construction5"
      ) {
        const warpEndsBeam =
          field === "warpEndsBeam" ? value : newData.warpEndsBeam;
        const currentReedOnLoom =
          field === "reedOnLoom" ? value : prev.reedOnLoom; // Use NEW value when changing reedOnLoom
        const currentEndsDents = field === "endsDents" ? value : prev.endsDents; // Use NEW value when changing endsDents
        newData.reedSpace = calculateReedSpace(
          warpEndsBeam,
          currentReedOnLoom,
          currentEndsDents,
        );
      }
      // 7. Weft gms/mtr calculation
      if (
        field === "reedSpace" ||
        field === "construction4" ||
        field === "construction2" ||
        field === "warpEndsBeam" ||
        field === "reedOnLoom" ||
        field === "endsDents" ||
        field === "construction3" ||
        field === "construction5"
      ) {
        const reedSpace = field === "reedSpace" ? value : newData.reedSpace;
        newData.weftGmsMtr = calculateWeftGmsMtr(
          reedSpace,
          prev.construction4,
          prev.construction2,
        );
      }
      // 8. Weft Yarn calculation
      if (
        field === "toBeProduced" ||
        field === "weftGmsMtr" ||
        field === "meters" ||
        field === "fabricStock" ||
        field === "reedSpace" ||
        field === "construction4" ||
        field === "construction2" ||
        field === "warpEndsBeam" ||
        field === "reedOnLoom" ||
        field === "endsDents" ||
        field === "construction3" ||
        field === "construction5"
      ) {
        const toBeProduced =
          field === "toBeProduced" ? value : newData.toBeProduced;
        const currentWeftGmsMtr =
          field === "weftGmsMtr" ? value : newData.weftGmsMtr; // Use NEW value if changing weftGmsMtr
        newData.weftYarnKgs = calculateWeftYarnKgs(
          toBeProduced,
          currentWeftGmsMtr,
        );
      }
      // 9. Available days calculation
      if (field === "deliveryDate") {
        newData.availableDays = calculateAvailableDays(value);
      }
      // Calculate production per day loom first
      if (
        field === "loomSpeed" ||
        field === "construction4" ||
        field === "widthLoom"
      ) {
        newData.productionPerDayLoom = calculateProductionPerDayLoom(
          field === "loomSpeed" ? value : prev.loomSpeed,
          field === "construction4" ? value : prev.construction4,
          field === "widthLoom" ? value : prev.widthLoom || "1",
        );
      }

      // Then calculate looms required based on production needs
      if (
        field === "meters" ||
        field === "productionPerDayLoom" ||
        field === "availableDays" ||
        field === "loomSpeed" ||
        field === "construction4" ||
        field === "widthLoom"
      ) {
        // Use the updated data to calculate looms required
        const toBeProduced = parseFloat(newData.toBeProduced) || 0;
        const productionPerDay = parseFloat(newData.productionPerDayLoom) || 0;
        const availableDays = parseFloat(newData.availableDays) || 0;

        if (toBeProduced <= 0 || productionPerDay <= 0 || availableDays <= 0) {
          newData.loomsRequired = "0";
          newData.loomsPlanned = "0";
        } else {
          const dailyCapacityTotalNeeded = toBeProduced / availableDays;
          const loomsRequiredRaw = dailyCapacityTotalNeeded / productionPerDay;
          const loomsRequired = Math.ceil(loomsRequiredRaw);
          newData.loomsRequired = loomsRequired.toString();
          newData.loomsPlanned = loomsRequired.toString();
        }
      }

      return newData;
    });
    // If loom type changes in edit mode, treat it as a loom selection change
    if (mode === "edit" && field === "loomType") {
      setHasLoomSelectionChanged(true);
      setSelectedLoomDetails([]);
    }
  };
  const handleLoomSelection = (loom: Loom, checked: boolean) => {
    setFormData((prev) => {
      const isSelected = prev.selectedLooms.some((l) => l.id === loom.id);
      if (checked && !isSelected) {
        return {
          ...prev,
          selectedLooms: [...prev.selectedLooms, loom],
          loomsPlanned: (prev.selectedLooms.length + 1).toString(),
        };
      } else if (!checked && isSelected) {
        return {
          ...prev,
          selectedLooms: prev.selectedLooms.filter((l) => l.id !== loom.id),
          loomsPlanned: Math.max(0, prev.selectedLooms.length - 1).toString(),
        };
      }
      return prev;
    });
    // Any manual change to loom selection in edit mode should cause
    // us to recompute loomsselected from the currently available looms
    if (mode === "edit") {
      setHasLoomSelectionChanged(true);
    }
  };
  const validateLoomRequirement = () => {
    const totalSelected = formData.selectedLooms.length;

    // Case 1: Job Work → always valid (no looms needed)
    if (formData.isJobWork) {
      return true;
    }

    // Case 2: Multiple loom types and we have a meaningful average calculation
    if (additionalLoomPlans.length > 0 && multiLoomSummary.hasMultiple) {
      const avgRequired = parseInt(multiLoomSummary.avgLoomsRequired) || 0;

      // If average is calculated and > 0, use it as the primary check
      if (avgRequired > 0) {
        if (totalSelected < avgRequired) {
           console.log("1");
          setLoomMismatchAlert(true);
          return false;
        }
        // Optional: still warn if per-type distribution is off, but primary check is avg
        return true;
      }
    }

    // Fallback: Single loom type OR avgRequired is 0/invalid
    // Use the main loomsRequired (or sum of individual required if multiple but no good avg)
    let targetRequired = parseInt(formData.loomsRequired) || 0;

    if (additionalLoomPlans.length > 0) {
      // Sum up all individual loomsRequired from main + additional plans
      targetRequired = additionalLoomPlans.reduce((sum, plan) => {
        return sum + (parseInt(plan.loomsRequired) || 0);
      }, targetRequired);
    }

    if (targetRequired > totalSelected) {
      console.log("2")
      setLoomMismatchAlert(true);
      return false;
    }

    return true;
  };

  const handleJobWorkConfirmation = (isJobWork: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isJobWork,
      // Clear selected looms when marking as Job Work
      selectedLooms: isJobWork ? [] : prev.selectedLooms,
      // Also reset planned looms count for consistency
      loomsPlanned: isJobWork ? "0" : prev.loomsPlanned,
    }));
    setLoomMismatchAlert(false);
    if (isJobWork) {
      // Skip T&A generation and loom assignment for job work
      setCurrentStep(3); // Go directly to Review & Submit
    } else {
      // Go back to loom selection to adjust
      setCurrentStep(2);
    }
  };
  const generateTimeActionPlan = () => {
    if (formData.isJobWork) {
      // No T&A plan for job work
      setFormData((prev) => ({
        ...prev,
        timeActionPlan: [],
        tasks: [],
      }));
      return;
    }
    // Generate separate T&A plan for each selected loom
    const orderCreationDate = new Date().toISOString().split("T")[0];
    const loomPlans = formData.selectedLooms.map((loom) => {
      const basePlan = OrderStorage.generateTimeActionPlan(orderCreationDate);
      // Customize plan for each loom
      return {
        loomId: loom.id,
        processes: basePlan.map((process) => ({
          ...process,
          id: `${loom.id}-${process.id}`,
          loomSpecific: true,
          loomId: loom.id,
        })),
      };
    });
    setFormData((prev) => ({
      ...prev,
      timeActionPlan: loomPlans,
    }));
    // Generate tasks from all loom T&A plans
    generateTasks(loomPlans);
  };
  const generateTasks = (loomPlans: any[]) => {
    const allTasks: any[] = [];
    loomPlans.forEach(({ loomId, processes }) => {
      const loomTasks = processes.map((process: any, index: number) => ({
        id: `${loomId}-task-${index + 1}`,
        title: `${process.process} - Loom ${loomId}`,
        description: `Complete ${process.process.toLowerCase()} for ${formData.customer} on loom ${loomId}`,
        dueDate: process.targetDate,
        assignedTo: process.responsible,
        status: "Pending",
        priority: index < 5 ? "High" : "Medium",
        category: process.process.includes("Yarn")
          ? "Yarn Management"
          : process.process.includes("Loom")
            ? "Loom Operations"
            : "Quality Control",
        orderId: `ORD-${Date.now().toString().slice(-3)}`,
        loomId,
      }));
      allTasks.push(...loomTasks);
    });
    setFormData((prev) => ({
      ...prev,
      tasks: allTasks,
    }));
  };
  const handleNext = () => {
    if (currentStep === 2) {
      // Validate loom requirement before proceeding (now step 2 is loom assignment)
      if (!validateLoomRequirement()) {
        return; // Alert will be shown
      }
    }
    if (currentStep === 2) {
      // generateTimeActionPlan();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!formData.loomType || !isOpen) {
      setAvailableLooms([]);
      return;
    }

    // Skip this useEffect in edit mode to avoid overriding the loom speed set by the edit logic
    if (mode === "edit" && isLoadingOrder) {
      return;
    }

    const fetchLooms = async () => {
      setLoadingLooms(true);
      setLoomsError(false);

      try {
        const response = await ENDPOINTS.getByLoomType(formData.loomType);
        const fetchedLooms = response.data?.looms || [];

        if (response.data?.message && fetchedLooms.length === 0) {
          toast({
            variant: "destructive",
            title: "No Looms Available",
            description: response.data.message,
          });
        }

        setAvailableLooms(fetchedLooms);

        if (fetchedLooms.length > 0) {
          const speedCounts = fetchedLooms.reduce(
            (acc: Record<string, number>, loom: any) => {
              const speed = loom.loomspeed || "0";
              acc[speed] = (acc[speed] || 0) + 1;
              return acc;
            },
            {},
          );
          const mostCommonSpeed = Object.keys(speedCounts).reduce((a, b) =>
            speedCounts[a] > speedCounts[b] ? a : b,
          );
          // Only set loomSpeed if not in edit mode or if the current speed is empty/loading
          if (
            mode !== "edit" ||
            !formData.loomSpeed ||
            formData.loomSpeed === "Loading..."
          ) {
            setFormData((prev) => ({
              ...prev,
              loomSpeed: mostCommonSpeed,
            }));
          }
        } else {
          // Only set loomSpeed to empty if not in edit mode
          if (mode !== "edit") {
            setFormData((prev) => ({ ...prev, loomSpeed: "" }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch looms:", err);
        setLoomsError(true);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load available looms.",
        });
        setAvailableLooms([]);
        // Only set loomSpeed to empty if not in edit mode
        if (mode !== "edit") {
          setFormData((prev) => ({ ...prev, loomSpeed: "" }));
        }
      } finally {
        setLoadingLooms(false);
      }
    };

    fetchLooms();
  }, [
    formData.loomType,
    isOpen,
    mode,
    isLoadingOrder,
    formData.loomSpeed,
    toast,
  ]);

  useEffect(() => {
    const fetchLoomOptions = async () => {
      try {
        setLoadingLoomTypes(true);
        const response = await ENDPOINTS.getLoomType(); // Your API call
        if (response.data && response.data.loomTypes) {
          setLoomTypes(response.data.loomTypes);
        }
      } catch (error) {
        console.error("Failed to fetch loom types:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load loom types. Using fallback.",
        });
      } finally {
        setLoadingLoomTypes(false);
      }
    };

    fetchLoomOptions();
  }, []);

  // Fetch looms for additional loom plans when they are added or changed
  useEffect(() => {
    if (!isOpen || additionalLoomPlans.length === 0) return;

    const fetchAdditionalLooms = async () => {
      for (const plan of additionalLoomPlans) {
        if (!plan.loomType) continue;

        // Skip if this is the same as the main loom type (already fetched)
        if (plan.loomType === formData.loomType) continue;

        try {
          const response = await ENDPOINTS.getByLoomType(plan.loomType);
          const fetchedLooms = response.data?.looms || [];

          if (response.data?.message && fetchedLooms.length === 0) {
            toast({
              variant: "destructive",
              title: "No Looms Available",
              description: response.data.message,
            });
          }

          // Store the fetched looms for this loom type
          setAdditionalLooms((prev) => ({
            ...prev,
            [plan.loomType]: fetchedLooms,
          }));
        } catch (err) {
          console.error(
            `Failed to fetch looms for additional plan ${plan.loomType}:`,
            err,
          );
          // Store empty array on error to prevent repeated failed requests
          setAdditionalLooms((prev) => ({
            ...prev,
            [plan.loomType]: [],
          }));
        }
      }
    };

    fetchAdditionalLooms();
  }, [additionalLoomPlans, isOpen, formData.loomType, toast]);

  const allAvailableLoomsForAssignment = useMemo(() => {
    // Main loom type - use availableLooms which are fetched directly
    const mainLooms = formData.loomType ? availableLooms : [];

    // Additional plans - get looms from additionalLooms state for each loom type
    const additionalLoomsList = additionalLoomPlans
      .filter((row) => row.loomType && row.loomType !== formData.loomType)
      .flatMap((row) => additionalLooms[row.loomType] || []);

    // Dedupe by id and combine
    const map = new Map<string, Loom>();
    [...mainLooms, ...additionalLoomsList].forEach((loom) => {
      map.set(loom.id, loom);
    });

    return Array.from(map.values());
  }, [formData.loomType, availableLooms, additionalLoomPlans, additionalLooms]);

  const getAllLoomPlans = () => {
    const mainLoomPlan = {
      loomType: formData.loomType,
      loomsRequired: formData.loomsRequired
        ? parseInt(formData.loomsRequired)
        : 0,
      loomsPlanned: formData.loomsPlanned ? parseInt(formData.loomsPlanned) : 0,
      loomspeed: formData.loomSpeed ? parseFloat(formData.loomSpeed) : null,
      loomwidth: formData.widthLoom ? parseFloat(formData.widthLoom) : null,
      loombeam: formData.beamLoom ? parseFloat(formData.beamLoom) : null,
      productionperdayloom: formData.productionPerDayLoom
        ? parseFloat(formData.productionPerDayLoom)
        : null,
      availabledays: formData.availableDays
        ? parseInt(formData.availableDays)
        : null,
    };
    const additionalPlans = additionalLoomPlans.map((row) => ({
      loomType: row.loomType,
      loomsRequired: row.loomsRequired ? parseInt(row.loomsRequired) : 0,
      loomsPlanned: row.loomsPlanned ? parseInt(row.loomsPlanned) : 0,
      loomspeed: row.loomSpeed ? parseFloat(row.loomSpeed) : null,
      loomwidth: row.widthLoom ? parseFloat(row.widthLoom) : null,
      loombeam: row.beamLoom ? parseFloat(row.beamLoom) : null,
      productionperdayloom: row.productionPerDayLoom
        ? parseFloat(row.productionPerDayLoom)
        : null,
      availabledays: row.availableDays ? parseInt(row.availableDays) : null,
    }));
    return [mainLoomPlan, ...additionalPlans].filter((plan) => plan.loomType);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const allLoomPlans = getAllLoomPlans();
      if (mode === "edit" && orderId) {
        const payload = {
          // Basic order details
          customer: formData.customer,
          buyerPO: formData.buyerPO,
          checklist: formData.checklist,
          fabrictype: formData.fabric,
          deliverydate: formData.deliveryDate,
          meters: parseFloat(formData.meters) || 0,
          gsm: formData.gsm ? parseFloat(formData.gsm) : null,
          rate: formData.rate ? parseFloat(formData.rate) : null,

          // Construction values
          construction1: formData.construction1,
          construction2: formData.construction2,
          construction3: formData.construction3,
          construction4: formData.construction4,
          construction5: formData.construction5,

          // Technical specifications
          fabricstock: formData.fabricStock
            ? parseFloat(formData.fabricStock)
            : 0,
          tobeproduced:
            parseFloat(formData.toBeProduced) ||
            parseFloat(formData.meters) ||
            0,
          endsdents: formData.endsDents ? parseFloat(formData.endsDents) : null,
          warpendsbeam: formData.warpEndsBeam
            ? parseFloat(formData.warpEndsBeam)
            : null,
          warpcrimp: formData.warpCrimp ? parseFloat(formData.warpCrimp) : null,
          warpmeterrequired: formData.warpMeterReqd
            ? parseFloat(formData.warpMeterReqd)
            : null,
          warpyarncount: formData.warpYarnCount,
          warpyarnmill: formData.warpYarnMill,
          reedyarnkgs: formData.reedYarnKgs
            ? parseFloat(formData.reedYarnKgs)
            : null,
          partialDispatchQty: formData.partialDispatchQty
            ? parseFloat(formData.partialDispatchQty)
            : null,
          reedonloom: formData.reedOnLoom
            ? parseFloat(formData.reedOnLoom)
            : null,
          reedspace: formData.reedSpace ? parseFloat(formData.reedSpace) : null,
          flangewidth: formData.flangeWidth
            ? parseFloat(formData.flangeWidth)
            : null,
          weftgmsmtr: formData.weftGmsMtr
            ? parseFloat(formData.weftGmsMtr)
            : null,
          weftyarncount: formData.weftYarnCount,
          weftyarnmill: formData.weftYarnMill,
          weftyarnkgs: formData.weftYarnKgs
            ? parseFloat(formData.weftYarnKgs)
            : null,

          // Loom planning
          loomtype: allLoomPlans.map((plan) => plan.loomType),
          loomSpeed: formData.loomSpeed,
          widthLoom: formData.widthLoom,
          beamLoom: formData.beamLoom,
          productionPerDayLoom:
            allLoomPlans.length > 1
              ? multiLoomSummary.avgProductionPerDay
              : formData.productionPerDayLoom,
          availableDays: formData.availableDays,
          loomsRequired: formData.loomsRequired,
          loomsPlanned: formData.loomsPlanned,

          // Selected looms with all details
          selectedLooms: formData.selectedLooms.map((loom) => ({
            id: loom.id,
            name: loom.name,
            loomtype: loom.loomtype,
            status: loom.status,
            efficiency: loom.efficiency,
            currentorder: loom.currentorder,
            nextmaintenance: loom.nextmaintenance,
            location: loom.location,
            manufacturer: loom.manufacturer,
            model: loom.model,
            assignedweaver: loom.assignedweaver,
            assignedweaverid: loom.assignedweaverid,
            width: loom.width,
            reedspace: loom.reedspace,
            maxrpm: loom.maxrpm,
            createddate: loom.createddate,
            updateddate: loom.updateddate,
            createdby: loom.createdby,
            updatedby: loom.updatedby,
            loomspeed: loom.loomspeed,
          })),

          // Additional order metadata

          isJobWork: formData.isJobWork,
          orderDate: new Date().toISOString().split("T")[0],
          jobStatus: formData.isJobWork ? "Job Work" : "Planning",
          progress: 0,
          unit: "meters",
          quantity: parseInt(formData.toBeProduced) || 0,
          priority: parseInt(formData.toBeProduced) > 10000 ? "High" : "Medium",
        };
        await ENDPOINTS.updateOrder(orderId, payload);
        toast({
          title: "Order Updated Successfully",
          description: `Order #${gptId || orderId} has been updated.`,
        });
        onSubmit?.({ ...payload, id: orderId });

        setIsOpen(false);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const orderData = {
          ...formData,
          loomtype: allLoomPlans.map((plan) => plan.loomType),
          productionPerDayLoom:
            allLoomPlans.length > 1
              ? multiLoomSummary.avgProductionPerDay
              : formData.productionPerDayLoom,

          // ..
          gptid: gptId || `GPT-${Date.now().toString().slice(-3)}`,
          orderDate: new Date().toISOString().split("T")[0],
          jobStatus: formData.isJobWork ? "Job Work" : "Planning",
          progress: 0,
          unit: "meters",
          quantity: parseInt(formData.toBeProduced) || 0,
          priority: parseInt(formData.toBeProduced) > 10000 ? "High" : "Medium",
        };
        const response = await ENDPOINTS.createOrder(orderData);
        if (response.status == 201) {
          toast({
            title: "Success",
            description: formData.isJobWork
              ? "Job Work order created successfully!"
              : "Order created with full production planning!",
          });
        }
        onSubmit?.(orderData);
        setIsOpen(false);
        // Reset form after successful creation
        setFormData({
          customer: "",
          buyerPO: "",
          construction1: "",
          construction2: "",
          construction3: "",
          construction4: "",
          construction5: "",
          checklist: "",
          fabric: "",
          deliveryDate: "",
          meters: "",
          gsm: "",
          rate: "",
          fabricStock: "",
          toBeProduced: "",
          endsDents: "",
          warpEndsBeam: "",
          warpCrimp: "",
          warpMeterReqd: "",
          warpYarnCount: "",
          warpYarnMill: "",
          reedYarnKgs: "",
          reedOnLoom: "",
          reedSpace: "",
          flangeWidth: "",
          weftGmsMtr: "",
          weftYarnCount: "",
          weftYarnMill: "",
          weftYarnKgs: "",
          loomType: "",
          loomSpeed: "",
          widthLoom: "",
          beamLoom: "",
          partialDispatchQty: "",
          productionPerDayLoom: "",
          availableDays: "",
          loomsRequired: "",
          loomsPlanned: "",
          selectedLooms: [],
          isJobWork: false,
          // timeActionPlan: [],
          // tasks: [],
        });
        setAdditionalLoomPlans([]);
        setAdditionalLooms({});
        setCurrentStep(0);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to create order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    "Order & Technical Details",
    "Production Planning",
    "Loom Assignment",
    "Review & Submit",
  ];
  const multiLoomSummary = useMemo(() => {
    const toBeProducedNum = parseFloat(formData.toBeProduced) || 0;
    const availableDaysNum = parseFloat(formData.availableDays) || 0;
    const rows = [
      {
        loomType: formData.loomType,
        loomSpeed: formData.loomSpeed,
        productionPerDayLoom: formData.productionPerDayLoom,
      },
      ...additionalLoomPlans.map((r) => ({
        loomType: r.loomType,
        loomSpeed: r.loomSpeed,
        productionPerDayLoom: r.productionPerDayLoom,
      })),
    ].filter((r) => r.loomType);
    if (rows.length <= 1) {
      return {
        hasMultiple: false,
        avgLoomSpeed: "0",
        avgProductionPerDay: "0.0",
        avgLoomsRequired: "0",
        splitText: "",
        splitByType: [] as { loomType: string; looms: number }[],
      };
    }
    const speeds = rows
      .map((r) => parseFloat(r.loomSpeed) || 0)
      .filter((n) => n > 0);
    const productions = rows
      .map((r) => parseFloat(r.productionPerDayLoom) || 0)
      .filter((n) => n > 0);
    const avgSpeed =
      speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const avgProduction =
      productions.length > 0
        ? productions.reduce((a, b) => a + b, 0) / productions.length
        : 0;
    const avgRequiredRaw =
      toBeProducedNum > 0 && availableDaysNum > 0 && avgProduction > 0
        ? toBeProducedNum / availableDaysNum / avgProduction
        : 0;
    const avgRequired = Math.ceil(avgRequiredRaw);
    const typeStats = rows
      .map((r) => ({
        loomType: r.loomType,
        productionPerDay: parseFloat(r.productionPerDayLoom) || 0,
      }))
      .filter((t) => t.loomType && t.productionPerDay > 0);
    if (avgRequired <= 0 || typeStats.length === 0) {
      return {
        hasMultiple: true,
        avgLoomSpeed: avgSpeed.toFixed(0),
        avgProductionPerDay: avgProduction.toFixed(1),
        avgLoomsRequired: avgRequired.toString(),
        splitText: "",
        splitByType: [] as { loomType: string; looms: number }[],
      };
    }
    const weights = typeStats.map((t) => 1 / t.productionPerDay);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const rawAlloc = typeStats.map((t, idx) => {
      const share =
        totalWeight > 0 ? (avgRequired * weights[idx]) / totalWeight : 0;
      const floored = Math.floor(share);
      return {
        loomType: t.loomType,
        base: floored,
        frac: share - floored,
      };
    });
    let remaining = avgRequired - rawAlloc.reduce((a, b) => a + b.base, 0);
    rawAlloc.sort((a, b) => b.frac - a.frac);
    const finalAlloc = rawAlloc.map((a) => ({
      loomType: a.loomType,
      looms: a.base,
    }));
    let idx = 0;
    while (remaining > 0 && finalAlloc.length > 0) {
      finalAlloc[idx % finalAlloc.length].looms += 1;
      remaining -= 1;
      idx += 1;
    }
    finalAlloc.sort((a, b) => a.loomType.localeCompare(b.loomType));
    const splitText = finalAlloc
      .map((a) => `${a.looms} from ${a.loomType}`)
      .join(" and ");
    return {
      hasMultiple: true,
      avgLoomSpeed: avgSpeed.toFixed(0),
      avgProductionPerDay: avgProduction.toFixed(1),
      avgLoomsRequired: avgRequired.toString(),
      splitText,
      splitByType: finalAlloc,
    };
  }, [
    additionalLoomPlans,
    formData.availableDays,
    formData.loomSpeed,
    formData.loomType,
    formData.productionPerDayLoom,
    formData.toBeProduced,
  ]);
  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Clean up additional looms when dialog is closed
            setAdditionalLooms({});
          }
          setIsOpen(open);
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              {mode === "edit"
                ? `Update Order #${gptId} - ${steps[currentStep]}`
                : `Create New Order - ${steps[currentStep]}`}
            </DialogTitle>
            <DialogDescription>
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </DialogDescription>
          </DialogHeader>
          {mode === "edit" && isLoadingOrder ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
              <p className="text-lg">Loading order details...</p>
            </div>
          ) : (
            <Tabs value={currentStep.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={index}
                    value={index.toString()}
                    disabled={index > currentStep}
                    className={index <= currentStep ? "text-primary" : ""}
                  >
                    {step}
                  </TabsTrigger>
                ))}
              </TabsList>
              {/* Step 1: Order & Technical Details */}
              <TabsContent value="0" className="space-y-6">
                {/* Basic Order Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="customer">Customer *</Label>
                      <Input
                        id="customer"
                        value={formData.customer}
                        onChange={(e) =>
                          handleInputChange("customer", e.target.value)
                        }
                        placeholder="Customer name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="buyerPO">Buyer PO No</Label>
                      <Input
                        id="buyerPO"
                        value={formData.buyerPO}
                        onChange={(e) =>
                          handleInputChange("buyerPO", e.target.value)
                        }
                        placeholder="Buyer purchase order"
                      />
                    </div>
                    <div>
                      <Label htmlFor="meters">Meters *</Label>
                      <Input
                        id="meters"
                        type="number"
                        value={formData.meters}
                        onChange={(e) => {
                          // Keep both fields in sync
                          handleInputChange("meters", e.target.value);
                          // handleInputChange("toBeProduced", e.target.value);
                        }}
                        placeholder="12000.00"
                        required
                      />
                      {mode === "edit" && (
                        <p className="text-xs text-gray-500 mt-1">
                          = To be Produced - Actual Production
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gsm">GSM</Label>
                      <Input
                        id="gsm"
                        type="number"
                        value={formData.gsm}
                        onChange={(e) =>
                          handleInputChange("gsm", e.target.value)
                        }
                        placeholder="187"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate">Rate</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={(e) =>
                          handleInputChange("rate", e.target.value)
                        }
                        placeholder="63.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryDate">Delivery Date *</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) =>
                          handleInputChange("deliveryDate", e.target.value)
                        }
                        required
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checklist">Checklist</Label>
                      <Input
                        id="checklist"
                        value={formData.checklist}
                        onChange={(e) =>
                          handleInputChange("checklist", e.target.value)
                        }
                        placeholder="e.g., H/B (Blue Stripe)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fabric">Fabric Type *</Label>
                      <Input
                        id="fabric"
                        value={formData.fabric}
                        onChange={(e) =>
                          handleInputChange("fabric", e.target.value)
                        }
                        placeholder="e.g., Cotton Twill"
                        required
                      />
                    </div>
                  </div>
                  {/* Construction Fields - 5 separate inputs */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-blue-800 mb-2 block">
                      Construction (5 Values) *
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <Input
                          value={formData.construction1}
                          onChange={(e) =>
                            handleInputChange("construction1", e.target.value)
                          }
                          placeholder="10"
                          className="text-center"
                          required
                        />
                        <Label className="text-xs text-gray-500 text-center block mt-1">
                          Warp Count
                        </Label>
                      </div>
                      <div>
                        <Input
                          value={formData.construction2}
                          onChange={(e) =>
                            handleInputChange("construction2", e.target.value)
                          }
                          placeholder="10"
                          className="text-center"
                          required
                        />
                        <Label className="text-xs text-gray-500 text-center block mt-1">
                          Weft Count
                        </Label>
                      </div>
                      <div>
                        <Input
                          value={formData.construction3}
                          onChange={(e) =>
                            handleInputChange("construction3", e.target.value)
                          }
                          placeholder="44"
                          className="text-center"
                          required
                        />
                        <Label className="text-xs text-gray-500 text-center block mt-1">
                          End Per Inch
                        </Label>
                      </div>
                      <div>
                        <Input
                          value={formData.construction4}
                          onChange={(e) =>
                            handleInputChange("construction4", e.target.value)
                          }
                          placeholder="30"
                          className="text-center"
                          required
                        />
                        <Label className="text-xs text-gray-500 text-center block mt-1">
                          Pick Per Inch
                        </Label>
                      </div>
                      <div>
                        <Input
                          value={formData.construction5}
                          onChange={(e) =>
                            handleInputChange("construction5", e.target.value)
                          }
                          placeholder="72"
                          className="text-center"
                          required
                        />
                        <Label className="text-xs text-gray-500 text-center block mt-1">
                          Width Fabric
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Warp & Weft - Yarn Requirement Calculation */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-3">
                    Warp & Weft - Yarn Requirement Calculation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="fabricStock">Fabric Stock</Label>
                      <Input
                        id="fabricStock"
                        value={formData.fabricStock}
                        onChange={(e) =>
                          handleInputChange("fabricStock", e.target.value)
                        }
                        placeholder="Current stock"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toBeProduced">
                        To be Produced (meters) *
                      </Label>
                      <Input
                        id="toBeProduced"
                        type="number"
                        value={formData.toBeProduced}
                        // onChange={(e) => {
                        // // Keep both fields in sync
                        // handleInputChange("toBeProduced", e.target.value);
                        // handleInputChange("meters", e.target.value);
                        // }}
                        placeholder="12000"
                        className="bg-yellow-100"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-synced with Meters field
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="endsDents">Ends/Dents</Label>
                      <Input
                        id="endsDents"
                        type="number"
                        value={formData.endsDents}
                        onChange={(e) =>
                          handleInputChange("endsDents", e.target.value)
                        }
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warpEndsBeam">Warp Ends/Beam</Label>
                      <Input
                        id="warpEndsBeam"
                        value={formData.warpEndsBeam}
                        onChange={(e) =>
                          handleInputChange("warpEndsBeam", e.target.value)
                        }
                        placeholder="Auto-calculated"
                        className="bg-yellow-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = MROUND((Value3×Value5)+16, 4)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="warpCrimp">Warp Crimp%</Label>
                      <Input
                        id="warpCrimp"
                        value={formData.warpCrimp}
                        onChange={(e) =>
                          handleInputChange("warpCrimp", e.target.value)
                        }
                        placeholder="10.0"
                        className="bg-yellow-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warpMeterReqd">Warp Meter Reqd</Label>
                      <Input
                        id="warpMeterReqd"
                        value={formData.warpMeterReqd}
                        onChange={(e) =>
                          handleInputChange("warpMeterReqd", e.target.value)
                        }
                        placeholder="Auto-calculated"
                        className="bg-yellow-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = (To Produce × Warp Crimp%) + To Produce
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="warpYarnCount">Warp Yarn Count</Label>
                      <Input
                        id="warpYarnCount"
                        value={formData.warpYarnCount}
                        onChange={(e) =>
                          handleInputChange("warpYarnCount", e.target.value)
                        }
                        placeholder="From Warp Count"
                        className="bg-blue-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = Construction Warp Count
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="warpYarnMill">Warp Yarn Mill</Label>
                      <Input
                        id="warpYarnMill"
                        value={formData.warpYarnMill}
                        onChange={(e) =>
                          handleInputChange("warpYarnMill", e.target.value)
                        }
                        placeholder="Sivaraj Republic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reedYarnKgs">Reqd Yarn in KGS</Label>
                      <Input
                        id="reedYarnKgs"
                        value={formData.reedYarnKgs}
                        onChange={(e) =>
                          handleInputChange("reedYarnKgs", e.target.value)
                        }
                        placeholder="Auto-calculated"
                        className="bg-yellow-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = ROUND((Warp Meter × Ends/Beam)/(1693 × Yarn Count), 0)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="partialDispatchQty">
                        Partial Dispatch Qty (meters)
                      </Label>
                      <Input
                        id="partialDispatchQty"
                        type="number"
                        value={formData.partialDispatchQty}
                        onChange={(e) =>
                          handleInputChange(
                            "partialDispatchQty",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., 4000 (optional)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the quantity for first/partial dispatch. Leave
                        blank if full delivery.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Production Details */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">
                    Production Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="reedOnLoom">Reed on Loom</Label>
                      <Input
                        id="reedOnLoom"
                        value={formData.reedOnLoom}
                        onChange={(e) =>
                          handleInputChange("reedOnLoom", e.target.value)
                        }
                        placeholder="40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reedSpace">Reed Space (Inches)</Label>
                      <Input
                        id="reedSpace"
                        value={formData.reedSpace}
                        readOnly
                        className="bg-yellow-100"
                        placeholder="Auto-calculated"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = ((Warp Ends/Beam × 2) / (Reed on Loom × Ends/Dents)) +
                        3
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="flangeWidth">Flange Width (Inches)</Label>
                      <Input
                        id="flangeWidth"
                        value={formData.flangeWidth}
                        onChange={(e) =>
                          handleInputChange("flangeWidth", e.target.value)
                        }
                        placeholder="80.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weftGmsMtr">Weft Gms/Mtr</Label>
                      <Input
                        id="weftGmsMtr"
                        value={formData.weftGmsMtr}
                        onChange={(e) =>
                          handleInputChange("weftGmsMtr", e.target.value)
                        }
                        placeholder="Auto-calculated"
                        className="bg-yellow-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = Reed Space × Pick Per Inch × 0.00059 / Value2
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="weftYarnCount">Weft Yarn Count</Label>
                      <Input
                        id="weftYarnCount"
                        value={formData.weftYarnCount}
                        onChange={(e) =>
                          handleInputChange("weftYarnCount", e.target.value)
                        }
                        placeholder="From Weft Count"
                        className="bg-blue-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = Construction Weft Count
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="weftYarnMill">Weft Yarn Mill</Label>
                      <Input
                        id="weftYarnMill"
                        value={formData.weftYarnMill}
                        onChange={(e) =>
                          handleInputChange("weftYarnMill", e.target.value)
                        }
                        placeholder="Sivaraj Republic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weftYarnKgs">Weft Yarn (Kgs)</Label>
                      <Input
                        id="weftYarnKgs"
                        value={formData.weftYarnKgs}
                        onChange={(e) =>
                          handleInputChange("weftYarnKgs", e.target.value)
                        }
                        placeholder="Auto-calculated"
                        className="bg-yellow-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = ROUND((To Produce × Weft Gms/Mtr), 0)
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              {/* Step 2: Production Planning */}
              <TabsContent value="1" className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-3">
                    Production Planning & Loom Calculation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="loomType">Loom Type</Label>
                      <Select
                        value={formData.loomType}
                        onValueChange={(value) =>
                          handleInputChange("loomType", value)
                        }
                        disabled={loadingLoomTypes}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingLoomTypes
                                ? "Loading loom types..."
                                : "Select loom type"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingLoomTypes ? (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : loomTypes.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No loom types available
                            </SelectItem>
                          ) : (
                            loomTypes.map((lt) => (
                              <SelectItem key={lt.id} value={lt.loomtype}>
                                {lt.loomtype}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="loomSpeed">Loom Speed</Label>
                      <Input
                        id="loomSpeed"
                        value={formData.loomSpeed}
                        readOnly
                        className="bg-gray-100 font-medium cursor-not-allowed"
                        placeholder="Auto-filled from loom type"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled with most common speed for{" "}
                        {formData.loomType || "selected"} looms
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="widthLoom">Width/Loom</Label>
                      <Input
                        id="widthLoom"
                        value={formData.widthLoom}
                        onChange={(e) =>
                          handleInputChange("widthLoom", e.target.value)
                        }
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="beamLoom">Beam/Loom</Label>
                      <Input
                        id="beamLoom"
                        value={formData.beamLoom}
                        onChange={(e) =>
                          handleInputChange("beamLoom", e.target.value)
                        }
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productionPerDayLoom">
                        Prdn/Day/Loom (meters)
                      </Label>
                      <Input
                        id="productionPerDayLoom"
                        value={formData.productionPerDayLoom}
                        readOnly
                        className="bg-yellow-100 font-medium"
                        placeholder="Auto-calculated"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = (Speed × 60 × 24 × 0.65) / (39.36 × Pick Per Inch) ×
                        Width/Loom
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="availableDays">Available Days</Label>
                      <Input
                        id="availableDays"
                        value={formData.availableDays}
                        onChange={(e) =>
                          handleInputChange("availableDays", e.target.value)
                        }
                        placeholder="Auto-calculated"
                        className="bg-yellow-100"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = Delivery Date - Order Date
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="loomsRequired">Looms Required</Label>
                      <Input
                        id="loomsRequired"
                        value={formData.loomsRequired}
                        readOnly
                        className="bg-red-100 font-bold"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = CEILING(ToBeProduced / AvailableDays / Prdn/Day/Loom)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="loomsPlanned">Looms Planned</Label>
                      <Input
                        id="loomsPlanned"
                        value={formData.loomsPlanned}
                        onChange={(e) =>
                          handleInputChange("loomsPlanned", e.target.value)
                        }
                        placeholder="Ceiling of required"
                        className="bg-blue-100 font-bold"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = 3.5 becomes 4
                      </p>
                    </div>
                    {/* Add Loom Button */}
                    <div className="flex justify-start mt-6">
                      <Button
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() =>
                          setAdditionalLoomPlans((prev) => [
                            ...prev,
                            createNewLoomPlanRow(),
                          ])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Loom
                      </Button>
                    </div>
                  </div>
                  {multiLoomSummary.hasMultiple && (
                    <div className="mt-6 bg-white p-4 rounded-lg border border-purple-200">
                      <div className="font-semibold text-purple-800 mb-2">
                        Multiple Loom Types Summary
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">
                            Average Loom Speed
                          </div>
                          <div className="font-medium">
                            {multiLoomSummary.avgLoomSpeed}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">
                            Average Prdn/Day/Loom (m)
                          </div>
                          <div className="font-medium">
                            {multiLoomSummary.avgProductionPerDay}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">
                            Average Looms Required
                          </div>
                          <div className="font-semibold text-red-600">
                            {multiLoomSummary.avgLoomsRequired}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Recommended Split</div>
                          <div className="font-medium">
                            {multiLoomSummary.splitText ||
                              "Fill loom speeds/width to get split"}
                          </div>
                        </div>
                      </div>
                      {multiLoomSummary.splitByType.length > 0 && (
                        <div className="mt-3 text-xs text-gray-500">
                          Average looms required for this order is{" "}
                          {multiLoomSummary.avgLoomsRequired}, so you have to
                          select {multiLoomSummary.splitText}.
                        </div>
                      )}
                    </div>
                  )}
                  {additionalLoomPlans.length > 0 && (
                    <div className="mt-6 space-y-6">
                      {additionalLoomPlans.map((row, idx) => (
                        <div
                          key={row.id}
                          className="bg-white p-4 rounded-lg border border-purple-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-purple-800">
                              Loom Calculation {idx + 2}
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeAdditionalLoomPlan(row.id)}
                              aria-label="Remove loom"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor={`loomType-${row.id}`}>
                                Loom Type
                              </Label>
                              <Select
                                value={row.loomType}
                                onValueChange={async (value) => {
                                  updateAdditionalLoomPlan(
                                    row.id,
                                    "loomType",
                                    value,
                                  );

                                  try {
                                    const response =
                                      await ENDPOINTS.getByLoomType(value);
                                    const fetchedLooms =
                                      response.data?.looms || [];
                                    if (
                                      response.data?.message &&
                                      fetchedLooms.length === 0
                                    ) {
                                      toast({
                                        variant: "destructive",
                                        title: "No Looms Available",
                                        description: response.data.message,
                                      });
                                    }

                                    // No caching needed - fetch directly when needed

                                    const mostCommonSpeed =
                                      fetchedLooms.length > 0
                                        ? Object.keys(
                                            fetchedLooms.reduce(
                                              (
                                                acc: Record<string, number>,
                                                loom: any,
                                              ) => {
                                                const speed =
                                                  loom.loomspeed || "0";
                                                acc[speed] =
                                                  (acc[speed] || 0) + 1;
                                                return acc;
                                              },
                                              {},
                                            ),
                                          ).sort((a, b) => {
                                            const countA = fetchedLooms.filter(
                                              (loom) => loom.loomspeed === a,
                                            ).length;
                                            const countB = fetchedLooms.filter(
                                              (loom) => loom.loomspeed === b,
                                            ).length;
                                            return countB - countA;
                                          })[0]
                                        : "";

                                    updateAdditionalLoomPlan(
                                      row.id,
                                      "loomSpeed",
                                      mostCommonSpeed,
                                    );
                                  } catch (err) {
                                    console.error(
                                      "Failed to fetch loom speed:",
                                      err,
                                    );
                                    updateAdditionalLoomPlan(
                                      row.id,
                                      "loomSpeed",
                                      "",
                                    );
                                  }
                                }}
                                disabled={loadingLoomTypes}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingLoomTypes
                                        ? "Loading loom types..."
                                        : "Select loom type"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingLoomTypes ? (
                                    <SelectItem value="loading" disabled>
                                      Loading...
                                    </SelectItem>
                                  ) : loomTypes.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      No loom types available
                                    </SelectItem>
                                  ) : (
                                    loomTypes.map((lt) => (
                                      <SelectItem
                                        key={lt.id}
                                        value={lt.loomtype}
                                      >
                                        {lt.loomtype}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`loomSpeed-${row.id}`}>
                                Loom Speed
                              </Label>
                              <Input
                                id={`loomSpeed-${row.id}`}
                                value={row.loomSpeed}
                                readOnly
                                className="bg-gray-100 font-medium cursor-not-allowed"
                                placeholder="Auto-filled from loom type"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`widthLoom-${row.id}`}>
                                Width/Loom
                              </Label>
                              <Input
                                id={`widthLoom-${row.id}`}
                                value={row.widthLoom}
                                onChange={(e) =>
                                  updateAdditionalLoomPlan(
                                    row.id,
                                    "widthLoom",
                                    e.target.value,
                                  )
                                }
                                placeholder="1.0"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`beamLoom-${row.id}`}>
                                Beam/Loom
                              </Label>
                              <Input
                                id={`beamLoom-${row.id}`}
                                value={row.beamLoom}
                                onChange={(e) =>
                                  updateAdditionalLoomPlan(
                                    row.id,
                                    "beamLoom",
                                    e.target.value,
                                  )
                                }
                                placeholder="1.0"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`productionPerDayLoom-${row.id}`}>
                                Prdn/Day/Loom (meters)
                              </Label>
                              <Input
                                id={`productionPerDayLoom-${row.id}`}
                                value={row.productionPerDayLoom}
                                readOnly
                                className="bg-yellow-100 font-medium"
                                placeholder="Auto-calculated"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`availableDays-${row.id}`}>
                                Available Days
                              </Label>
                              <Input
                                id={`availableDays-${row.id}`}
                                value={row.availableDays}
                                readOnly
                                className="bg-yellow-100"
                                placeholder="Auto-calculated"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`loomsRequired-${row.id}`}>
                                Looms Required
                              </Label>
                              <Input
                                id={`loomsRequired-${row.id}`}
                                value={row.loomsRequired}
                                readOnly
                                className="bg-red-100 font-bold"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`loomsPlanned-${row.id}`}>
                                Looms Planned
                              </Label>
                              <Input
                                id={`loomsPlanned-${row.id}`}
                                value={row.loomsPlanned}
                                readOnly
                                className="bg-blue-100 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              {/* Step 3: Loom Assignment */}
              <TabsContent value="2" className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  {/* <h3 className="font-medium mb-2">
                    Available Looms: {formData.loomType || "Please select a loom type first"}
                  </h3> */}
                  <p className="text-sm text-gray-600 mb-4">
                    Required: <strong>{formData.loomsRequired || 0}</strong>
                    {multiLoomSummary.hasMultiple && (
                      <>
                        {" "}
                        | Required (avg):{" "}
                        <strong>{multiLoomSummary.avgLoomsRequired}</strong>
                      </>
                    )}{" "}
                    | Selected: <strong>{formData.selectedLooms.length}</strong>
                  </p>
                  {multiLoomSummary.hasMultiple &&
                    multiLoomSummary.splitByType.length > 0 && (
                      <p className="text-sm text-gray-700">
                        Average looms required for this order is{" "}
                        <strong>{multiLoomSummary.avgLoomsRequired}</strong>, so
                        you have to select{" "}
                        <strong>{multiLoomSummary.splitText}</strong>.
                      </p>
                    )}
                </div>

                {/* Show existing looms in edit mode */}
                {mode === "edit" && formData.selectedLooms.length > 0 && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                      <Factory className="mr-2 h-4 w-4" />
                      Currently Assigned Looms ({formData.selectedLooms.length})
                    </h4>
                    <p className="text-sm text-amber-700 mb-4">
                      These looms are already assigned to this order. You can
                      keep them as-is or modify the selection.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formData.selectedLooms.map((loom) => (
                        <div
                          key={loom.id}
                          className="border-2 border-amber-300 bg-amber-100 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-lg">{loom.name}</div>
                            <Badge
                              className={
                                loom.status === "Idle"
                                  ? "bg-green-500 text-white"
                                  : loom.status === "Running"
                                    ? "bg-blue-500 text-white"
                                    : "bg-yellow-500 text-white"
                              }
                            >
                              {loom.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-700">
                            <div>
                              <strong>Type:</strong> {loom.loomtype}
                            </div>
                            <div>
                              <strong>Efficiency:</strong> {loom.efficiency}%
                            </div>
                            <div>
                              <strong>Max RPM:</strong> {loom.maxrpm || "None"}
                            </div>
                            {loom.assignedweaver && (
                              <div>
                                <strong>Weaver:</strong> {loom.assignedweaver}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {loadingLooms ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                    <p>Loading looms...</p>
                  </div>
                ) : loomsError ? (
                  <div className="text-center py-12 text-red-600">
                    Failed to load looms. Please try again.
                  </div>
                ) : allAvailableLoomsForAssignment.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    {formData.loomType ||
                    additionalLoomPlans.some((plan) => plan.loomType)
                      ? "No looms are currently available for any of the selected loom types."
                      : "Select a loom type in the previous step to see available looms."}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(
                      allAvailableLoomsForAssignment.reduce(
                        (acc, loom) => {
                          const type = loom.loomtype || "Other";
                          if (!acc[type]) {
                            acc[type] = [];
                          }
                          acc[type].push(loom);
                          return acc;
                        },
                        {} as Record<
                          string,
                          typeof allAvailableLoomsForAssignment
                        >,
                      ),
                    ).map(([loomType, looms]) => (
                      <div key={loomType} className="space-y-3">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          {loomType} Looms
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({looms.length} available)
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {looms.map((loom) => (
                            <div
                              key={loom.id}
                              className={`border-2 rounded-lg p-5 transition-all cursor-pointer
                                ${
                                  formData.selectedLooms.some(
                                    (l) => l.id === loom.id,
                                  )
                                    ? "border-blue-500 bg-blue-50 shadow-lg"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              onClick={() =>
                                handleLoomSelection(
                                  loom,
                                  !formData.selectedLooms.some(
                                    (l) => l.id === loom.id,
                                  ),
                                )
                              }
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={formData.selectedLooms.some(
                                      (l) => l.id === loom.id,
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleLoomSelection(
                                        loom,
                                        checked as boolean,
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div>
                                    <div className="font-bold text-lg">
                                      {loom.name}
                                    </div>
                                    <Badge
                                      className={
                                        loom.status === "Idle"
                                          ? "bg-green-500 text-white"
                                          : loom.status === "Running"
                                            ? "bg-blue-500 text-white"
                                            : "bg-yellow-500 text-white"
                                      }
                                    >
                                      {loom.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1 text-sm text-gray-700">
                                <div>
                                  <strong>Efficiency:</strong> {loom.efficiency}
                                  %
                                </div>
                                <div>
                                  <strong>Max RPM:</strong>{" "}
                                  {loom.maxrpm || "None"}
                                </div>
                                <div>
                                  <strong>Next Maintenance:</strong>{" "}
                                  {new Date(
                                    loom.nextmaintenance,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500 pt-2 border-t">
                                  {loom.manufacturer} {loom.model} • Max RPM:{" "}
                                  {loom.maxrpm}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {formData.selectedLooms.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="font-medium mb-2">
                      Selected Looms ({formData.selectedLooms.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedLooms.map((loom) => (
                        <Badge
                          key={loom.id}
                          variant="outline"
                          className="text-sm py-1"
                        >
                          <span className="font-medium">{loom.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({loom.loomtype})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Step 4: Review & Submit */}
              <TabsContent value="3" className="space-y-6">
                {formData.isJobWork ? (
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-800 mb-3">
                      Job Work Order
                    </h3>
                    <p className="text-orange-700">
                      This order is marked as Job Work. No T&A planning
                      required. Production will be handled externally.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">T&A Planning Preview</h3>
                    <p className="text-sm text-gray-600">
                      Individual T&A plans will be generated for each selected
                      loom:
                    </p>
                    <div className="mt-4 space-y-2">
                      {formData.selectedLooms.map((loom) => (
                        <div
                          key={loom.id}
                          className="bg-white p-3 rounded border"
                        >
                          <h4 className="font-medium">{loom.name} T&A Plan</h4>
                          <p className="text-sm text-gray-600">
                            Individual timeline and processes for loom{" "}
                            <strong>{loom.name}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Order Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Customer:</strong> {formData.customer}
                    </div>
                    <div>
                      <strong>Meters:</strong> {formData.meters} meters
                    </div>
                    <div>
                      <strong>Construction:</strong>{" "}
                      {[
                        formData.construction1,
                        formData.construction2,
                        formData.construction3,
                        formData.construction4,
                        formData.construction5,
                      ]
                        .filter(Boolean)
                        .join(" x ")}
                    </div>
                    <div>
                      <strong>GSM:</strong> {formData.gsm} |{" "}
                      <strong>Rate:</strong> {formData.rate}
                    </div>
                    <div>
                      <strong>Fabric:</strong> {formData.fabric}
                    </div>
                    <div>
                      <strong>Loom Type:</strong> {formData.loomType}
                    </div>
                    <div>
                      <strong>Looms Required:</strong> {formData.loomsRequired}{" "}
                      | <strong>Selected:</strong>{" "}
                      {formData.selectedLooms.length}
                    </div>
                    <div>
                      <strong>Selected Looms:</strong>{" "}
                      {formData.selectedLooms.length > 0
                        ? formData.selectedLooms
                            .map(
                              (loom) =>
                                `${loom.name} (${loom.loomtype || "N/A"})`,
                            )
                            .join(", ")
                        : "None"}
                    </div>
                    <div>
                      <strong>Order Type:</strong>{" "}
                      {formData.isJobWork ? "Job Work" : "Regular Production"}
                    </div>
                    <div>
                      <strong>Delivery Date:</strong> {formData.deliveryDate}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handlePrevious}
              disabled={isSubmitting}
            >
              {currentStep === 0 ? "Cancel" : "Previous"}
            </Button>
            {currentStep < 3 ? (
              <div className="relative group">
                <Button onClick={handleNext}>Next</Button>
              </div>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {mode === "edit"
                      ? "Updating Order..."
                      : "Creating Order..."}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {mode === "edit" ? "Update Order" : "Create Order"}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Loom Mismatch Alert Dialog */}
      <Dialog open={loomMismatchAlert} onOpenChange={setLoomMismatchAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Production Planning Alert
            </DialogTitle>
            <DialogDescription>
              Looms required doesn't match looms
              selected ({formData.selectedLooms.length}). Production cannot be
              planned with current loom allocation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Do you want to mark this order as <strong>Job Work</strong>?
            </p>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleJobWorkConfirmation(false)}
                className="flex-1"
              >
                No, Adjust Looms
              </Button>
              <Button
                onClick={() => handleJobWorkConfirmation(true)}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Yes, Mark as Job Work
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
