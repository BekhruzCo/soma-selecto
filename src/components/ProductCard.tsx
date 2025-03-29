
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem, items } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  const cartItem = items.find(item => item.id === product.id);
  
  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} добавлен в вашу корзину`,
      duration: 2000,
    });
  };

  return (
    <Card 
      className="product-card h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name} 
            className="product-img transition-transform duration-500 hover:scale-110" 
          />
        </div>
        {product.popular && (
          <Badge className="absolute top-2 right-2 bg-accent">
            Популярное
          </Badge>
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
        {cartItem ? (
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
            В корзину
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
