
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // For simplicity, we're using a hardcoded password
  // In a real application, you should use proper authentication
  const adminPassword = "admin123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === adminPassword) {
      localStorage.setItem("admin_authenticated", "true");
      toast({
        title: "Успешный вход",
        description: "Вы вошли в панель администратора",
      });
      navigate("/admin");
    } else {
      toast({
        title: "Ошибка входа",
        description: "Неверный пароль",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход в панель администратора</CardTitle>
          <CardDescription>
            Введите пароль, чтобы получить доступ к панели администратора
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
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
          <CardFooter>
            <Button type="submit" className="w-full">Войти</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
