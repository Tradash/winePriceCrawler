import {startWorker} from './workers/initWorkers';
import {db} from './db/dbController';
import {maxRepeat, maxWorker, shopData} from './config';
import {delay} from './utils/utils';

let countWorker = 0;

interface IShopData {
  categories: string;
  inWork: boolean;
  isReady: boolean;
  repeatCounter: number;
}

const data: IShopData[] = shopData.categories.map((x) => {
  return {
    categories: x,
    inWork: false,
    isReady: false,
    repeatCounter: 0,
  };
});

export const findNext2work = (data: IShopData[]): number => {
  for (let i = 0; i < data.length; i++) {
    if (!data[i].inWork && !data[i].isReady && data[i].repeatCounter < maxRepeat) {
      return i;
    }
  }
  return -1;
};

export const hasActive = (data: IShopData[] ): boolean => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].inWork) {
      return true;
    }
  }
  return false;
};

if (process.argv.length === 2) {
  console.log('Запущено приложение по парсингу цен');
  db.clearDb(0).then(async () => {
    let i = 0;
    while (i !== -1 || hasActive(data)) {
      if (countWorker < maxWorker) {
        i = findNext2work(data);
        if (i !== -1) {
          countWorker++;
          data[i].inWork = true;
          data[i].repeatCounter++;
          startWorker({
            shopUrl: shopData.shopUrl,
            categoriesUrl: shopData.categories[i],
            descUrl: shopData.descUrl,
          })
            .then(() => {
              countWorker--;
              data[i].inWork = false;
              data[i].isReady = true;
            })
            .catch((e) => {
              console.log("Ошибка: ", e)
              countWorker--;
              data[i].inWork = false;
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
