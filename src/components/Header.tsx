
import { ShoppingCart, Search, Menu } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onSearch: (term: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { items } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <a href="#" className="text-lg font-medium hover:text-primary">Главная</a>
                <a href="#" className="text-lg font-medium hover:text-primary">Меню</a>
                <a href="#" className="text-lg font-medium hover:text-primary">О нас</a>
                <a href="#" className="text-lg font-medium hover:text-primary">Контакты</a>
              </nav>
            </SheetContent>
          </Sheet>
          
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">ДБ</span>
            </div>
            <span className="text-xl font-bold hidden sm:inline">Denov Baraka</span>
          </a>
        </div>
        
        <form onSubmit={handleSearch} className="hidden md:flex w-full max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск сомсы..."
              className="w-full pl-9"
            />
          </div>
        </form>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative md:hidden"
            onClick={() => {
              const searchInput = document.getElementById('mobile-search');
              if (searchInput) {
                searchInput.classList.toggle('hidden');
                searchInput.focus();
              }
            }}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-xs animate-cart-bounce"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[350px] sm:w-[450px]">
              <div className="py-6">
                <h2 className="text-2xl font-bold">Корзина</h2>
                <p className="text-muted-foreground">Ваш заказ</p>
              </div>
              <div id="cart-items" className="space-y-4">
                {/* Cart items will be rendered here by the CartSheet component */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div id="mobile-search" className="md:hidden px-4 pb-3 hidden">
        <form onSubmit={handleSearch} className="flex w-full">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск сомсы..."
            className="w-full"
          />
        </form>
      </div>
    </header>
  );
};

export default Header;
