import {startWorker} from './workers/initWorkers';
import {db} from './db/dbController';
import {shopData} from "./config";

if (process.argv.length === 2) {
  console.log('Запущено приложение по парсингу цен');
  db.clearDb(0).then(() => {
    for (let i = 0; i < shopData.categories.length; i++) {
      startWorker({
        shopUrl: shopData.shopUrl,
        categoriesUrl: shopData.categories[i],
        descUrl: shopData.descUrl,
      });
    }
    db.closeConnection();
  });
} else {
  console.log('Запущено приложение по парсингу цен, получение дополнительной информации о продукте');
  startWorker(null);
}
