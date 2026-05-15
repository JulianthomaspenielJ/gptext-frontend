import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface TAProcess {
  process: string;
  targetDate: string;
  actualDate?: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  responsible?: string;
}

interface TimeActionPlanProps {
  orderId: string;
  customer: string;
  processes: TAProcess[];
}

const sampleProcesses: TAProcess[] = [
  {
    process: "Yarn Requirement",
    targetDate: "30-05-2025",
    actualDate: "30-05-2025",
    status: "completed",
    responsible: "V.Sarath",
  },
  {
    process: "Yarn Purchase",
    targetDate: "04-06-2025",
    actualDate: "04-06-2025",
    status: "completed",
    responsible: "Purchase Dept",
  },
  {
    process: "Yarn Deliver to Warping/Sizing",
    targetDate: "05-06-2025",
    actualDate: "05-06-2025",
    status: "completed",
    responsible: "V.Sarath",
  },
  {
    process: "Warping & Sizing",
    targetDate: "06-06-2025",
    actualDate: "06-06-2025",
    status: "completed",
    responsible: "Sizing Unit",
  },
  {
    process: "Warp Deliver to Weaving",
    targetDate: "07-06-2025",
    actualDate: "07-06-2025",
    status: "completed",
    responsible: "V.Sarath",
  },
  {
    process: "Weft Deliver to Weaving",
    targetDate: "07-06-2025",
    actualDate: "07-06-2025",
    status: "completed",
    responsible: "V.Sarath",
  },
  {
    process: "Weaver",
    targetDate: "10-06-2025",
    actualDate: "10-06-2025",
    status: "completed",
    responsible: "Mallika Tex",
  },
  {
    process: "Loom Runout",
    targetDate: "10-06-2025",
    status: "in-progress",
    responsible: "Production",
  },
  {
    process: "Loom Drawing",
    targetDate: "10-06-2025",
    actualDate: "10-06-2025",
    status: "completed",
    responsible: "P.Pasupathi",
  },
  {
    process: "Loom Start Date",
    targetDate: "11-06-2025",
    actualDate: "11-06-2025",
    status: "completed",
    responsible: "Weaving Team",
  },
  {
    process: "First Piece Approval",
    targetDate: "12-06-2025",
    status: "in-progress",
    responsible: "Quality Team",
  },
  {
    process: "Warp Meter Planned",
    targetDate: "26-06-2025",
    status: "pending",
    responsible: "Production",
  },
  {
    process: "Loom Completion Date",
    targetDate: "26-06-2025",
    status: "pending",
    responsible: "Production",
  },
  {
    process: "Fabric Handover To SCM",
    targetDate: "27-06-2025",
    status: "pending",
    responsible: "SCM Team",
  },
  {
    process: "Fabric Checking Completed",
    targetDate: "28-06-2025",
    status: "pending",
    responsible: "Quality Team",
  },
  {
    process: "Fabric Dispatch Completed",
    targetDate: "30-06-2025",
    status: "pending",
    responsible: "Dispatch Team",
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "delayed":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "in-progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "delayed":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const TimeActionPlan: React.FC<TimeActionPlanProps> = ({
  orderId = "GPT-447",
  customer = "Sri Enterprises",
  processes = sampleProcesses,
}) => {
  const completedCount = processes.filter(
    (p) => p.status === "completed",
  ).length;
  const totalCount = processes.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Time & Action Plan
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {orderId} - {customer}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {progressPercentage}%
            </div>
            <div className="text-sm text-gray-500">
              {completedCount}/{totalCount} completed
            </div>
          </div>
        </div>
        <Progress value={progressPercentage} className="mt-4" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {processes.map((process, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(process.status)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {process.process}
                    </h4>
                    {process.responsible && (
                      <p className="text-xs text-gray-500">
                        {process.responsible}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <div className="font-medium">
                      Target: {process.targetDate}
                    </div>
                    {process.actualDate && (
                      <div className="text-gray-500">
                        Actual: {process.actualDate}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(process.status)} text-xs`}
                  >
                    {process.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" size="sm">
            Export Plan
          </Button>
          <Button size="sm">Update Progress</Button>
        </div>
      </CardContent>
    </Card>
  );
};
