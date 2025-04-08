import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart, Order } from "@/hooks/use-cart";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ClipboardList, Check, Truck, Package, X, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { updateOrderRating } from '@/utils/api';

const OrderStatusIcon = ({ status }: { status: Order["status"] }) => {
  switch (status) {
    case "processing":
      return <Package className="h-4 w-4" />;
    case "delivering":
      return <Truck className="h-4 w-4" />;
    case "completed":
      return <Check className="h-4 w-4" />;
    case "cancelled":
      return <X className="h-4 w-4" />;
  }
};

const OrderStatusBadge = ({ status }: { status: Order["status"] }) => {
  let variant: "default" | "secondary" | "outline" = "outline";
  let label = "";
  let className = "";

  switch (status) {
    case "processing":
      variant = "outline";
      label = "Qayta ishlashda";
      className = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900";
      break;
    case "delivering":
      variant = "outline";
      label = "Yetkazilmoqda";
      className = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900";
      break;
    case "completed":
      variant = "outline";
      label = "Yetkazib berildi";
      className = "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900";
      break;
    case "cancelled":
      variant = "outline";
      label = "Bekor qilingan";
      className = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900";
      break;
  }

  return (
    <Badge variant={variant} className={`ml-2 ${className}`}>
      <OrderStatusIcon status={status} />
      <span className="ml-1">{label}</span>
    </Badge>
  );
};

const StarRating = ({ 
  rating, 
  onRating, 
  disabled 
}: { 
  rating: number; 
  onRating: (rating: number) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !disabled && onRating(star)}
          disabled={disabled}
          className={`transition-colors ${
            disabled ? "cursor-default" : "hover:text-yellow-400"
          } ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  );
};

const OrderStatus = () => {
  const { orders, updateOrder } = useCart();
  const [isRating, setIsRating] = useState(false);

  const handleRating = async (orderId: string, rating: number) => {
    if (isRating) return;
    
    try {
      setIsRating(true);
      const updatedOrder = await updateOrderRating(orderId, rating);
      updateOrder(updatedOrder);
    } catch (error) {
      console.error('Failed to update rating:', error);
    } finally {
      setIsRating(false);
    }
  };

  if (orders.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          <span>buyurtma</span>
          <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buyurtma tarixi</DialogTitle>
          <DialogDescription>
          Buyurtmalaringiz holatini ko'ring
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {orders.map((order) => {
            const deliveryCost = order.freeDelivery ? 0 : 10000;
            const totalWithDelivery = order.total + deliveryCost;
            
            return (
              <div key={order.id} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Buyurtma vaqti {format(order.createdAt, "d MMMM, HH:mm", {locale: ru})}</p>
                    <p className="text-sm text-muted-foreground">{order.customer.name}, {order.customer.phone}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Mahsulotlar:</p>
                  <ul className="text-sm space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="font-medium">{(item.price * item.quantity).toLocaleString()} so'm</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex flex-col border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Buyurtma narxi</span>
                    <span className="font-medium">{order.total.toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Yetkazib berish:</span>
                    <span className={order.freeDelivery ? "text-green-600 dark:text-green-400 font-medium" : "font-medium"}>
                      {order.freeDelivery ? "Bepul" : "10,000 so'm"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Jami:</span>
                    <span>{totalWithDelivery.toLocaleString()} so'm</span>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <span>Manzil: {order.customer.address}</span>
                </div>
                
                {order.status === "completed" && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">
                      {order.rating 
                        ? "Sizning bahoyingiz:" 
                        : "Yetkazib berish xizmatini baholang:"}
                    </p>
                    <StarRating 
                      rating={order.rating || 0} 
                      onRating={(rating) => handleRating(order.id, rating)}
                      disabled={!!order.rating || isRating}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        
      </DialogContent>
    </Dialog>
  );
};

export default OrderStatus;
