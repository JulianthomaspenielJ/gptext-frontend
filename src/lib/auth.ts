import { authenticationApi } from "@/services/api2";
import { createContext, useContext } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "manager" | "supervisor" | "operator";
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Demo credentials
export const DEMO_CREDENTIALS = [
  {
    email: "admin@gptextiles.com",
    password: "admin123",
    user: {
      id: "1",
      name: "Admin User",
      email: "admin@gptextiles.com",
      role: "admin" as const,
    },
  },
  {
    email: "manager@gptextiles.com",
    password: "manager123",
    user: {
      id: "2",
      name: "Production Manager",
      email: "manager@gptextiles.com",
      role: "manager" as const,
    },
  },
  {
    email: "supervisor@gptextiles.com",
    password: "supervisor123",
    user: {
      id: "3",
      name: "Weaving Supervisor",
      email: "supervisor@gptextiles.com",
      role: "supervisor" as const,
    },
  },
];

// export const validateCredentials = (
//   email: string,
//   password: string,
// ) => {

//         const response = authenticationApi.post("/login", { email,password });
//         console.log(response);
//   // const credential = DEMO_CREDENTIALS.find(
//   //   (cred) => cred.email === email && cred.password === password,
//   // );
//   // return credential ? credential.user : null;
// };


export const validateCredentials = async (email: string, password: string) => {
  try {
    const response = await authenticationApi.post("/login", { email, password });

    console.log(response);
    // backend should return { user, token }
    return response.data; 
  } catch (error) {
    return null;
  }
};

