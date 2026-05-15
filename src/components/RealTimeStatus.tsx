// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { DataStore } from "@/lib/dataStore";
// import {
//   Activity,
//   Signal,
//   Wifi,
//   WifiOff,
//   Zap,
//   AlertTriangle,
//   CheckCircle,
// } from "lucide-react";

// interface StatusData {
//   timestamp: string;
//   activeLooms: number;
//   currentProduction: number;
//   efficiency: number;
//   alerts: number;
//   connectionStatus: "connected" | "disconnected" | "reconnecting";
// }

// export const RealTimeStatus = () => {
//   const [status, setStatus] = useState<StatusData>({
//     timestamp: new Date().toLocaleTimeString(),
//     activeLooms: 4, // Will be updated from DataStore
//     currentProduction: 0, // Will be updated from DataStore
//     efficiency: 0, // Will be updated from DataStore
//     alerts: 0, // Will be updated from DataStore
//     connectionStatus: "connected",
//   });

//   const [isLive, setIsLive] = useState(true);

//   // Initialize and update with real data
//   // useEffect(() => {
//   //   const updateStatus = () => {
//   //     const currentStats = DataStore.getSystemStats();

//   //     console.log(currentStats);
//   //     setStatus((prev) => ({
//   //       ...prev,
//   //       timestamp: new Date().toLocaleTimeString(),
//   //       activeLooms: currentStats.looms.active, // Always use real count from DataStore
//   //       currentProduction: currentStats.production.todaysProduction,
//   //       efficiency: currentStats.production.efficiency,
//   //       alerts:
//   //         currentStats.tasks.overdue +
//   //         (currentStats.looms.maintenance > 0 ? 1 : 0),
//   //     }));
//   //   };

//   //   // Initial update
//   //   updateStatus();

//   //   if (!isLive) return;

//   //   const interval = setInterval(() => {
//   //     updateStatus();
//   //   }, 3000);

//   //   return () => clearInterval(interval);
//   // }, [isLive]);

//   useEffect(() => {
//     const updateStatus = async () => {
//       try {
//         const currentStats = await DataStore.getSystemStats(); // <-- await the promise

//         console.log(currentStats);

//         setStatus((prev) => ({
//           ...prev,
//           timestamp: new Date().toLocaleTimeString(),
//           activeLooms: currentStats.looms.active,
//           currentProduction: currentStats.production.todaysProduction,
//           efficiency: currentStats.production.efficiency,
//           alerts:
//             currentStats.tasks.overdue +
//             (currentStats.looms.maintenance > 0 ? 1 : 0),
//         }));
//       } catch (error) {
//         console.error("Failed to fetch system stats:", error);
//       }
//     };

//     // Initial update
//     updateStatus();

//     // if (!isLive) return;

//     // const interval = setInterval(() => {
//     //   updateStatus();
//     // }, 3000);

//     // return () => clearInterval(interval);
//   }, [isLive]);

//   const getConnectionIcon = () => {
//     switch (status.connectionStatus) {
//       case "connected":
//         return <Wifi className="h-4 w-4 text-green-500" />;
//       case "disconnected":
//         return <WifiOff className="h-4 w-4 text-red-500" />;
//       case "reconnecting":
//         return <Signal className="h-4 w-4 text-yellow-500 animate-pulse" />;
//       default:
//         return <WifiOff className="h-4 w-4 text-gray-500" />;
//     }
//   };

//   const getStatusColor = (value: number, threshold: number) => {
//     return value >= threshold ? "text-green-600" : "text-red-600";
//   };

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <CardTitle className="flex items-center">
//             <Activity className="mr-2 h-5 w-5" />
//             Real-time Production Status
//           </CardTitle>
//           <div className="flex items-center space-x-2">
//             {getConnectionIcon()}
//             <Badge variant={isLive ? "default" : "secondary"}>
//               {isLive ? "LIVE" : "PAUSED"}
//             </Badge>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => setIsLive(!isLive)}
//             >
//               {isLive ? "Pause" : "Resume"}
//             </Button>
//           </div>
//         </div>
//         <p className="text-sm text-gray-600">
//           Last updated: {status.timestamp}
//         </p>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           {/* Active Looms */}
//           <div className="text-center p-4 bg-blue-50 rounded-lg">
//             <div className="flex items-center justify-center mb-2">
//               <Zap className="h-6 w-6 text-blue-600" />
//             </div>
//             <p className="text-2xl font-bold text-blue-600">
//               {status.activeLooms}
//             </p>
//             <p className="text-sm text-gray-600">Active Looms</p>
//           </div>

//           {/* Current Production */}
//           <div className="text-center p-4 bg-green-50 rounded-lg">
//             <div className="flex items-center justify-center mb-2">
//               <Activity className="h-6 w-6 text-green-600" />
//             </div>
//             <p
//               className={`text-2xl font-bold ${getStatusColor(status.currentProduction, 15000)}`}
//             >
//               {status.currentProduction.toLocaleString()}m
//             </p>
//             <p className="text-sm text-gray-600">Today's Production</p>
//           </div>

//           {/* Efficiency */}
//           <div className="text-center p-4 bg-yellow-50 rounded-lg">
//             <div className="flex items-center justify-center mb-2">
//               <CheckCircle className="h-6 w-6 text-yellow-600" />
//             </div>
//             <p
//               className={`text-2xl font-bold ${getStatusColor(status.efficiency, 80)}`}
//             >
//               {status.efficiency.toFixed(1)}%
//             </p>
//             <p className="text-sm text-gray-600">Efficiency</p>
//             <Progress value={status.efficiency} className="mt-2" />
//           </div>

//           {/* Alerts */}
//           <div className="text-center p-4 bg-red-50 rounded-lg">
//             <div className="flex items-center justify-center mb-2">
//               <AlertTriangle className="h-6 w-6 text-red-600" />
//             </div>
//             <p className="text-2xl font-bold text-red-600">{status.alerts}</p>
//             <p className="text-sm text-gray-600">Active Alerts</p>
//           </div>
//         </div>

//         {/* Performance Indicators */}
//         <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="flex items-center justify-between p-3 border rounded-lg">
//             <span className="text-sm text-gray-600">Target Achievement</span>
//             <Badge
//               className={
//                 status.efficiency >= 90
//                   ? "bg-green-500 text-white"
//                   : status.efficiency >= 80
//                     ? "bg-yellow-500 text-white"
//                     : "bg-red-500 text-white"
//               }
//             >
//               {status.efficiency >= 90
//                 ? "Excellent"
//                 : status.efficiency >= 80
//                   ? "Good"
//                   : "Needs Attention"}
//             </Badge>
//           </div>

//           <div className="flex items-center justify-between p-3 border rounded-lg">
//             <span className="text-sm text-gray-600">System Health</span>
//             <Badge className="bg-green-500 text-white">
//               {status.connectionStatus === "connected" ? "Healthy" : "Issues"}
//             </Badge>
//           </div>

//           <div className="flex items-center justify-between p-3 border rounded-lg">
//             <span className="text-sm text-gray-600">Data Quality</span>
//             <Badge className="bg-blue-500 text-white">
//               {isLive ? "Real-time" : "Cached"}
//             </Badge>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };
