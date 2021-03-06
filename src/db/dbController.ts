import * as mysql from 'mysql';

const mysqlConfig: mysql.ConnectionConfig = {
  host: 'localhost',
  port: 3306,
  user: 'yahat',
  password: 'yahat',
  database: 'wineprice',
  connectTimeout: 300000000,
  multipleStatements: true,
};

export class DbController {
  poll: mysql.Pool;
  constructor(pool: mysql.Pool) {
    this.poll = pool;
  }

  async doQuery<T>(s: string, ...params: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      this.poll.query(s, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  async clearDb(skip=0) {
      if (skip) {
          console.log("Очистка БД")
          await this.doQuery("delete from pricedetail")
          await this.doQuery("delete from pricetag")
          await this.doQuery("delete from product")
          console.log("Очистка БД завершена")
      }
      return
  }
  closeConnection() {
      this.poll.end()
  }
}

const pool = mysql.createPool(mysqlConfig as mysql.PoolConfig);

pool.on('connection', () => {
  console.log('Установлено соединение с БД');
});
pool.on('error', (e) => {
  console.log('MySql Error', e);
});
pool.on('close', (e) => {
  console.log('пул закрыт MySql Error', e);
});

export const db = new DbController(pool);
