
import { Product } from "@/data/products";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { sendTelegramNotification } from "@/utils/telegram";

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

  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('orders');
      const parsedOrders = savedOrders ? JSON.parse(savedOrders) : [];
      return parsedOrders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt)
      }));
    }
    return [];
  });

  const freeDeliveryThreshold = 100000;
  const deliveryCost = 15000;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ordersToStore = orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString()
      }));
      localStorage.setItem('orders', JSON.stringify(ordersToStore));
    }
  }, [orders]);

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
      await sendTelegramNotification(newOrder);
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status } 
          : order
      )
    );
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
      totalWithDelivery
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
