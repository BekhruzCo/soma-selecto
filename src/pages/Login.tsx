import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Xatolik",
        description: "Parolni kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (password === adminPassword) {
        localStorage.setItem("admin_authenticated", "true");
        toast({
          title: "Muvaffaqiyatli kirish",
          description: "Siz admin paneliga kirdingiz",
        });
        navigate("/admin");
      } else {
        setPassword("");
        toast({
          title: "Xatolik yuz berdi",
          description: "Noto'g'ri parol",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin paneliga kirish</CardTitle>
          <CardDescription>
            Admin paneliga kirish uchun parolni kiriting
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button 
              type="button"
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
              disabled={isLoading}
            >
              Orqaga
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Kirish..." : "Kirish"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
