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

export interface IUData {
    url: string;
    isReady: boolean;
    inWork: boolean;
    repeatCounter: number;
}

export interface IUSubData extends IUData {
    id: number
}
