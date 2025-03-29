
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/hooks/use-cart";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Simple auth check function
const isAuthenticated = () => {
  return localStorage.getItem("admin_authenticated") === "true";
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  
  useEffect(() => {
    setIsAuth(isAuthenticated());
    setIsChecking(false);
  }, []);
  
  if (isChecking) return null;
  
  return isAuth ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="denov-ui-theme">
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
