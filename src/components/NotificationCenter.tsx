import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  X,
  // MarkAsRead,
} from "lucide-react";
import { notificationApi } from "@/services/api2";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const notificationResponse = await notificationApi.get(
        "/get-notification",
        { params: { userid: user.id } },
      );

      // const looms = notificationResponse.data.notifications;

      setNotifications(notificationResponse.data.notifications);
      // setUnreadCount(
      //   notificationResponse.data.notifications.filter((n) => !n.read).length,
      // );
    } catch (err) {
      console.error("Failed to fetch notifications..", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, []);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-l-yellow-500";
      case "success":
        return "border-l-green-500";
      case "error":
        return "border-l-red-500";
      default:
        return "border-l-blue-500";
    }
  };

  const markAsRead = async (id: string) => {
    await updateNotification("read", id);

    // setNotifications((prev) =>
    //   prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    // );
  };

  // const markAllAsRead = () => {
  //   setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  // };
  const markAllAsRead = () => {
    updateNotification("markAllRead");
  };

  const removeNotification = async (id: string) => {
    await updateNotification("remove", id);

    // setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notification: any) => {
    // markAsRead(notification.id);
    if (!notification.read) {
      updateNotification("read", notification.id);
    }
    if (notification.navigationurl) {
      window.location.href = notification.navigationurl;
    }
  };

  // const updateNotification = async (
  //   notificationId: string,
  //   action: "read" | "remove",
  // ) => {
  //   try {
  //     await notificationApi.put("/update-notification", {
  //       notificationId,
  //       action,
  //     });
  //   } catch (err) {
  //     console.error("Failed to update notification", err);
  //   }
  // };
  const updateNotification = async (
    action: "read" | "remove" | "markAllRead",
    notificationId?: string,
  ) => {
    try {
      await notificationApi.put("/update-notification", {
        action,
        assignedtoid: user.id,
        notificationId,
      });

      // Update local state
      if (action === "read") {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
      } else if (action === "remove") {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } else if (action === "markAllRead") {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to update notification", err);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4 flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getBorderColor(notification.type)} ${
                    !notification.read ? "bg-blue-50" : "bg-white"
                  } hover:bg-gray-50 cursor-pointer transition-colors`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.body}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {/* {notification.createddate} */}
                          {formatDistanceToNow(
                            new Date(notification.createddate),
                            {
                              addSuffix: true,
                            },
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="p-1 h-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-center"
              onClick={() => {
                setIsOpen(false);
                window.location.href = "/notifications";
              }}
            >
              View All Notifications
            </Button>
          </div>
        )} */}
      </PopoverContent>
    </Popover>
  );
};
