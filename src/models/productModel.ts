import { DbController } from '../db/dbController';
import { IProductList } from '../types';
import { OkPacket } from 'mysql';

export interface IProduct {
  id: number;
  vendor: string;
  code: string;
  name: string;
  country: string | null;
  productType: string | null;
  productCategory: string | null;
}

export interface ILastPrice {
  id: number;
  productId: number;
  priceDate: Date;
  priceX1: number;
  priceX2: number | null;
  priceX3: number | null;
}

export class ProductModel {
  db: DbController;
  constructor(db: DbController) {
    this.db = db;
  }

  async addPrice(data: IProductList) {
    //1. Проверяем есть ли такой id уже
    let recordId = 0;
    const wine = await this.findProductByCode(data.id);
    if (wine.length === 0) {
      // Добавляем запись в БД
      const newWine = await this.db.doQuery<OkPacket>('insert into product (vendor, code, name) values (?,?,?)', 'metro-cc', data.id, data.name);
      recordId = newWine.insertId;
    } else {
      recordId = wine[0].id;
      // TODO Добавить проверку и обновление свойств
    }
    if (data.prices.length !== 0) await this.addLastPrice(recordId, data);
  }

  async findProductByCode(code: string): Promise<IProduct[]> {
    return this.db.doQuery<IProduct[]>('select * from product where code=?', code);
  }
  async findLastPrice(code: string) {
    return this.db.doQuery<ILastPrice[]>('SELECT * FROM productprice WHERE productId=? ORDER BY priceDate DESC LIMIT 1', code);
  }
  async addLastPrice(id: number, data: IProductList) {
    return this.db.doQuery<OkPacket[]>(
      'insert into productprice (productId, priceX1, priceX3, priceX6) values (?,?,?,?)',
      id,
      this.xPrice(1, data),
      this.xPrice(3, data),
      this.xPrice(6, data)
    );
  }

  xPrice(x: number, data: IProductList): number | null {
    for (let i = 0; i < data.prices.length; i++) {
      if (x === data.prices[i].value) return data.prices[i].price;
    }
    return null;
  }
}
