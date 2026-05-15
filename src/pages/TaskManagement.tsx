// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { TaskForm } from "@/components/TaskForm";
// import { OrderStorage, Task } from "@/lib/orderStorage";
// import { DataStore } from "@/lib/dataStore";
// import {
//   CheckSquare,
//   Plus,
//   Filter,
//   Clock,
//   User,
//   AlertTriangle,
//   CheckCircle,
//   Calendar,
// } from "lucide-react";
// import { taskApi } from "@/services/api2";
// import { useToast } from "@/hooks/use-toast";

// export default function TaskManagement() {
//   const [tasks, setTasks] = useState([]);
//   const [filteredTasks, setFilteredTasks] = useState([]);
//   const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { toast } = useToast();

//   // Load tasks from all orders
//   // useEffect(() => {
//   //   const orders = OrderStorage.getOrders();
//   //   const allTasks: Task[] = [];

//   //   orders.forEach((order) => {
//   //     if (order.tasks) {
//   //       allTasks.push(...order.tasks);
//   //     }
//   //   });

//   //   // Add some sample tasks if no tasks exist
//   //   if (allTasks.length === 0) {
//   //     const sampleTasks: Task[] = [
//   //       {
//   //         id: "1",
//   //         title: "Yarn delivery to sizing - GPT-447",
//   //         description: "Deliver yarn to sizing unit for processing",
//   //         assignedTo: "Rajesh Verma",
//   //         dueDate: "11-06-2024",
//   //         status: "Completed",
//   //         category: "Yarn Management",
//   //         priority: "High",
//   //         orderId: "GPT-447",
//   //       },
//   //       {
//   //         id: "2",
//   //         title: "Loom drawing @ MK-1 - GPT-448",
//   //         description: "Setup loom drawing for production",
//   //         assignedTo: "Amit Sharma",
//   //         dueDate: "12-06-2024",
//   //         status: "In Progress",
//   //         category: "Loom Operations",
//   //         priority: "Medium",
//   //         orderId: "GPT-448",
//   //       },
//   //       {
//   //         id: "3",
//   //         title: "First piece approval - GPT-447",
//   //         description: "Quality approval for first production piece",
//   //         assignedTo: "Deepak Singh",
//   //         dueDate: "12-06-2024",
//   //         status: "Pending",
//   //         category: "Quality Control",
//   //         priority: "High",
//   //         orderId: "GPT-447",
//   //       },
//   //     ];
//   //     allTasks.push(...sampleTasks);
//   //   }

//   //   setTasks(allTasks);
//   //   setFilteredTasks(allTasks);
//   // }, []);

//   useEffect(() => {
//     const fetchTasks = async () => {
//       setLoading(true);

//       try {
//         const response = await taskApi.get("/task-getall");
//         console.log(response);
//         setTasks(response.data.task);
//         setFilteredTasks(response.data.task);
//         setError("");
//       } catch (err) {
//         setError(err.response?.error || "Error fetching tasks");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTasks();
//   }, []);

//   const handleCategoryFilter = (category: string) => {
//     setSelectedCategory(category);
//     const filtered = tasks.filter((task) => task.category === category);
//     setFilteredTasks(filtered);
//   };

//   const clearCategoryFilter = () => {
//     setSelectedCategory(null);
//     setFilteredTasks(tasks);
//   };

//   const handleNewTask = (taskData: Task) => {
//     const newTask = {
//       ...taskData,
//       id: `task-${Date.now()}`,
//     };
//     setTasks((prev) => [newTask, ...prev]);
//   };

//   // const updateTaskStatus = (taskId: string, status: string) => {
//   //   try {
//   //     const taskData = {
//   //       id: taskId,
//   //       status: status,
//   //     };
//   //     const response = taskApi.post("/task-create", { taskData });
//   //     setTasks((prev) =>
//   //       prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
//   //     );
//   //     toast({
//   //       title: "Success",
//   //       description: "Task status updated.",
//   //     });
//   //   } catch (error) {
//   //     console.error("Error updating status:", error);

//   //     // 3️⃣ If API failed → do NOT update state
//   //     toast({
//   //       title: "Error",
//   //       description: "Failed to update task status. Please try again.",
//   //       variant: "destructive",
//   //     });
//   //   }
//   // };

//   const updateTaskStatus = async (taskId: string, status: string) => {
//     try {
//       const taskData = { id: taskId, status };

//       // 1️⃣ Wait for API to finish
//       const response = await taskApi.post("/task-update", { taskData });

//       // If API returns error (4xx or 5xx), this line NEVER executes — good.

//       // 2️⃣ Update UI only after API success
//       setTasks((prev) =>
//         prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
//       );
//       if (selectedCategory) {
//         setFilteredTasks((prev) =>
//           prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
//         );
//       }
//       console.log("updated successfully !....");

