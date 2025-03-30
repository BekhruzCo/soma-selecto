
import { useState, ChangeEvent } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ImagePlus } from "lucide-react";

// Product form schema
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Название должно содержать минимум 2 символа" }),
  description: z.string().min(5, { message: "Описание должно содержать минимум 5 символов" }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Цена должна быть больше 0",
  }),
  category: z.string({ required_error: "Выберите категорию" }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const AddProductForm = ({ onProductAdded }: { onProductAdded?: () => void }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
    },
  });

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Ошибка загрузки",
          description: "Размер файла не должен превышать 2MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Ошибка загрузки",
          description: "Файл должен быть изображением",
          variant: "destructive"
        });
        return;
      }
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Store the file for later upload
      setImageFile(file);
    }
  };

  // Form submission handler
  const onSubmit = (data: ProductFormValues) => {
    if (!imageFile && !imagePreview) {
      toast({
        title: "Требуется изображение",
        description: "Пожалуйста, загрузите изображение товара",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would upload the image and save the product data
    console.log("Product data:", {
      ...data,
      price: Number(data.price),
      image: imageFile ? imageFile.name : 'no-image.jpg',
    });
    
    toast({
      title: "Товар добавлен",
      description: `${data.name} успешно добавлен в каталог`
    });
    
    // Reset form and image
    form.reset();
    setImagePreview(null);
    setImageFile(null);
    
    // Notify parent component
    if (onProductAdded) {
      onProductAdded();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название товара</FormLabel>
                <FormControl>
                  <Input placeholder="Название" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цена (сум)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Цена" 
                    type="number" 
                    {...field}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Input placeholder="Описание товара" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="classic">Классическая</SelectItem>
                    <SelectItem value="meat">Мясная</SelectItem>
                    <SelectItem value="vegetable">Овощная</SelectItem>
                    <SelectItem value="special">Особая</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <FormLabel>Изображение</FormLabel>
            <div className="flex flex-col space-y-3">
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => document.getElementById('product-image')?.click()}
              >
                {imagePreview ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      className="max-h-32 rounded-md mb-2" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      Изменить
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Нажмите для загрузки изображения
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      JPG, PNG, GIF до 2MB
                    </p>
                  </div>
                )}
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        <Button type="submit" className="w-full">Добавить товар</Button>
      </form>
    </Form>
  );
};

export default AddProductForm;
