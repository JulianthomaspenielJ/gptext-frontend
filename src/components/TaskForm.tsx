import { useEffect, useState } from "react";
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
import { Plus, Calendar, User } from "lucide-react";
import { taskOptionsApi, taskApi } from "@/services/api2";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface TaskFormProps {
  onSubmit: (taskData: any) => void;
  onCancel: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}


export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isOpen,
  setIsOpen,
}) => {
  const initialFormData = {
    id: "",
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    assignedTo: "",
    assignedToId: "",
    orderId: "",
    dueDate: "",
    estimatedHours: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [taskCategories, setTaskCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await taskOptionsApi.get("/task-options");
        // console.log(response);
        setTaskCategories(response.data.taskCategory);
        setEmployees(response.data.users);
        setOrders(response.data.orders);
        // setAllOptions({
        //   taskCategories: response.data.taskCategory || [],
        //   users: response.data.users || [],
        // });
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTaskChange = (userId: string) => {
    // console.log(employees);
    // console.log(userId);
    const selectedUser = employees.find((w) => w.id === userId);
    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        assignedToId: userId,
        assignedTo: selectedUser.name,
      }));
    }
  };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const taskData = {
  //     ...formData,
  //     id: Date.now().toString(),
  //     createdDate: new Date().toLocaleDateString("en-GB"),
  //     status: "Pending",
  //     progress: 0,
  //   };
  //   console.log(taskData);
  //   const response = taskApi.post("/task-create", { taskData });

  //   onSubmit(taskData);
  //   setIsOpen(false);
  //   setFormData({
  //     title: "",
  //     description: "",
  //     category: "",
  //     priority: "Medium",
  //     assignedTo: "",
  //     assignedToId: "",
  //     orderId: "",
  //     dueDate: "",
  //     estimatedHours: "",
  //   });
  // };

  const validateForm = () => {
    const required = ["title", "category", "assignedTo", "dueDate"];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error",
          description: `${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} is required`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const taskData = {
        ...formData,
        id: formData.id || Date.now().toString(),
        createdDate: new Date().toLocaleDateString("en-GB"),
        createdby: user.name,
        status: "Pending",
        progress: 0,
        mode: "create",
      };

      // console.log(taskData);

      const response = await taskApi.post("/task-create", { taskData });
      // console.log(response);

      onSubmit(response.data.task ?? taskData);

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setIsOpen(false);

      // Reset form
      setFormData({
        id: "",
        title: "",
        description: "",
        category: "",
        priority: "Medium",
        assignedTo: "",
        assignedToId: "",
        orderId: "",
        dueDate: "",
        estimatedHours: "",
      });
    } catch (error) {
      console.error("Error creating task:", error);

      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };
  const today = new Date().toISOString().split("T")[0];


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Assign a new task to team members for production activities
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Task Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Detailed task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskCategories.map((category) => (
                      <SelectItem key={category.id} value={category.category}>
                        {category.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleInputChange("priority", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                <Badge
                  className={`mt-2 ${getPriorityColor(formData.priority)}`}
                >
                  {formData.priority} Priority
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Assign To *</Label>
                {/* <Select
                  value={formData.assignedTo}
                  // onValueChange={(value) =>
                  //   handleInputChange("assignedTo", value)
                  // }
                  onValueChange={handleTaskChange}

                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.name}>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">
                              {employee.role}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                <Select
                  value={formData.assignedToId}
                  onValueChange={handleTaskChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">
                              {employee.role}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orderId">Related Order</Label>
                <Select
                  value={formData.orderId}
                  onValueChange={(value) => handleInputChange("orderId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.customername}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <div className="relative">
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    min={today}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    handleInputChange("estimatedHours", e.target.value)
                  }
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
