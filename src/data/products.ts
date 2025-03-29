
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  popular: boolean;
}

export type ProductCategory = 'classic' | 'meat' | 'chicken' | 'vegetable' | 'special';

export const products: Product[] = [
  {
    id: '1',
    name: 'Классик Сомса',
    description: 'Традиционная сомса с говядиной, луком и специями',
    price: 10000,
    image: '/classic-somsa.jpg',
    category: 'classic',
    popular: true
  },
  {
    id: '2',
    name: 'Сомса с бараниной',
    description: 'Сочная сомса с нежной бараниной и ароматными специями',
    price: 12000,
    image: '/lamb-somsa.jpg',
    category: 'meat',
    popular: true
  },
  {
    id: '3',
    name: 'Куриная Сомса',
    description: 'Легкая сомса с куриным филе, зеленью и специями',
    price: 9000,
    image: '/chicken-somsa.jpg',
    category: 'chicken',
    popular: false
  },
  {
    id: '4',
    name: 'Овощная Сомса',
    description: 'Вегетарианская сомса с тыквой, картофелем и морковью',
    price: 8000,
    image: '/vegetable-somsa.jpg',
    category: 'vegetable',
    popular: false
  },
  {
    id: '5',
    name: 'Особая Сомса Денов',
    description: 'Фирменная сомса с мясом, сыром и особым соусом шеф-повара',
    price: 15000,
    image: '/special-somsa.jpg',
    category: 'special',
    popular: true
  },
  {
    id: '6',
    name: 'Сомса с тыквой',
    description: 'Традиционная сомса с сочной тыквой и специями',
    price: 8500,
    image: '/pumpkin-somsa.jpg',
    category: 'vegetable',
    popular: false
  },
  {
    id: '7',
    name: 'Сомса с картошкой',
    description: 'Классическая сомса с картофельной начинкой',
    price: 8000,
    image: '/potato-somsa.jpg',
    category: 'vegetable',
    popular: true
  },
  {
    id: '8',
    name: 'Мини-Сомса (набор)',
    description: 'Набор из 5 мини-сомса разных вкусов',
    price: 20000,
    image: '/mini-somsa.jpg',
    category: 'special',
    popular: true
  }
];

export const categories: {id: ProductCategory; name: string}[] = [
  { id: 'classic', name: 'Классические' },
  { id: 'meat', name: 'Мясные' },
  { id: 'chicken', name: 'Куриные' },
  { id: 'vegetable', name: 'Овощные' },
  { id: 'special', name: 'Фирменные' }
];
