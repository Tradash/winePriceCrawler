export interface IProductList {
    id: string;
    categoryName: string;
    name: string;
    pictUrl: string;
    prodUrl: string;
    prices: {
        price: number;
        value: number;
    }[];
}
