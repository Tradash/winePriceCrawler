import { startWorker } from './workers/initWorkers';
import {db} from "./db/dbController";

const shopData = {
  shopUrl: 'https://msk.metro-cc.ru',
  descUrl: '?order=price_desc',
  categories: ['/category/myasnye/myaso/govyadina', '/category/alkogolnaya-produkciya/vino', '/category/alkogolnaya-produkciya/shampanskoe-igristye-vina'],
};

console.log('Запущено приложение по парсингу цен');

db.clearDb(1).then(()=>{
    for (let i = 0; i < shopData.categories.length; i++) {
        startWorker({
            shopUrl: shopData.shopUrl,
            categoriesUrl: shopData.categories[i],
            descUrl: shopData.descUrl,
        });
    }
    db.closeConnection()
})


