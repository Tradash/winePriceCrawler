export interface IProductList {
    id: string;
    name: string;
    prices: {
        price: number;
        value: number;
    }[];
}
