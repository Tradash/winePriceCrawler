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

export interface IExtHandlerData {
  isReady: boolean;
  inWork: boolean;
  repeatCounter: number;
}

export interface IUData extends IExtHandlerData {
  url: string;
}

export interface IUSubData extends IUData {
  id: number;
}
