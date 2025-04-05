import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, Edit, Heart } from "lucide-react";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProduct } from "@/utils/api";
import { sendProductUpdateToTelegram } from "@/utils/telegram";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ProductCardProps {
  product: Product;
  adminMode?: boolean;
  onProductUpdated?: (product: Product) => void;
}

const ProductCard = ({ product, adminMode = false, onProductUpdated }: ProductCardProps) => {
  const { addItem, items } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price.toString());
  const [category, setCategory] = useState<string>(product.category || 'classic');
  const [popular, setPopular] = useState<boolean>(product.popular || false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const cartItem = items.find(item => item.id === product.id);
  
  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Savatga qo'shildi",
      description: `${product.name} savatingizga qo'shildi`,
      duration: 2000,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('popular', popular.toString());
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      const updatedProduct = await updateProduct(product.id, formData);
      
      // Notify Telegram about product update
      await sendProductUpdateToTelegram('edit', {
        id: product.id,
        name: name,
        price: parseFloat(price),
      });
      
      toast({
        title: "Mahsulot yangilandi",
        description: `${name} muvaffaqiyatli yangilandi`,
        duration: 3000,
      });
      
      if (onProductUpdated) {
        onProductUpdated(updatedProduct);
      }
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Xatolik",
        description: "Mahsulotni yangilab bo‘lmadi. Qayta urinib ko'ring.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card 
        className="product-card h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <div className="overflow-hidden">
            <img 
              src={product.image || "/placeholder.svg"} 
              // src="../../dist/classic_somsa.jpg"
              alt={product.name} 
              className="product-img w-full h-48 object-cover transition-transform duration-500 hover:scale-110" 
            />
          </div>
          {product.popular && (
            <Badge className="absolute top-2 right-2 bg-accent">
              Mashhur
            </Badge>
          )}
          {adminMode && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-2 left-2 bg-background/80 hover:bg-background"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-bold">{product.name}</CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm line-clamp-2">
              {product.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-2 flex-grow">
          <div className="mt-2">
            <span className="font-bold text-lg text-primary">
              {product.price.toLocaleString()} сум
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          {adminMode ? (
            <Button 
              onClick={() => setIsEditDialogOpen(true)} 
              className="w-full"
            >
              <Edit className="mr-2 h-4 w-4" />
              Tahrirlash
            </Button>
          ) : cartItem ? (
            <div className="flex items-center w-full justify-between">
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => addItem(product, -1)}
                disabled={cartItem.quantity <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium">{cartItem.quantity}</span>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => addItem(product, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleAddToCart} 
              className="w-full"
              variant={isHovered ? "default" : "outline"}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Savatga qo'shish
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Mahsulotni tahrirlash</DialogTitle>
              <DialogDescription>
                Mahsulot ma'lumotlariga o'zgartirish kiriting. Tugatganingizdan so'ng saqlashni bosing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nomi
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Tavsifi
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Narxi
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Kategoriya
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={category} 
                    onValueChange={setCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Klassik</SelectItem>
                      <SelectItem value="meat">Go'shtli</SelectItem>
                      <SelectItem value="vegetable">Sabzavotli</SelectItem>
                      <SelectItem value="special">Maxsus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="popular" className="text-right">
                  Mashhur
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch 
                    id="popular" 
                    checked={popular} 
                    onCheckedChange={setPopular} 
                  />
                  <Label htmlFor="popular">
                    {popular ? "Да" : "Нет"}
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Rasm
                </Label>
                <div className="col-span-3">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {(imagePreview || product.image) && (
                    <div className="mt-2">
                      <img
                        src={imagePreview || product.image}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saqlanmoqda..." : "O'zgarishlarni saqlang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