//       toast({
//         title: "Success",
//         description: "Task status updated.",
//       });
//     } catch (error) {
//       console.error("Error updating status:", error);

//       // 3️⃣ No state update → UI stays correct
//       toast({
//         title: "Error",
//         description: "Failed to update task status. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const getTaskStats = () => {
//     const total = tasks.length;
//     const completed = tasks.filter((t) => t.status === "Completed").length;
//     const inProgress = tasks.filter((t) => t.status === "In Progress").length;
//     const overdue = tasks.filter((t) => {
//       const dueDate = new Date(t.duedate);
//       const today = new Date();
//       return dueDate < today && t.status !== "Completed";
//     }).length;

//     return { total, completed, inProgress, overdue };
//   };

//   const stats = getTaskStats();

//   // if (loading) {
//   //   return (
//   //     <div className="flex justify-center items-center h-64">
//   //       <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
//   //     </div>
//   //   );
//   // }
//   const ThreeDots = () => (
//     <div className="flex space-x-2">
//       <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
//       <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
//       <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-400"></div>
//     </div>
//   );

//   return (
//     <div className="relative">
//       {/* ========== LOADING OVERLAY ========== */}
//       {loading && (
//         <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
//           <ThreeDots />
//         </div>
//       )}
//       <div
//         className={`${loading ? "blur-sm pointer-events-none select-none" : ""}`}
//       >
//         <div className="space-y-4 sm:space-y-6">
//           <div className="flex flex-col space-y-4">
//             <div>
//               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
//                 Task Management
//               </h1>
//               <p className="text-sm sm:text-base text-gray-600">
//                 Track and manage daily production tasks and assignments
//               </p>
//             </div>
//             <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
//               <Button
//                 variant="outline"
//                 className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
//               >
//                 <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
//                 Filter
//               </Button>
//               <Button
//                 onClick={() => setIsTaskFormOpen(true)}
//                 className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
//               >
//                 <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
//                 New Task
//               </Button>
//             </div>
//           </div>

//           {/* Task Summary */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
//             <Card>
//               <CardContent className="p-4 sm:p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-600">Total Tasks</p>
//                     <p className="text-2xl font-bold">{stats.total}</p>
//                   </div>
//                   <CheckSquare className="h-8 w-8 text-blue-500" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-600">Completed</p>
//                     <p className="text-2xl font-bold text-green-600">
//                       {stats.completed}
//                     </p>
//                   </div>
//                   <CheckCircle className="h-8 w-8 text-green-500" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-600">In Progress</p>
//                     <p className="text-2xl font-bold text-blue-600">
//                       {stats.inProgress}
//                     </p>
//                   </div>
//                   <Clock className="h-8 w-8 text-blue-500" />
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm text-gray-600">Overdue</p>
//                     <p className="text-2xl font-bold text-red-600">
//                       {stats.overdue}
//                     </p>
//                   </div>
//                   <AlertTriangle className="h-8 w-8 text-red-500" />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Task Lists */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Recent Tasks</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {selectedCategory && (
//                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
//                       <p className="text-blue-800 font-medium">
//                         Showing {filteredTasks.length} tasks for "
//                         {selectedCategory}"
//                       </p>
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={clearCategoryFilter}
//                         className="mt-2"
//                       >
//                         Show All Recent Tasks
//                       </Button>
//                     </div>
//                   )}
//                   {(selectedCategory ? filteredTasks : tasks.slice(0, 5)).map(
//                     (task) => (
//                       <div key={task.id} className="border rounded-lg p-4">
//                         <div className="flex items-center justify-between mb-2">
//                           <h3 className="font-medium text-sm">{task.title}</h3>
//                           <Badge
//                             className={
//                               task.status === "Completed"
//                                 ? "bg-green-500 text-white"
//                                 : task.status === "In Progress"
//                                   ? "bg-blue-500 text-white"
//                                   : "bg-yellow-500 text-white"
//                             }
//                           >
//                             {task.status}
//                           </Badge>
//                         </div>
//                         <div className="text-sm text-gray-600 mb-2">
//                           <p>Assigned to: {task.assignedto}</p>
//                           {/* <p>Due: {task.duedate}</p> */}
//                           <p>
//                             Due:{" "}
//                             {new Date(task.duedate).toLocaleDateString("en-GB")}
//                           </p>

//                           <p>Category: {task.category}</p>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <Progress
//                             value={
//                               task.status === "Completed"
//                                 ? 100
//                                 : task.status === "In Progress"
//                                   ? 50
//                                   : 0
//                             }
//                             className="flex-1 mr-2"
//                           />
//                           <div className="flex space-x-1">
//                             {task.status !== "Completed" && (
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() =>
//                                   updateTaskStatus(
//                                     task.id,
//                                     task.status === "Pending"
//                                       ? "In Progress"
//                                       : "Completed",
//                                   )
//                                 }
//                               >
//                                 {task.status === "Pending"
//                                   ? "Start"
//                                   : "Complete"}
//                               </Button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ),
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Task Performance</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-6">
//                   {(() => {
//                     const performanceData = tasks.reduce(
//                       (acc, task) => {
//                         if (!acc[task.assignedto]) {
//                           acc[task.assignedto] = { total: 0, completed: 0 };
//                         }
//                         acc[task.assignedto].total++;
//                         if (task.status === "Completed") {
//                           acc[task.assignedto].completed++;
//                         }
//                         return acc;
//                       },
//                       {} as Record<
//                         string,
//                         { total: number; completed: number }
//                       >,
//                     );

