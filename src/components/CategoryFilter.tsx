
import { Button } from "@/components/ui/button";
import { categories, ProductCategory } from "@/data/products";

interface CategoryFilterProps {
  selectedCategory: ProductCategory | null;
  onChange: (category: ProductCategory | null) => void;
}

const CategoryFilter = ({ selectedCategory, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
      <Button
        onClick={() => onChange(null)}
        variant={selectedCategory === null ? "default" : "outline"}
        className="rounded-full whitespace-nowrap"
      >
        Все
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => onChange(category.id)}
          variant={selectedCategory === category.id ? "default" : "outline"}
          className="rounded-full whitespace-nowrap"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
