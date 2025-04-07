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
import { Trash, Plus, Minus, Truck } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

const CartSheet = () => {
  const { 
    items, 
    addItem, 
    removeItem, 
    clearCart, 
    cartTotal, 
    addOrder, 
    freeDeliveryThreshold, 
    hasQualifiedForFreeDelivery,
    deliveryCost,
    totalWithDelivery
  } = useCart();
  
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
    
    // Submit the order to the cart context
    addOrder(orderForm);
    
    toast({
      title: "Buyurtma qabul qilindi!",
      description: "Tez orada siz bilan bog'lanamiz",
    });
    
    setOrderDialogOpen(false);
  };

  if (items.length === 0) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Savat bo'sh</SheetTitle>
          <SheetDescription>
            Buyurtma berish uchun savatga mahsulotlar qo'shing
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
            Savatingiz bo'sh. Menudagi mazali somsalardan qo'shing!
          </p>
        </div>
      </>
    );
  }

  const remainingForFreeDelivery = freeDeliveryThreshold - cartTotal;

  return (
    <>
      <SheetHeader>
        <SheetTitle>Sizning savatingiz</SheetTitle>
        <SheetDescription>
          Savatda {items.length} ta mahsulot
        </SheetDescription>
      </SheetHeader>
      
      {!hasQualifiedForFreeDelivery && (
        <Alert className="mt-4 bg-muted/50">
          <Truck className="h-4 w-4" />
          <AlertDescription>
            Bepul yetkazib berish uchun yana {remainingForFreeDelivery.toLocaleString()} so'mlik mahsulot qo'shing
          </AlertDescription>
        </Alert>
      )}
      
      {hasQualifiedForFreeDelivery && (
        <Alert className="mt-4 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
          <Truck className="h-4 w-4" />
          <AlertDescription>
            Sizga bepul yetkazib berish xizmati taqdim etiladi!
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col gap-3 my-4 max-h-[40vh] overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={item.id} className="">
            <div className="w-16 h-16 rounded-md overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
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
              <div className="text-right">
                <span className="font-medium">
                  {(item.price * item.quantity).toLocaleString()} сум
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Separator />
      
      <div className="space-y-4 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span>Buyurtma summasi:</span>
            <span className="font-medium">{cartTotal.toLocaleString()} so'm</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Yetkazib berish:</span>
            <span className={hasQualifiedForFreeDelivery ? "text-green-600 dark:text-green-400 font-medium" : "font-medium"}>
              {hasQualifiedForFreeDelivery ? "Bepul" : `${deliveryCost.toLocaleString()} so'm`}
            </span>
          </div>
          <div className="flex items-center justify-between font-medium pt-1.5">
            <span>Jami:</span>
            <span className="text-xl">{totalWithDelivery.toLocaleString()} so'm</span>
          </div>
        </div>
        
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Buyurtma berish</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] h-[100vh] md:h-auto md:max-w-[425px] md:max-h-[90vh] p-0 md:p-6">
            <DialogHeader className="p-6 md:p-0">
              <DialogTitle>Buyurtma rasmiylashtirish</DialogTitle>
              <DialogDescription>
                Yetkazib berish uchun ma'lumotlarni to'ldiring
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmitOrder} className="px-6 md:px-0">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Ism</Label>
                  <Input
                    id="name"
                    name="name"
                    value={orderForm.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
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
                  <Label htmlFor="address">Yetkazib berish manzili</Label>
                  <Input
                    id="address"
                    name="address"
                    value={orderForm.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter className="p-6 md:p-0">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button type="submit">Buyurtmani tasdiqlash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" className="w-full" onClick={clearCart}>
          Savatni tozalash
        </Button>
      </div>
    </>
  );
};

export default CartSheet;
