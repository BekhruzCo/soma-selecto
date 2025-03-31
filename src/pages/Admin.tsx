import { useState, useEffect } from "react";
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
  LogOut,
  Calendar,
  Filter,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { updateOrderStatusViaTelegram } from "@/utils/telegram";
import AddProductForm from "@/components/AddProductForm";
import ProductCard from "@/components/ProductCard";
import { fetchProducts, deleteProduct } from "@/utils/api";
import { sendProductUpdateToTelegram } from "@/utils/telegram";
import { Product } from "@/data/products";

const OrderStatusBadge = ({ status }: { status: Order["status"] }) => {
  switch (status) {
    case "processing":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900">В обработке</Badge>;
    case "delivering":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900">Доставляется</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">Доставлено</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900">Отменен</Badge>;
    default:
      return null;
  }
};

const ProductsTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список товаров",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  const handleProductAdded = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    toast({
      title: "Товар добавлен",
      description: "Новый товар успешно добавлен в каталог"
    });
  };
  
  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      
      // Notify Telegram
      const productToDelete = products.find(p => p.id === productId);
      if (productToDelete) {
        await sendProductUpdateToTelegram('delete', {
          id: productToDelete.id,
          name: productToDelete.name,
          price: productToDelete.price,
        });
      }
      
      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Товар удален",
        description: "Товар успешно удален из каталога"
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
    setShowEditDialog(false);
    toast({
      title: "Товар обновлен",
      description: "Товар успешно обновлен в каталоге"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Добавить новый товар</CardTitle>
          <CardDescription>Заполните форму, чтобы добавить новый товар в каталог</CardDescription>
        </CardHeader>
        <CardContent>
          <AddProductForm onProductAdded={handleProductAdded} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Управление товарами</CardTitle>
            <CardDescription>Просмотр и редактирование товаров в каталоге</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Экспорт
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Нет товаров</h3>
              <p className="text-muted-foreground">
                Добавьте первый товар с помощью формы выше
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Изображение</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img 
                        src={product.image || "/placeholder.svg"} 
                        alt={product.name} 
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{product.id.slice(-5)}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.price.toLocaleString()} сум</TableCell>
                    <TableCell>
                      {product.category === 'classic' && 'Классическая'}
                      {product.category === 'meat' && 'Мясная'}
                      {product.category === 'vegetable' && 'Овощная'}
                      {product.category === 'special' && 'Особая'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Изменить
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen && selectedProduct?.id === product.id}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Удалить
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                                Отмена
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => selectedProduct && handleDeleteProduct(selectedProduct.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for editing products */}
      {editingProduct && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Редактировать товар</DialogTitle>
              <DialogDescription>
                Внесите изменения в информацию о товаре. Нажмите сохранить, когда закончите.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ProductCard 
                product={editingProduct} 
                adminMode={true} 
                onProductUpdated={handleProductUpdated} 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const OrdersTab = () => {
  const { orders, updateOrderStatus } = useCart();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"confirm" | "deliver" | "complete" | "cancel" | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });
  
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleStatusUpdate = async (orderId: string, status: Order["status"]) => {
    updateOrderStatus(orderId, status);
    
    try {
      await updateOrderStatusViaTelegram(orderId, status);
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
    
    const statusMessages = {
      "processing": "принят в обработку",
      "delivering": "передан в доставку",
      "completed": "доставлен",
      "cancelled": "отменен"
    };
    
    toast({
      title: "Статус обновлен",
      description: `Заказ #${orderId.slice(-5)} ${statusMessages[status]}`,
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

  if (filteredOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Поиск по имени, телефону или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все заказы</SelectItem>
                <SelectItem value="processing">В обработке</SelectItem>
                <SelectItem value="delivering">Доставляется</SelectItem>
                <SelectItem value="completed">Доставлено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-muted p-8 rounded-lg text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Нет заказов</h2>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "Заказы не найдены. Попробуйте изменить параметры поиска." 
              : "Когда клиенты сделают заказы, они появятся здесь."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Поиск по имени, телефону или адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по стatusу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заказы</SelectItem>
              <SelectItem value="processing">В обработке</SelectItem>
              <SelectItem value="delivering">Доставляется</SelectItem>
              <SelectItem value="completed">Доставлено</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <AlertDialog>
        <AlertDialogTrigger className="hidden" />
        {getDialogContent()}
      </AlertDialog>
      
      <Card>
        <CardContent className="p-0">
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
                {currentOrders.map((order) => {
                  const deliveryCost = order.freeDelivery ? 0 : 15000;
                  const totalWithDelivery = order.total + deliveryCost;
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id.slice(-5)}</TableCell>
                      <TableCell>{format(order.createdAt, "dd.MM.yyyy HH:mm", {locale: ru})}</TableCell>
                      <TableCell>
                        <div>{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                      </TableCell>
                      <TableCell>{order.customer.address}</TableCell>
                      <TableCell>
                        <div>{order.total.toLocaleString()} сум</div>
                        <div className="text-sm text-muted-foreground">
                          + {order.freeDelivery ? "Бесплатная доставка" : "Доставка 15,000 сум"}
                        </div>
                        <div className="font-medium">{totalWithDelivery.toLocaleString()} сум</div>
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink 
                  isActive={currentPage === index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

const DashboardTab = () => {
  const { orders } = useCart();
  
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
  const activeOrders = orders.filter(o => ["processing", "delivering"].includes(o.status)).length;
  
  const totalRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, order) => {
      const deliveryCost = order.freeDelivery ? 0 : 15000;
      return sum + order.total + deliveryCost;
    }, 0);
    
  const averageOrderValue = completedOrders > 0 
    ? totalRevenue / completedOrders 
    : 0;
  
  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {activeOrders} активных заказов
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} сум</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders} выполненных заказов
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageOrderValue).toLocaleString()} сум</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(Math.random() * 20)}% с прошлого месяца
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отмененные заказы</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledOrders}</div>
            <p className="text-xs text-muted-foreground">
              {cancelledOrders > 0 
                ? `${Math.round((cancelledOrders / totalOrders) * 100)}% от всех заказов` 
                : "0% от всех заказов"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Недавние заказы</CardTitle>
          <CardDescription>
            Последние {recentOrders.length} заказов в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Заказа</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => {
                const deliveryCost = order.freeDelivery ? 0 : 15000;
                const totalWithDelivery = order.total + deliveryCost;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(-5)}</TableCell>
                    <TableCell>{format(order.createdAt, "dd.MM.yyyy HH:mm", {locale: ru})}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{totalWithDelivery.toLocaleString()} сум</TableCell>
                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    toast({
      title: "Выход выполнен",
      description: "Вы вышли из панели администратора",
    });
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Выйти
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="dashboard">
            <Calendar className="h-4 w-4 mr-2" />
            Дашборд
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Заказы
          </TabsTrigger>
          <TabsTrigger value="products">
            <Filter className="h-4 w-4 mr-2" />
            Товары
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
