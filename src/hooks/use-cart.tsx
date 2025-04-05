
import { Product } from "@/data/products";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { sendTelegramNotification, updateOrderStatusViaTelegram } from "@/utils/telegram";
import { createOrder as apiCreateOrder, updateOrderStatus as apiUpdateOrderStatus, fetchOrders } from "@/utils/api";
import { toast } from "@/hooks/use-toast";

export type CartItem = Product & {
  quantity: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  total: number;
  status: "processing" | "delivering" | "completed" | "cancelled";
  createdAt: Date;
  freeDelivery: boolean;
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  addOrder: (customer: { name: string; phone: string; address: string }) => void;
  freeDeliveryThreshold: number;
  hasQualifiedForFreeDelivery: boolean;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  deliveryCost: number;
  totalWithDelivery: number;
  loadOrders: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const freeDeliveryThreshold = 100000;
  const deliveryCost = 10000;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    // Load orders from API on initial mount
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const apiOrders = await fetchOrders();
      setOrders(apiOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
      // Fallback to local storage if API fails
      if (typeof window !== 'undefined') {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          setOrders(parsedOrders.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt)
          })));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity <= 0) {
          return prevItems.filter(item => item.id !== product.id);
        }
        
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: newQuantity } 
            : item
        );
      }
      
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const hasQualifiedForFreeDelivery = cartTotal >= freeDeliveryThreshold;
  
  const totalWithDelivery = hasQualifiedForFreeDelivery 
    ? cartTotal 
    : cartTotal + deliveryCost;

  const addOrder = async (customer: { name: string; phone: string; address: string }) => {
    if (items.length === 0) return;

    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...items],
      customer,
      total: cartTotal,
      status: "processing",
      createdAt: new Date(),
      freeDelivery: hasQualifiedForFreeDelivery
    };

    try {
      // Send to API
      const savedOrder = await apiCreateOrder(newOrder);
      
      // Send notification to Telegram
      await sendTelegramNotification(savedOrder);
      
      // Add to local state
      setOrders(prev => [savedOrder, ...prev]);
      
      // Clear cart after successful order
      clearCart();
      
      toast({
        title: "Buyurtma berildi",
        description: "Buyurtmangiz muvaffaqiyatli joylashtirildi va qayta ishlashga yuborildi.",
        duration: 5000,
      });
      
    } catch (error) {
      console.error("Failed to create order:", error);
      
      // Fallback: save locally and send notification
      try {
        await sendTelegramNotification(newOrder);
      } catch (telegramError) {
        console.error("Failed to send Telegram notification:", telegramError);
      }
      
      // Save to local state anyway
      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      
      toast({
        title: "Buyurtma berildi",
        description: "Buyurtmangiz qabul qilindi, lekin ulanishda muammo yuz berdi. Tasdiqlash uchun siz bilan bog'lanamiz.",
        duration: 5000,
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      // Update via API
      const updatedOrder = await apiUpdateOrderStatus(orderId, status);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...updatedOrder } 
            : order
        )
      );
      
      // Notify Telegram
      await updateOrderStatusViaTelegram(orderId, status);
      
      // Show toast notification
      const statusMessages = {
        "processing": "qayta ishlashda",
        "delivering": "yetkazib berishga yuborildi",
        "completed": "yetkazildi",
        "cancelled": "bekor qilindi"      
      };
      
      toast({
        title: "Buyurtma holati yangilandi",
        description: `Buyurtma #${orderId.slice(-5)} ${statusMessages[status]}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Failed to update order status:", error);
      
      // Fallback: update local state only
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status } 
            : order
        )
      );
      
      // Try to notify Telegram anyway
      try {
        await updateOrderStatusViaTelegram(orderId, status);
      } catch (telegramError) {
        console.error("Failed to send Telegram notification:", telegramError);
      }
      
      toast({
        title: "Buyurtma holati yangilandi",
        description: "Holat mahalliy sifatida yangilandi, lekin sinxronlashda muammolar bor.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      clearCart, 
      cartTotal, 
      orders, 
      addOrder,
      freeDeliveryThreshold,
      hasQualifiedForFreeDelivery,
      updateOrderStatus,
      deliveryCost,
      totalWithDelivery,
      loadOrders
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}
