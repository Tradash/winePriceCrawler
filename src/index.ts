import { startWorker } from './workers/initWorkers';
import { db } from './db/dbController';
import {maxRepeat, maxWorker, shopData, TShopDetail} from './config';
import { delay } from './utils/utils';

let countWorker = 0;

interface IShopData {
  categories: TShopDetail;
  inWork: boolean;
  isReady: boolean;
  repeatCounter: number;
}

const data: IShopData[] = shopData.categories.filter(x=>x.active).map((x) => {
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

export const hasActive = (data: IShopData[]): boolean => {
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
          const ind = i;
          countWorker++;
          data[ind].inWork = true;
          data[ind].repeatCounter++;
          startWorker({
            shopUrl: shopData.shopUrl,
            categories: data[ind].categories,
            descUrl: shopData.descUrl,
          })
            .then(() => {
              countWorker--;
              data[ind].inWork = false;
              data[ind].isReady = true;
            })
            .catch((e) => {
              console.log('Ошибка: ', e);
              countWorker--;
              data[ind].inWork = false;
              data[ind].isReady = false;
            });
        }
      }
      await delay(5000);
    }
    db.closeConnection();
  });
} else {
  console.log('Запущено приложение по парсингу цен, получение дополнительной информации о продукте');
  startWorker(null).finally(() => {
    db.closeConnection();
  });
}
