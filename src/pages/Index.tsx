
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import CategoryFilter from "@/components/CategoryFilter";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import CartSheet from "@/components/CartSheet";
import { products, ProductCategory } from "@/data/products";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [filteredProducts, setFilteredProducts] = useState(products);
  
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
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onSearch={handleSearch} />
      
      <main className="flex-grow pb-8">
        <Hero />
        
        <div className="container mx-auto px-4 mt-16">
          <h2 className="text-3xl font-bold mb-6">Наше меню</h2>
          
          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onChange={setSelectedCategory} 
          />
          
          <Separator className="my-6" />
          
          <ProductGrid products={filteredProducts} />
        </div>
      </main>
      
      <Sheet>
        <SheetContent className="sm:max-w-md" side="right">
          <CartSheet />
        </SheetContent>
      </Sheet>
      
      <Footer />
    </div>
  );
};

export default Index;