//                     return Object.entries(performanceData).map(
//                       ([person, data]: any) => {
//                         const completionRate =
//                           data.total > 0
//                             ? Math.round((data.completed / data.total) * 100)
//                             : 0;
//                         return (
//                           <div key={person}>
//                             <div className="flex justify-between text-sm mb-2">
//                               <span>{person}</span>
//                               <span>
//                                 {completionRate}% completion rate (
//                                 {data.completed}/{data.total})
//                               </span>
//                             </div>
//                             <Progress value={completionRate} />
//                           </div>
//                         );
//                       },
//                     );
//                   })()}

//                   <div>
//                     <div className="flex justify-between text-sm mb-2">
//                       <span>Overall Team</span>
//                       <span>
//                         {Math.round((stats.completed / stats.total) * 100)}%
//                         completion rate
//                       </span>
//                     </div>
//                     <Progress
//                       value={Math.round((stats.completed / stats.total) * 100)}
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Task Categories */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Task Categories</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
//                 <Button
//                   variant={
//                     selectedCategory === "Yarn Management"
//                       ? "default"
//                       : "outline"
//                   }
//                   className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
//                   onClick={() =>
//                     selectedCategory === "Yarn Management"
//                       ? clearCategoryFilter()
//                       : handleCategoryFilter("Yarn Management")
//                   }
//                 >
//                   <User className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
//                   <span className="text-center">Yarn Management</span>
//                   <span className="text-xs">
//                     {
//                       tasks.filter((t) => t.category === "Yarn Management")
//                         .length
//                     }{" "}
//                     tasks
//                   </span>
//                 </Button>
//                 <Button
//                   variant={
//                     selectedCategory === "Loom Operations"
//                       ? "default"
//                       : "outline"
//                   }
//                   className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
//                   onClick={() =>
//                     selectedCategory === "Loom Operations"
//                       ? clearCategoryFilter()
//                       : handleCategoryFilter("Loom Operations")
//                   }
//                 >
//                   <CheckSquare className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
//                   <span className="text-center">Loom Operations</span>
//                   <span className="text-xs">
//                     {
//                       tasks.filter((t) => t.category === "Loom Operations")
//                         .length
//                     }{" "}
//                     tasks
//                   </span>
//                 </Button>
//                 <Button
//                   variant={
//                     selectedCategory === "Quality Control"
//                       ? "default"
//                       : "outline"
//                   }
//                   className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
//                   onClick={() =>
//                     selectedCategory === "Quality Control"
//                       ? clearCategoryFilter()
//                       : handleCategoryFilter("Quality Control")
//                   }
//                 >
//                   <Calendar className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
//                   Quality Control
//                   <span className="text-xs">
//                     {
//                       tasks.filter((t) => t.category === "Quality Control")
//                         .length
//                     }{" "}
//                     tasks
//                   </span>
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Task Form */}
//           <TaskForm
//             isOpen={isTaskFormOpen}
//             setIsOpen={setIsTaskFormOpen}
//             onSubmit={handleNewTask}
//             onCancel={() => setIsTaskFormOpen(false)}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskForm } from "@/components/TaskForm";
import { TaskFilterDialog, TaskFilters } from "@/components/TaskFilterDialog";
import { OrderStorage, Task } from "@/lib/orderStorage";
import { useAuth } from "@/lib/auth";
import {
  CheckSquare,
  Plus,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageSquare,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { taskApi, taskOptionsApi } from "@/services/api2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import * as XLSX from "xlsx";
import * as XLSX from "xlsx-js-style";

import { saveAs } from "file-saver";

export default function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);

  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [commentingTask, setCommentingTask] = useState(null);

  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // const [taskCategories, setTaskCategories] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("full"); // 'full' | 'order'
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [viewMode, setViewMode] = useState("kanban"); // kanban | table
  const { toast } = useToast();
  useEffect(() => {
    if (!isCommentsDialogOpen) return;
    if (!commentingTask) return;
    if (!canCommentOnTask(commentingTask)) return;

    const t = window.setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);

    return () => window.clearTimeout(t);
  }, [isCommentsDialogOpen, commentingTask, user]);

  // Load tasks from all orders
  useEffect(() => {
    // console.log(user);
    // const orders = OrderStorage.getOrders();
    const allTasks = [];

    const fetchTasks = async () => {
      setLoading(true);

      try {
        const response = await taskApi.get("/task-getall");
        console.log(response);
        setTasks(response.data.task);
        setFilteredTasks(response.data.task);
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // setTasks(allTasks);

    // Filter tasks based on user role
    let filtered = tasks;
    if (user && user.role !== "Admin") {
      // Non-admin users see tasks assigned to them and tasks they created
      filtered = tasks.filter(
        (task) => task.assignedto === user.name || task.createdby === user.name,
      );
    }

    setFilteredTasks(filtered);
  }, [user]);

  const getActiveFilterCount = (current: TaskFilters) =>
    Object.values(current).filter((v) => v !== undefined && v !== "").length;

  const tasksVisibleToUser =
    user && user.role !== "Admin" && user.name
      ? tasks.filter(
          (t) => t.assignedto === user.name || t.createdby === user.name,
        )
      : tasks;

  const assigneeOptions = Array.from(
    new Set(tasksVisibleToUser.map((t) => t.assignedto).filter(Boolean)),
  ).sort();

  const applyFilters = (newFilters: any) => {
    console.log(newFilters);
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    );

    setFilters(cleanedFilters);
    let filtered = tasks;

    // First filter by user role
    if (user && user.role !== "Admin") {
      filtered = filtered.filter(
        (task) => task.assignedto === user.name || task.createdby === user.name,
      );
    }

    // Then apply additional filters
    if (cleanedFilters.status) {
      filtered = filtered.filter(
        (task) => task.status === cleanedFilters.status,
      );
    }
    if (cleanedFilters.priority) {
      filtered = filtered.filter(
        (task) => task.priority === cleanedFilters.priority,
      );
    }
    if (cleanedFilters.assignedto) {
      filtered = filtered.filter(
        (task) => task.assignedtoid === cleanedFilters.assignedto,
      );
    }

    if (cleanedFilters.gptid) {
      filtered = filtered.filter((task) => task.gptid === cleanedFilters.gptid);
    }

    setFilteredTasks(filtered);
  };

  const clearAllFilters = () => {
    setFilters({});
    let userTasks = tasks;
    if (user && user.role !== "Admin") {
      userTasks = tasks.filter(
        (task) => task.assignedto === user.name || task.createdby === user.name,
      );
    }
    setFilteredTasks(userTasks);
  };

  const canEditTask = (task: any): boolean => {
    if (!user) return false;
    return user.name === task.assignedto;
  };

  const canCommentOnTask = (task: any): boolean => {
    if (!user) return false;

    if (user.name === task.assignedto) return true;
    if (task.createdby && user.name === task.createdby) return true;

    // Backward compatibility for older tasks that don't track createdBy
    if (!task.createdby && user.role === "Admin") return true;

    return false;
  };

  const handleNewTask = (taskData: any) => {
    const newTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdby: user?.name,
      comment: [],
    };

    // Save to tasks state
    setTasks((prev) => [newTask, ...prev]);
    setFilteredTasks((prev) => [newTask, ...prev]);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    // setTasks((prev) =>
    //   prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
    // );
    // setFilteredTasks((prev) =>
    //   prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
    // );

    try {
      const taskData = { id: taskId, status };

      // 1️⃣ Wait for API to finish
      const response = await taskApi.post("/task-update", { taskData });

      // If API returns error (4xx or 5xx), this line NEVER executes — good.

      // 2️⃣ Update UI only after API success
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
      // if (selectedCategory) {
      setFilteredTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
      // }
      console.log("updated successfully !....");

      toast({
        title: "Success",
        description: "Task status updated.",
      });
    } catch (error) {
      console.error("Error updating status:", error);

      // 3️⃣ No state update → UI stays correct
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addCommentToTask = async (taskId: string, commentText: string) => {
    if (!user || !commentText.trim()) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      author: user.name,
      text: commentText,
      timestamp: new Date().toLocaleString(),
    };

    // 1️⃣ Get existing comments from state
    const currentTask =
      tasks.find((t) => t.id === taskId) ||
      filteredTasks.find((t) => t.id === taskId);

    const existingComments = Array.isArray(currentTask?.comment)
      ? currentTask.comment
      : [];

    // 2️⃣ Merge old + new
    const updatedComments = [...existingComments, newComment];

    const taskData = {
      id: taskId,
      comment: updatedComments, // send FULL array
    };

    try {
      // 3️⃣ Save merged comments to backend
      await taskApi.post("/task-update-comments", { taskData });

      // 4️⃣ Update UI with same merged data
      const updateTaskWithComment = (task: any) =>
        task.id === taskId ? { ...task, comment: updatedComments } : task;

      setTasks((prev) => prev.map(updateTaskWithComment));
      setFilteredTasks((prev) => prev.map(updateTaskWithComment));

      if (selectedTask?.id === taskId) {
        setSelectedTask(updateTaskWithComment(selectedTask));
      }

      if (commentingTask?.id === taskId) {
        setCommentingTask(updateTaskWithComment(commentingTask));
      }

      toast({
        title: "Success",
        description: "Task comments updated.",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to update task comments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTaskStats = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(
      (t) => t.status === "Completed",
    ).length;
    const inProgress = filteredTasks.filter(
      (t) => t.status === "In Progress",
    ).length;
    const overdue = filteredTasks.filter((t) => {
      const dueDate = new Date(t.duedate);
      const today = new Date();
      return dueDate < today && t.status !== "Completed";
    }).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

  const getPaginatedTasks = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  };

  const paginatedTasks = getPaginatedTasks();
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const statusMap: Record<string, string> = {
    New: "Pending",
    "In Progress": "In Progress",
    Completed: "Completed",
    Overdue: "Pending",
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !canEditTask(task)) {
      e.preventDefault();
      return;
    }

    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    columnTitle: string,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnTitle);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    columnTitle: string,
  ) => {
    e.preventDefault();

    if (!draggedTaskId) return;

    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task || !canEditTask(task)) {
      toast({
        title: "Not allowed",
        description: "You don't have permission to update this task.",
        variant: "destructive",
      });
      return;
    }

    const newStatus = statusMap[columnTitle];
    if (newStatus) {
      updateTaskStatus(draggedTaskId, newStatus);
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const groupTasksByDateAndUser = (tasks) => {
    return tasks.reduce((acc, task) => {
      const dateKey = new Date(task.duedate).toISOString().split("T")[0];
      const userKey = task.assignedto || "Unassigned";

      if (!acc[dateKey]) acc[dateKey] = {};
      if (!acc[dateKey][userKey]) acc[dateKey][userKey] = [];

      acc[dateKey][userKey].push(task);
      return acc;
    }, {});
  };

  const getExportRows = () => {
    const grouped = groupTasksByDateAndUser(filteredTasks);
    const rows = [];

    Object.entries(grouped).forEach(([dateKey, users]) => {
      let serialNo = 1;

      Object.entries(users).forEach(([user, tasks], userIndex) => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (t) => t.status?.toLowerCase() === "completed",
        ).length;

        const completionPercent = totalTasks
          ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%`
          : "0%";

        tasks.forEach((task, index) => {
          rows.push({
            "S.No": serialNo++,

            // Show date only once per date
            Date:
              userIndex === 0 && index === 0
                ? new Date(task.duedate).toLocaleDateString("en-GB")
                : "",

            "Assigned To": index === 0 ? user : "",
            "GPT ID": task.gptid || "",
            "Task Title": task.tasktitle,
            // "Due Date": new Date(task.duedate).toLocaleDateString("en-GB"),

            // Person-level counts (shown once per person)
            "Total Tasks": index === 0 ? totalTasks : "",
            "Completed Tasks": index === 0 ? completedTasks : "",
            "Completion %": index === 0 ? completionPercent : "",
          });
        });
      });
    });

    return rows;
  };

  const exportToPDF = () => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(16);
    doc.text("Task Management Report", 14, 15);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const rows = getExportRows();

    autoTable(doc, {
      startY: 30,
      head: [Object.keys(rows[0])],
      body: rows.map(Object.values),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Task_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const HEADER_FILL = "2F5597"; // dark blue
  const SUMMARY_FILL = "F2F4F8"; // light grey

  const exportToExcel = (rows) => {
    // const rows = getExportRows();
    if (!rows.length) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const headers = Object.keys(rows[0]);

    /* ================= HEADER STYLE ================= */
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
      if (!cell) continue;

      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: HEADER_FILL } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
        },
      };
    }

    /* ================= BODY STYLES + MERGE LOGIC ================= */
    let lastDate = null;
    let lastUser = null;

    let dateStartRow = null;
    let userStartRow = null;

    const merges = [];

    for (let r = 1; r <= range.e.r; r++) {
      const row = rows[r - 1];
      const currentDate = row["Date"];
      const currentUser = row["Assigned To"];

      const isNewDate = currentDate && currentDate !== lastDate;
      const isNewUser = currentUser && currentUser !== lastUser;

      /* ---------- DATE MERGE ---------- */
      if (currentDate) {
        if (dateStartRow !== null && r - dateStartRow > 1) {
          merges.push({
            s: { r: dateStartRow, c: 1 }, // Date column
            e: { r: r - 1, c: 1 },
          });
        }
        dateStartRow = r;
        lastDate = currentDate;
      }

      /* ---------- USER + SUMMARY MERGES ---------- */
      if (currentUser) {
        if (userStartRow !== null && r - userStartRow > 1) {
          merges.push(
            // Assigned To
            { s: { r: userStartRow, c: 2 }, e: { r: r - 1, c: 2 } },

            // Total Tasks
            { s: { r: userStartRow, c: 6 }, e: { r: r - 1, c: 6 } },

            // Completed Tasks
            { s: { r: userStartRow, c: 7 }, e: { r: r - 1, c: 7 } },

            // Completion %
            { s: { r: userStartRow, c: 8 }, e: { r: r - 1, c: 8 } },
          );
        }
        userStartRow = r;
        lastUser = currentUser;
      }

      /* ---------- CELL STYLES ---------- */

      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;

        cell.s = {
          alignment: {
            vertical: "center",
            horizontal: c >= 6 ? "center" : "left",
          },
          fill: row["Total Tasks"]
            ? { fgColor: { rgb: SUMMARY_FILL } }
            : undefined,
          // border: {
          //   top: isNewDate
          //     ? { style: "medium" } // Date separator
          //     : isNewUser
          //       ? { style: "thin" } // User separator
          //       : undefined,
          // },
          border: {
            top: isNewDate
              ? { style: "medium" } // Date separator
              : isNewUser
                ? { style: "thin" } // User separator
                : { style: "thin" },

            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }

    /* ---------- CLOSE LAST MERGES ---------- */
    const lastRow = range.e.r;

    if (dateStartRow !== null && lastRow - dateStartRow >= 1) {
      merges.push({
        s: { r: dateStartRow, c: 1 },
        e: { r: lastRow, c: 1 },
      });
    }

    // if (userStartRow !== null && lastRow - userStartRow >= 1) {
    //   merges.push(
    //     {
    //       s: { r: userStartRow, c: 2 },
    //       e: { r: lastRow, c: 2 },
    //     },
    //     {
    //       s: { r: userStartRow, c: 6 },
    //       e: { r: lastRow, c: 6 },
    //     },
    //   );
    // }

    if (userStartRow !== null && lastRow - userStartRow >= 1) {
      merges.push(
        { s: { r: userStartRow, c: 2 }, e: { r: lastRow, c: 2 } },
        { s: { r: userStartRow, c: 6 }, e: { r: lastRow, c: 6 } },
        { s: { r: userStartRow, c: 7 }, e: { r: lastRow, c: 7 } },
        { s: { r: userStartRow, c: 8 }, e: { r: lastRow, c: 8 } },
      );
    }

    worksheet["!merges"] = merges;

    worksheet["!rows"] = [];

    for (let r = 0; r <= range.e.r; r++) {
      worksheet["!rows"][r] = { hpt: 22 }; // 22 points height
    }

    /* ================= AUTO WIDTH ================= */
    worksheet["!cols"] = headers.map((key) => ({
      wch:
        Math.max(
          key.length,
          ...rows.map((r) => (r[key] ? r[key].toString().length : 0)),
        ) + 2,
    }));

    /* ================= FREEZE HEADER ================= */
    worksheet["!freeze"] = { ySplit: 1 };

    /* ================= EXPORT ================= */
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Task_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleExport = () => {
    let rows = getExportRows();

    if (exportType === "order") {
      rows = rows.filter((row) => row["GPT ID"] === selectedOrderId);
    }
    console.log(rows);

    exportToExcel(rows);
  };
  const uniqueGptIds = Array.from(
    new Set(tasks.map((task) => task.gptid).filter(Boolean)),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-4">Export Options</h2>

            {/* Export Type */}
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="full"
                  checked={exportType === "full"}
                  onChange={() => setExportType("full")}
                />
                Full Report
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="order"
                  checked={exportType === "order"}
                  onChange={() => setExportType("order")}
                />
                Order-wise
              </label>
            </div>

            {/* Order Selection */}
            {exportType === "order" && (
              <div className="mb-4">
                <label className="block text-sm mb-1">Select Order ID</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                >
                  <option value="">-- Select Order --</option>
                  {/* {tasks.map((order) => (
                    <option key={order.gptid} value={order.gptid}>
                      {order.gptid}
                    </option>
                  ))} */}

                  {uniqueGptIds.map((gptid) => (
                    <option key={gptid} value={gptid}>
                      {gptid}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </Button>

              <Button
                disabled={exportType === "order" && !selectedOrderId}
                onClick={() => {
                  handleExport();
                  setShowExportModal(false);
                }}
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Task Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track and manage daily production tasks and assignments
          </p>
        </div>
        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
          <Button
            variant={getActiveFilterCount(filters) > 0 ? "default" : "outline"}
            onClick={() => setIsFilterDialogOpen(true)}
            className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
          >
            <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Filter
            {getActiveFilterCount(filters) > 0 && (
              <Badge className="ml-2 text-xs">
                {getActiveFilterCount(filters)}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setIsTaskFormOpen(true)}
            className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            New Task
          </Button>
          <Button
            // onClick={exportToExcel}
            onClick={() => setShowExportModal(true)}
            className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4"
          >
            <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Export Report</span>
            <span className="xs:hidden">Export</span>
          </Button>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              onClick={() => setViewMode("kanban")}
            >
              Kanban View
            </Button>

            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
            >
              Table View
            </Button>
          </div>
        </div>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Status */}
      {getActiveFilterCount(filters) > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
          <p className="text-blue-800 font-medium">
            Showing {filteredTasks.length} of {tasks.length} tasks (filtered)
          </p>
          <Button size="sm" variant="outline" onClick={clearAllFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {/* {filteredTasks.length > 0 && ( */}
      {viewMode === "kanban" && filteredTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <label
              htmlFor="itemsPerPage"
              className="text-sm font-medium text-gray-700"
            >
              Items per page:
            </label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 order-1 sm:order-2">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of{" "}
            {filteredTasks.length} tasks
          </div>

          <div className="flex items-center gap-2 order-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm font-medium text-gray-700 px-3 py-2">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-max md:min-w-0">
            {["New", "In Progress", "Completed", "Overdue"].map(
              (columnTitle) => {
                let columnTasks = [];

                if (columnTitle === "New") {
                  columnTasks = paginatedTasks.filter(
                    (task) => task.status === "Pending",
                  );
                } else if (columnTitle === "In Progress") {
                  columnTasks = paginatedTasks.filter(
                    (task) => task.status === "In Progress",
                  );
                } else if (columnTitle === "Completed") {
                  columnTasks = paginatedTasks.filter(
                    (task) => task.status === "Completed",
                  );
                } else if (columnTitle === "Overdue") {
                  columnTasks = paginatedTasks.filter((task) => {
                    const dueDate = new Date(task.duedate);
                    const today = new Date();
                    return dueDate < today && task.status !== "Completed";
                  });
                }

                const columnBgColor =
                  columnTitle === "New"
                    ? "bg-gray-50"
                    : columnTitle === "In Progress"
                      ? "bg-blue-50"
                      : columnTitle === "Completed"
                        ? "bg-green-50"
                        : "bg-red-50";

                const columnBorderColor =
                  columnTitle === "New"
                    ? "border-gray-200"
                    : columnTitle === "In Progress"
                      ? "border-blue-200"
                      : columnTitle === "Completed"
                        ? "border-green-200"
                        : "border-red-200";

                return (
                  <div
                    key={columnTitle}
                    className={`flex flex-col rounded-lg border-2 ${columnBorderColor} ${dragOverColumn === columnTitle ? "ring-2 ring-blue-500" : ""} ${columnBgColor} min-h-96 flex-shrink-0 w-80 md:w-full transition-all`}
                    onDragOver={(e) => handleDragOver(e, columnTitle)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, columnTitle)}
                  >
                    <div className="p-4 border-b border-gray-300">
                      <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                        {columnTitle}
                        <Badge className="ml-2 bg-gray-600">
                          {columnTasks.length}
                        </Badge>
                      </h3>
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                      {columnTasks.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <p className="text-sm">No tasks</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => {
                          const isAssignedToUser = canEditTask(task);

                          return (
                            <div
                              key={task.id}
                              // draggable
                              draggable={canEditTask(task)}
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onDragEnd={handleDragEnd}
                              className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-move ${
                                draggedTaskId === task.id
                                  ? "opacity-50 border-blue-400"
                                  : ""
                              }`}
                            >
                              <div className="mb-2">
                                <h4 className="font-medium text-sm text-gray-900 break-words">
                                  {task.tasktitle}
                                </h4>
                              </div>
                              <div className="text-xs text-gray-600 mb-3 space-y-1">
                                <p>
                                  <span className="font-semibold">
                                    Assigned:
                                  </span>{" "}
                                  {task.assignedto}
                                </p>
                                <p>
                                  <span className="font-semibold">Due:</span>{" "}
                                  {/* {task.duedate} */}
                                  {new Date(task.duedate).toLocaleDateString(
                                    "en-GB",
                                  )}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Priority:
                                  </span>{" "}
                                  {task.priority}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                {isAssignedToUser && (
                                  <Select
                                    value={task.status}
                                    onValueChange={(newStatus) => {
                                      updateTaskStatus(task.id, newStatus);
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Pending">
                                        Pending
                                      </SelectItem>
                                      <SelectItem value="In Progress">
                                        In Progress
                                      </SelectItem>
                                      <SelectItem value="Completed">
                                        Completed
                                      </SelectItem>
                                    </SelectContent>{" "}
                                    {/* <SelectContent>
                                  {taskCategories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.category}
                                    >
                                      {category.category}
                                    </SelectItem>
                                  ))}
                                </SelectContent> */}
                                  </Select>
                                )}

                                <div className="flex items-center gap-1">
                                  {!isAssignedToUser && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => {
                                        const latest =
                                          tasks.find((t) => t.id === task.id) ??
                                          task;
                                        setSelectedTask(latest);
                                        setIsTaskViewOpen(true);
                                      }}
                                    >
                                      <Eye className="mr-1 h-3 w-3" />
                                      View
                                    </Button>
                                  )}

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 relative"
                                    onClick={() => {
                                      const latest =
                                        tasks.find((t) => t.id === task.id) ??
                                        task;
                                      setCommentingTask(latest);
                                      setIsCommentsDialogOpen(true);
                                      setCommentText("");
                                    }}
                                    aria-label="Comments"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    {(task.comment?.length ?? 0) > 0 && (
                                      <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                                        {task.comment?.length}
                                      </span>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
      {viewMode === "table" && (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border px-3 py-2 text-left">S.No</th>
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-left">Assigned To</th>
                <th className="border px-3 py-2 text-left">GPT ID</th>
                <th className="border px-3 py-2 text-left">Task Title</th>
                <th className="border px-3 py-2 text-center">Total Tasks</th>
                <th className="border px-3 py-2 text-center">
                  Completed Tasks
                </th>
                <th className="border px-3 py-2 text-center">Completion %</th>
              </tr>
            </thead>

            <tbody>
              {getExportRows().map((row, index) => (
                <tr
                  key={index}
                  className={
                    row["Total Tasks"] ? "bg-gray-100 font-semibold" : ""
                  }
                >
                  <td className="border px-3 py-2">{row["S.No"]}</td>
                  <td className="border px-3 py-2">{row["Date"]}</td>
                  <td className="border px-3 py-2">{row["Assigned To"]}</td>
                  <td className="border px-3 py-2">{row["GPT ID"]}</td>
                  <td className="border px-3 py-2">{row["Task Title"]}</td>
                  <td className="border px-3 py-2 text-center">
                    {row["Total Tasks"]}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {row["Completed Tasks"]}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {row["Completion %"]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Task Form */}
      <TaskForm
        isOpen={isTaskFormOpen}
        setIsOpen={setIsTaskFormOpen}
        onSubmit={handleNewTask}
        onCancel={() => setIsTaskFormOpen(false)}
      />

      {/* Task View Dialog */}
      <Dialog
        open={isTaskViewOpen}
        onOpenChange={(open) => {
          setIsTaskViewOpen(open);
          if (!open) setSelectedTask(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>View task information</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Title</h3>
                    <p className="text-sm text-gray-600">
                      {selectedTask.tasktitle}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedTask.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Assigned To
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedTask.assignedto}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Due Date
                      </h3>
                      <p className="text-sm text-gray-600">
                        {/* {selectedTask.duedate} */}
                        {new Date(selectedTask.duedate).toLocaleDateString(
                          "en-GB",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Status
                      </h3>
                      {selectedTask.assignedto === user?.name ? (
                        <Select
                          value={selectedTask.status}
                          onValueChange={(newStatus) => {
                            updateTaskStatus(selectedTask.id, newStatus);
                            setSelectedTask({
                              ...selectedTask,
                              status: newStatus,
                            });
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={
                            selectedTask.status === "Completed"
                              ? "bg-green-500 text-white"
                              : selectedTask.status === "In Progress"
                                ? "bg-blue-500 text-white"
                                : "bg-yellow-500 text-white"
                          }
                        >
                          {selectedTask.status}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Priority
                      </h3>
                      <Badge
                        className={
                          selectedTask.priority === "High"
                            ? "bg-red-500 text-white"
                            : selectedTask.priority === "Medium"
                              ? "bg-orange-500 text-white"
                              : "bg-green-500 text-white"
                        }
                      >
                        {selectedTask.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Category
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedTask.category}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        GPT ID
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedTask.gptid}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Order ID
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedTask.relatedorder}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Comments</h3>
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto rounded-md border bg-gray-50 p-3">
                    {selectedTask.comment && selectedTask.comment.length > 0 ? (
                      selectedTask.comment.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded bg-white p-2 text-sm shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-900">
                              {comment.author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-gray-500">
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsTaskViewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Comments Dialog */}
      <Dialog
        open={isCommentsDialogOpen}
        onOpenChange={(open) => {
          setIsCommentsDialogOpen(open);
          if (!open) {
            setCommentingTask(null);
            setCommentText("");
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Comments</DialogTitle>
            <DialogDescription>
              {commentingTask ? commentingTask.title : ""}
            </DialogDescription>
          </DialogHeader>

          {commentingTask && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto rounded-md border bg-gray-50 p-3">
                {commentingTask.comment && commentingTask.comment.length > 0 ? (
                  commentingTask.comment.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded bg-white p-2 text-sm shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-900">
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-500">
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-700">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-gray-500">
                    No comments yet
                  </p>
                )}
              </div>

              {canCommentOnTask(commentingTask) && (
                <div className="space-y-2">
                  <textarea
                    ref={commentInputRef}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!commentText.trim()) return;
                        addCommentToTask(commentingTask.id, commentText);
                        setCommentText("");
                      }}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCommentsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Filter Dialog */}
      <TaskFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={applyFilters}
        currentFilters={filters}
        assignees={assigneeOptions}
      />
    </div>
  );
}
