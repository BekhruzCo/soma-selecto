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
        image: '../../dist/images/classic_somsa.png',
        category: 'classic',
        popular: true
    },
    {
        id: '2',
        name: 'Klassik somsa (kichkina)',
        description: 'Mol go\'shti va aromatik ziravorlar bilan suvli somsa',
        price: 10000,
        image: '../../dist/images/mini_somsa.png',
        category: 'classic',
        popular: false
    },
    {
        id: '3',
        name: 'Koza Somsa (katta)',
        description: 'O\'zgacha uslubdagi Kosa somsa, ichida mol go\'shti, Ot go\'shti, bedana tuxumi va ziravorlar bor',
        price: 40000,
        image: '../../dist/images/big_kosa_somsa.png',
        category: 'meat',
        popular: true
        
    },
    {
        id: '4',
        name: 'Kosa Somsa (kichkina)',
        description: 'O\'zgacha uslubdagi kichik Kosa somsa, ichida mol go\'shti, bedana tuxumi va ziravorlar bor',
        price: 25000,
        image: '../../dist/images/kosa_somsa.png',
        category: 'meat',
        popular: false
    },
    {
        id: '5',
        name: 'Shashlik ',
        description: 'Tovuq go\'shtli va sabzavotli shashlik',
        price: 50000,
        image: '../../dist/images/Shashlik2.png',
        category: 'shashlik',
        popular: false
    },
    {
        id: '6',
        name: 'Go\'shtli shashlik',
        description: 'Mol go\'shtli va sabzavotli shashlik',
        price: 50000,
        image: '../../dist/images/Shashlik1.png',
        category: 'shashlik',
        popular: true
    },
    {
        id: '7',
        name: 'Qiyma shashlik',
        description: 'Mol go\'shtli va ziravorlar bilan tayyorlangan.',
        price: 40000,
        image: '../../dist/images/qiyma_shashlik.jpg',
        category: 'shashlik',
        popular: true
    },

];

export const categories: { id: ProductCategory; name: string }[] = [
    {id: 'classic', name: 'Classic'},
    {id: 'meat', name: 'Go\'shtli'},
    {id: 'shashlik', name: 'Shashlik'},
];
