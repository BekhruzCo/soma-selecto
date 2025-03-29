
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
import { ClipboardList, Check, Truck, Package, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      label = "В обработке";
      className = "bg-yellow-50 text-yellow-700 border-yellow-200";
      break;
    case "delivering":
      variant = "outline";
      label = "Доставляется";
      className = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "completed":
      variant = "outline";
      label = "Доставлено";
      className = "bg-green-50 text-green-700 border-green-200";
      break;
    case "cancelled":
      variant = "outline";
      label = "Отменен";
      className = "bg-red-50 text-red-700 border-red-200";
      break;
  }

  return (
    <Badge variant={variant} className={`ml-2 ${className}`}>
      <OrderStatusIcon status={status} />
      <span className="ml-1">{label}</span>
    </Badge>
  );
};

const OrderStatus = () => {
  const { orders } = useCart();

  if (orders.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          <span>Мои заказы</span>
          <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>История заказов</DialogTitle>
          <DialogDescription>
            Просмотр статуса ваших заказов
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Заказ от {format(order.createdAt, "d MMMM, HH:mm", {locale: ru})}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.name}, {order.customer.phone}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Товары:</p>
                <ul className="text-sm space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">{(item.price * item.quantity).toLocaleString()} сум</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Сумма заказа:</span>
                  <span className="font-medium">{order.total.toLocaleString()} сум</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Доставка:</span>
                  <span className={order.freeDelivery ? "text-green-600 font-medium" : "font-medium"}>
                    {order.freeDelivery ? "Бесплатно" : "15,000 сум"}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-1">
                  <span>Итого:</span>
                  <span>{order.total.toLocaleString()} сум</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <span>Адрес: {order.customer.address}</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStatus;
