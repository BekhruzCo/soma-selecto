
import { 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Trash, Plus, Minus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const CartSheet = () => {
  const { items, addItem, removeItem, clearCart, cartTotal } = useCart();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the order to a backend
    console.log("Order submitted:", {
      customer: orderForm,
      items,
      total: cartTotal,
    });
    
    toast({
      title: "Заказ оформлен!",
      description: "Мы свяжемся с вами в ближайшее время",
    });
    
    clearCart();
    setOrderDialogOpen(false);
  };

  if (items.length === 0) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Корзина пуста</SheetTitle>
          <SheetDescription>
            Добавьте товары в корзину, чтобы оформить заказ
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
          </div>
          <p className="text-muted-foreground text-center">
            Ваша корзина пуста. Добавьте вкусную сомсу из нашего меню!
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Ваша корзина</SheetTitle>
        <SheetDescription>
          {items.length} {items.length === 1 ? 'товар' : 
            items.length < 5 ? 'товара' : 'товаров'} в корзине
        </SheetDescription>
      </SheetHeader>
      
      <div className="flex flex-col gap-3 my-4">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="w-16 h-16 rounded-md overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
              <p className="text-muted-foreground text-sm">{item.price.toLocaleString()} сум</p>
              
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-7 w-7"
                    onClick={() => addItem(item, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-7 w-7"
                    onClick={() => addItem(item, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="text-right">
              <span className="font-medium">
                {(item.price * item.quantity).toLocaleString()} сум
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <Separator />
      
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between font-medium">
          <span>Итого:</span>
          <span className="text-xl">{cartTotal.toLocaleString()} сум</span>
        </div>
        
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Оформить заказ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Оформление заказа</DialogTitle>
              <DialogDescription>
                Заполните информацию для доставки
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitOrder}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    name="name"
                    value={orderForm.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={orderForm.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Адрес доставки</Label>
                  <Input
                    id="address"
                    name="address"
                    value={orderForm.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit">Подтвердить заказ</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" className="w-full" onClick={clearCart}>
          Очистить корзину
        </Button>
      </div>
    </>
  );
};

export default CartSheet;
