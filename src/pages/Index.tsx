
import { useState, useEffect } from "react";
import ProductGrid from "@/components/ProductGrid";
import CategoryFilter from "@/components/CategoryFilter";
import { products, ProductCategory } from "@/data/products";
import { SheetTrigger, Sheet, SheetContent } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { Separator } from "@/components/ui/separator";
import CartSheet from "@/components/CartSheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const { items } = useCart();
  
  // Apply filters when search term or category changes
  useEffect(() => {
    let results = products;
    
    // Filter by category
    if (selectedCategory) {
      results = results.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(results);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pb-8">
        <div className="container mx-auto px-4 pt-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Denov Baraka Somsa</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-5 w-5 mr-1" />
                  <span>Корзина</span>
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {items.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md" side="right">
                <CartSheet />
              </SheetContent>
            </Sheet>
          </div>
          
          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onChange={setSelectedCategory} 
          />
          
          <Separator className="my-6" />
          
          <ProductGrid products={filteredProducts} />
        </div>
      </main>
    </div>
  );
};

export default Index;
