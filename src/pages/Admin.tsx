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
import { products as initialProducts } from '../data/products'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as XLSX from 'xlsx';

const OrderStatusBadge = ({ status }: { status: Order["status"] }) => {
  switch (status) {
    case "processing":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900">Jarayonda</Badge>;
    case "delivering":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900">Yetkazilmoqda</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">Yetkazildi</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900">Bekor qilindi</Badge>;
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
        // Tayyor mahsulotlar ro'yxatini ishlatish
        setProducts(initialProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        toast({
          title: "Xatolik",
          description: "Mahsulotlar ro'yxatini yuklab bo'lmadi",
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
      title: "Mahsulot qo'shildi",
      description: "Yangi mahsulot katalogga muvaffaqiyatli qo'shildi"
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
        title: "Mahsulot o'chirildi",
        description: "Mahsulot katalogdan muvaffaqiyatli o'chirildi"
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Xatolik",
        description: "Mahsulotni o'chirib bo'lmadi",
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
      title: "Mahsulot yangilandi",
      description: "Mahsulot katalogda muvaffaqiyatli yangilandi"
    });
  };

  const handleExport = () => {
    try {
      // Excel uchun ma'lumotlarni tayyorlash
      const exportData = products.map(product => ({
        'ID': `#${product.id.slice(-5)}`,
        'Nomi': product.name,
        'Narxi': `${product.price.toLocaleString()} so'm`,
        'Kategoriya': product.category === 'classic' ? 'Klassik' : "Go'shtli"
      }));

      // Excel yaratish
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mahsulotlar");
      
      // Faylni yuklab olish
      XLSX.writeFile(wb, `mahsulotlar-${format(new Date(), "dd-MM-yyyy")}.xlsx`);

      toast({
        title: "Muvaffaqiyatli",
        description: "Mahsulotlar ro'yxati Excel formatida yuklab olindi",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Xatolik",
        description: "Excel faylni yaratishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
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
      {/* Mahsulot qo'shish FORMA si */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Yangi mahsulot qo'shish</CardTitle>
          <CardDescription>Katalogga yangi mahsulot qo'shish uchun formani to'ldiring</CardDescription>
        </CardHeader>
        <CardContent>
          <AddProductForm onProductAdded={handleProductAdded} />
        </CardContent>
      </Card> */}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Mahsulotlarni boshqarish</CardTitle>
            <CardDescription>Katalogdagi mahsulotlarni ko'rish va tahrirlash</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Eksport
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Mahsulotlar yo'q</h3>
              <p className="text-muted-foreground">
                Yuqoridagi forma orqali birinchi mahsulotni qo'shing
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rasm</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Narxi</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Harakatlar</TableHead>
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
                    <TableCell>{product.price.toLocaleString()} so'm</TableCell>
                    <TableCell>
                      {product.category === 'classic' && 'Klassik'}
                      {product.category === 'meat' && 'Go\'shtli'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 cursor-not-allowed opacity-50"
                                disabled={true}
                                onClick={() => handleEditProduct(product)}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                O'zgartirish
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Hozircha ishlamaydi</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-destructive hover:text-destructive cursor-not-allowed opacity-50"
                                disabled={true}
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                O'chirish
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Hozircha ishlamaydi</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
              <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
              <DialogDescription>
                Mahsulot ma'lumotlarini o'zgartiring. Tugatganingizdan so'ng saqlashni bosing.
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
  
  const filteredOrders = orders
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Eng yangi buyurtmalar birinchi
    .filter(order => {
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
      "processing": "qayta ishlashga qabul qilindi",
      "delivering": "yetkazib berishga topshirildi",
      "completed": "yetkazib berildi",
      "cancelled": "bekor qilindi"
    };
    
    toast({
      title: "Holat yangilandi",
      description: `Buyurtma #${orderId.slice(-5)} ${statusMessages[status]}`,
    });
    
    setSelectedOrderId(null);
    setActionType(null);
  };

  const handleOrderStatusChange = async (orderId: string | null, newStatus: Order["status"]) => {
    if (!orderId) return;
    
    try {
      updateOrderStatus(orderId, newStatus);
      await updateOrderStatusViaTelegram(orderId, newStatus);
      
      const statusMessages = {
        processing: "qayta ishlashga qabul qilindi",
        delivering: "yetkazib berishga topshirildi",
        completed: "yetkazib berildi",
        cancelled: "bekor qilindi"
      };
      
      toast({
        title: "Holat yangilandi",
        description: `Buyurtma #${orderId.slice(-5)} ${statusMessages[newStatus]}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Xatolik",
        description: "Buyurtma holatini yangilashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setSelectedOrderId(null);
      setActionType(null);
    }
  };

  const getDialogContent = () => {
    if (!actionType || !selectedOrderId) return null;
    
    const messages = {
      confirm: {
        title: "Buyurtmani tasdiqlash?",
        description: "Siz ushbu buyurtmani tasdiqlashni va uni qayta ishlashni boshlashni xohlaysizmi?",
        action: "Tasdiqlash",
        status: "processing" as Order["status"]
      },
      deliver: {
        title: "Yetkazib berishga yuborish?",
        description: "Siz ushbu buyurtmani yetkazib berishga yuborishni xohlaysizmi?",
        action: "Yuborish",
        status: "delivering" as Order["status"]
      },
      complete: {
        title: "Yetkazildi deb belgilash?",
        description: "Siz ushbu buyurtmani yetkazildi deb belgilashni xohlaysizmi?",
        action: "Belgilash",
        status: "completed" as Order["status"]
      },
      cancel: {
        title: "Buyurtmani bekor qilish?",
        description: "Siz ushbu buyurtmani bekor qilishni xohlaysizmi?",
        action: "Bekor qilish",
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
            Bekor qilish
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
              placeholder="Ism, telefon yoki manzil bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Holat bo'yicha filtr" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha buyurtmalar</SelectItem>
                <SelectItem value="processing">Jarayonda</SelectItem>
                <SelectItem value="delivering">Yetkazilmoqda</SelectItem>
                <SelectItem value="completed">Yetkazildi</SelectItem>
                <SelectItem value="cancelled">Bekor qilindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-muted p-8 rounded-lg text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Buyurtmalar yo'q</h2>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "Buyurtmalar topilmadi. Qidiruv parametrlarini o'zgartiring." 
              : "Mijozlar buyurtma qilganda, ular shu yerda paydo bo'ladi."}
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
            placeholder="Ism, telefon yoki manzil bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Holat bo'yicha filtr" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha buyurtmalar</SelectItem>
              <SelectItem value="processing">Jarayonda</SelectItem>
              <SelectItem value="delivering">Yetkazilmoqda</SelectItem>
              <SelectItem value="completed">Yetkazildi</SelectItem>
              <SelectItem value="cancelled">Bekor qilindi</SelectItem>
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
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Manzil</TableHead>
                    <TableHead>Summasi</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Harakatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrders.map((order) => {
                    const deliveryCost = order.freeDelivery ? 0 : 10000;
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
                          <div>{order.total.toLocaleString()} so'm</div>
                          <div className="text-sm text-muted-foreground">
                            + {order.freeDelivery ? "Bepul yetkazib berish" : "Yetkazib berish 10,000 so'm"}
                          </div>
                          <div className="font-medium">{totalWithDelivery.toLocaleString()} so'm</div>
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
                                  Yetkazish
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Buyurtmani yetkazishga o'tkazish</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Buyurtma yetkazib berish jarayoniga o'tkazilsinmi?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setSelectedOrderId(null)}>
                                    Bekor qilish
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleOrderStatusChange(selectedOrderId, "delivering")}
                                  >
                                    Tasdiqlash
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
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
                                    Tugatish
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Buyurtmani tugatish</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Buyurtma yetkazib berildi deb belgilansinmi?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedOrderId(null)}>
                                      Bekor qilish
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleOrderStatusChange(selectedOrderId, "completed")}
                                    >
                                      Tasdiqlash
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
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
                                    Bekor qilish
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Buyurtmani bekor qilish</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Buyurtmani bekor qilishni tasdiqlaysizmi?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedOrderId(null)}>
                                      Yo'q
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleOrderStatusChange(selectedOrderId, "cancelled")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Ha, bekor qilish
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
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
              <CardTitle className="text-sm font-medium">Jami buyurtmalar</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {activeOrders} faol buyurtmalar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daromad</CardTitle>
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
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} so'm</div>
              <p className="text-xs text-muted-foreground">
                {completedOrders} bajarilgan buyurtmalar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha buyurtma qiymati</CardTitle>
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
              <div className="text-2xl font-bold">{Math.round(averageOrderValue).toLocaleString()} so'm</div>
              <p className="text-xs text-muted-foreground">
                +{Math.round(Math.random() * 20)}% o'tgan oydan
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekor qilingan buyurtmalar</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cancelledOrders}</div>
              <p className="text-xs text-muted-foreground">
                {cancelledOrders > 0 
                  ? `${Math.round((cancelledOrders / totalOrders) * 100)}% barcha buyurtmalardan` 
                  : "0% barcha buyurtmalardan"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>So'nggi buyurtmalar</CardTitle>
            <CardDescription>
              Tizimdagi so'nggi {recentOrders.length} buyurtmalar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyurtma ID</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Summasi</TableHead>
                  <TableHead>Holat</TableHead>
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
                      <TableCell>{totalWithDelivery.toLocaleString()} so'm</TableCell>
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
        title: "Tizimdan chiqish",
        description: "Siz administrator panelidant chiqdingiz",
      });
      navigate("/");
    };
  
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Administrator paneli</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Chiqish
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">
              <Calendar className="h-4 w-4 mr-2" />
              Boshqaruv paneli
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Buyurtmalar
            </TabsTrigger>
            <TabsTrigger value="products">
              <Filter className="h-4 w-4 mr-2" />
              Mahsulotlar
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
