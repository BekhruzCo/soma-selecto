
import { useState } from "react";
import { useCart, Order } from "@/hooks/use-cart";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Check,
  Truck,
  X,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const OrderStatusBadge = ({ status }: { status: Order["status"] }) => {
  switch (status) {
    case "processing":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">В обработке</Badge>;
    case "delivering":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Доставляется</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Доставлено</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Отменен</Badge>;
    default:
      return null;
  }
};

const Admin = () => {
  const { orders, updateOrderStatus } = useCart();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "deliver" | "complete" | "cancel" | null>(null);

  const handleStatusUpdate = (orderId: string, status: Order["status"]) => {
    updateOrderStatus(orderId, status);
    
    const statusMessages = {
      "processing": "принят в обработку",
      "delivering": "передан в доставку",
      "completed": "доставлен",
      "cancelled": "отменен"
    };
    
    toast({
      title: "Статус обновлен",
      description: `Заказ #${orderId} ${statusMessages[status]}`,
    });
    
    setSelectedOrderId(null);
    setActionType(null);
  };

  const getDialogContent = () => {
    if (!actionType || !selectedOrderId) return null;
    
    const messages = {
      confirm: {
        title: "Подтвердить заказ?",
        description: "Вы уверены, что хотите подтвердить этот заказ и начать его обработку?",
        action: "Подтвердить",
        status: "processing" as Order["status"]
      },
      deliver: {
        title: "Отправить в доставку?",
        description: "Вы уверены, что хотите отправить этот заказ в доставку?",
        action: "Отправить",
        status: "delivering" as Order["status"]
      },
      complete: {
        title: "Пометить как доставлено?",
        description: "Вы уверены, что хотите отметить этот заказ как доставленный?",
        action: "Пометить",
        status: "completed" as Order["status"]
      },
      cancel: {
        title: "Отменить заказ?",
        description: "Вы уверены, что хотите отменить этот заказ?",
        action: "Отменить",
        status: "cancelled" as Order["status"]
      }
    };

    const { title, description, action, status } = messages[actionType];

    return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { 
            setSelectedOrderId(null);
            setActionType(null);
          }}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => handleStatusUpdate(selectedOrderId, status)}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Панель администратора</h1>
        <div className="bg-muted p-8 rounded-lg text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Нет заказов</h2>
          <p className="text-muted-foreground">
            Когда клиенты сделают заказы, они появятся здесь.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Панель администратора</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-medium">Управление заказами</h2>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger className="hidden" />
          {getDialogContent()}
        </AlertDialog>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Заказа</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(-5)}</TableCell>
                  <TableCell>{format(order.createdAt, "dd.MM.yyyy HH:mm", {locale: ru})}</TableCell>
                  <TableCell>
                    <div>{order.customer.name}</div>
                    <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                  </TableCell>
                  <TableCell>{order.customer.address}</TableCell>
                  <TableCell>{order.total.toLocaleString()} сум</TableCell>
                  <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === "processing" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setActionType("deliver");
                              }}
                            >
                              <Truck className="h-3.5 w-3.5 mr-1" />
                              Доставка
                            </Button>
                          </AlertDialogTrigger>
                        </AlertDialog>
                      )}
                      
                      {order.status === "delivering" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setActionType("complete");
                              }}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Завершить
                            </Button>
                          </AlertDialogTrigger>
                        </AlertDialog>
                      )}
                      
                      {(order.status === "processing" || order.status === "delivering") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setActionType("cancel");
                              }}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Отменить
                            </Button>
                          </AlertDialogTrigger>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
