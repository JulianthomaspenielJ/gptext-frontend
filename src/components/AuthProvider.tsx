import React, { useState, useEffect } from "react";
import { AuthContext, User, validateCredentials } from "@/lib/auth";
import { authenticationApi, notificationApi } from "@/services/api2";
import { requestPermission } from "@/notification";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // const login = async (email: string, password: string): Promise<boolean> => {
  //   setIsLoading(true);

  //   // Simulate API call delay
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   const validatedUser = validateCredentials(email, password);

  //   if (validatedUser) {
  //     setUser(validatedUser);
  //     localStorage.setItem("gp_textiles_user", JSON.stringify(validatedUser));
  //     setIsLoading(false);
  //     return true;
  //   }

  //   setIsLoading(false);
  //   return false;
  // };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await validateCredentials(email, password);

      if (!data) {
        return false;
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("accessToken", data.token);
      // Get FCM token after successful login
      const token = await requestPermission();
      if (token) {
        // Send the token to your backend for saving
        await saveTokenToBackend(data.user.id, token);
      }
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const userId = JSON.parse(localStorage.getItem("user"))?.id; // Get user ID from localStorage
    // Get FCM token for logout
    const token = await requestPermission();
    if (token) {
      // remove the token from database..

      const notificationResponse = await notificationApi.post("/clear-token", {
        userId,
        token, // Send the user's notification token to be removed
      });
    }
    const response = authenticationApi.post("/logout", {});

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  };

  // Function to send token to the backend
  const saveTokenToBackend = async (userId: string, token: string) => {
    try {
      await authenticationApi.post("/notification/save-token", {
        userId,
        token,
      });
      console.log("FCM token saved successfully.");
    } catch (error) {
      console.error("Error saving token to backend:", error);
    }
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
