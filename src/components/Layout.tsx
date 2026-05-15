import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Check if we're on mobile or if user preference exists
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      const saved = localStorage.getItem("sidebarOpen");
      return saved ? JSON.parse(saved) : !isMobile;
    }
    return true;
  });
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    const handleSidebarToggle = () => {
      setSidebarOpen((prev) => {
        const newState = !prev;
        localStorage.setItem("sidebarOpen", JSON.stringify(newState));
        return newState;
      });
    };

    window.addEventListener("resize", handleResize);

    // Override the toggle function to include persistence
    const originalToggle = () => setSidebarOpen(!sidebarOpen);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarOpen]);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", JSON.stringify(newState));
      return newState;
    });
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header toggleSidebar={handleSidebarToggle} />
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main
        className={`transition-all duration-300 mt-16 ${
          sidebarOpen ? "ml-64 max-md:ml-0" : "ml-16 max-md:ml-0"
        } px-2 xs:px-4 sm:px-6`}
      >
        {children}
      </main>
    </div>
  );
};
