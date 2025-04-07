import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct } from "@/utils/api";
import { Product } from "@/data/products";
import { sendProductUpdateToTelegram } from "@/utils/telegram";

interface AddProductFormProps {
  onProductAdded: (product: Product) => void;
}

const AddProductForm = ({ onProductAdded }: AddProductFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create product object from form data
      const productData = {
        name: formData.name,
        price: parseInt(formData.price),
        category: formData.category,
        image: formData.image,
      };

      const newProduct = await createProduct(productData);

      // Notify Telegram
      await sendProductUpdateToTelegram('add', {
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
      });

      onProductAdded(newProduct);
      
      // Clear form
      setFormData({
        name: "",
        price: "",
        category: "",
        image: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nomi</Label>
          <Input
            id="name"
            placeholder="Mahsulot nomi"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Narxi</Label>
          <Input
            id="price"
            type="number"
            placeholder="Mahsulot narxi"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Kategoriya</Label>
          <Select 
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategoriyani tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Klassik</SelectItem>
              <SelectItem value="meat">Go'shtli</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">Rasm URL</Label>
          <Input
            id="image"
            type="url"
            placeholder="Mahsulot rasmi URL"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Qo'shilmoqda..." : "Mahsulot qo'shish"}
      </Button>
    </form>
  );
};

export default AddProductForm;
