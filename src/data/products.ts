export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: ProductCategory;
    popular: boolean;
}

export type ProductCategory = 'classic' | 'meat' | 'shashlik';

export const products: Product[] = [
    {
        id: '1',
        name: 'Klassik somsa (katta)',
        description: 'Mol go\'shti, piyoz va ziravorlar bilan an\'anaviy somsa',
        price: 20000,
        image: '../../dist/images/classic_somsa.jpg',
        category: 'classic',
        popular: true
    },
    {
        id: '2',
        name: 'Klassik somsa (kichkina)',
        description: 'Mol go\'shti va aromatik ziravorlar bilan suvli somsa',
        price: 10000,
        image: '../../dist/images/mini_somsa.jpg',
        category: 'classic',
        popular: false
    },
    {
        id: '3',
        name: 'Koza Somsa (katta)',
        description: 'O\'zgacha uslubdagi Kosa somsa, ichida mol go\'shti, Ot go\'shti, bedana tuxumi va ziravorlar bor',
        price: 40000,
        image: '../../dist/images/big_kosa_somsa.jpg',
        category: 'meat',
        popular: true
        
    },
    {
        id: '4',
        name: 'Kosa Somsa (kichkina)',
        description: 'O\'zgacha uslubdagi kichik Kosa somsa, ichida mol go\'shti, bedana tuxumi va ziravorlar bor',
        price: 25000,
        image: '../../dist/images/kosa_somsa.jpg',
        category: 'meat',
        popular: false
    },

];

export const categories: { id: ProductCategory; name: string }[] = [
    {id: 'classic', name: 'Classic'},
    {id: 'meat', name: 'Go\'shtli'},
    {id: 'shashlik', name: 'Shashlik'},
];
