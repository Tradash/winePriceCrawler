import {startWorker} from './workers/initWorkers';
import {db} from './db/dbController';
import {maxRepeat, maxWorker, shopData} from './config';
import {delay} from './utils';

let countWorker = 0;

interface IShopData {
  categories: string;
  isActive: boolean;
  isReady: boolean;
  repeatCounter: number;
}

const data: IShopData[] = shopData.categories.map((x) => {
  return {
    categories: x,
    isActive: false,
    isReady: false,
    repeatCounter: 0,
  };
});

const findNext2work = (data: IShopData[]): number => {
  for (let i = 0; i < data.length; i++) {
    if (!data[i].isActive && !data[i].isReady && data[i].repeatCounter < maxRepeat) {
      return i;
    }
  }
  return -1;
};

const hasActive = (data: IShopData[]): boolean => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].isActive) {
      return true;
    }
  }
  return false;
};

if (process.argv.length === 2) {
  console.log('Запущено приложение по парсингу цен');
  db.clearDb(0).then(async () => {
    let i = 0;
    while (i != -1 || hasActive(data)) {
      if (countWorker < maxWorker) {
        i = findNext2work(data);
        if (i != -1) {
          countWorker++;
          data[i].isActive = true;
          data[i].repeatCounter++;
          startWorker({
            shopUrl: shopData.shopUrl,
            categoriesUrl: shopData.categories[i],
            descUrl: shopData.descUrl,
          })
            .then(() => {
              countWorker--;
              data[i].isActive = false;
              data[i].isReady = true;
            })
            .catch(() => {
              countWorker--;
              data[i].isActive = false;
              data[i].isReady = false;
            });
        }
      }
      await delay(5000);
    }
    db.closeConnection();
  });
} else {
  console.log('Запущено приложение по парсингу цен, получение дополнительной информации о продукте');
  startWorker(null);
}
