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
    let recordId;
    const wine = await this.findProductByCode(data.id);
    if (wine.length === 0) {
      // Добавляем запись в БД
      const newWine = await this.db.doQuery<OkPacket>(
        'insert into product (vendor, code, name, urlDescription, urlPicture, catalogName) values (?,?,?,?,?,?)',
        'metro-cc',
        data.id,
        data.name,
        data.prodUrl,
        data.pictUrl,
        data.categoryName
      );
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
  // async findLastPrice(code: string) {
  //   return this.db.doQuery<ILastPrice[]>('SELECT * FROM productprice WHERE productId=? ORDER BY priceDate DESC LIMIT 1', code);
  // }
  async addLastPrice(id: number, data: IProductList) {
    const newTag = await this.db.doQuery<OkPacket>('insert into pricetag (productId) values (?)', id);
    for (let i = 0; i < data.prices.length; i++) {
      await this.db.doQuery('insert into pricedetail (priceTagId, measure, price) values (?,?,?)', newTag.insertId, data.prices[i].value, data.prices[i].price);
    }
  }

  async findProducts4GetAdditionalSpec(limit = 100) {
    return await this.db.doQuery<{ id: number; urlDescription: string }[]>(`select id, urlDescription from product where brand is NULL UNION select id, urlDescription from product WHERE specification LIKE '{}' ORDER BY id DESC limit ?`, limit);
  }

  async updateProductAdditional(data: { id: number; country: string; brand: string; bodyJson: string }) {
    return await this.db.doQuery('update product set country=?, brand=?, specification=? where id=?', data.country, data.brand, data.bodyJson, data.id);
  }
}
