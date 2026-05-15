import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router";
import Proceaselogo from "../../public/assets/Procease_Logo_PNG.png";

export default function Login() {
  const { user, login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  let navigate = useNavigate();

  // if (user) {
  //   console.log(user)
  //   return <Navigate to="/dashboard" replace />;
  // }

  // if (user && Object.keys(user).length > 0) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = await login(email, password);
    if (!success) {
      setError("Invalid email or password");
    } else {
      navigate("/dashboard");
      // return <Navigate to="/dashboard" replace />;
    }
  };
  // if (!user || Object.keys(user).length === 0) {
  //   // No user or empty object → redirect to login
  //   return <Navigate to="/login" replace />;
  // } else {
  //   // User exists → redirect to dashboard
  //   return <Navigate to="/dashboard" replace />;
  // }

  // const fillDemoCredentials = (credential: (typeof DEMO_CREDENTIALS)[0]) => {
  //   setEmail(credential.email);
  //   setPassword(credential.password);
  //   setError("");
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img
            // src="https://cdn.builder.io/api/v1/assets/70d3db38063a473b8175d0ca5e5fc053/logo-615d32?format=webp&width=800"
            src={Proceaselogo}
            alt="Procease"
            className="h-28 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your ERP account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            {/* <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDemo(!showDemo)}
              >
                {showDemo ? "Hide" : "Show"} Demo Credentials
              </Button>

              {showDemo && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Demo Accounts:
                  </p>
                  {DEMO_CREDENTIALS.map((credential, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left justify-start text-sm"
                      onClick={() => fillDemoCredentials(credential)}
                    >
                      <div>
                        <div className="font-medium">
                          {credential.user.name}
                        </div>
                        <div className="text-gray-500">
                          {credential.email} | {credential.password}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
