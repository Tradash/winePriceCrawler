import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';
import { delay } from '../utils/utils';
import { maxRepeat } from '../config';
import { IUSubData } from '../types';
import { findCorrectVersionSite } from '../utils/findCorrectVersionSite';
import { toHHMMSS } from '../utils/toHHMMSS';
import { handler, THandler } from '../utils/handler';
import process from 'process';

const timerName = `start:GetExtInfo`;

console.time(timerName);

const wineModel = new ProductModel(db);

const getData: THandler = async (browser, data): Promise<boolean> => {
  const page = await browser.newPage();
  let repeatCounter = 0;
  while (repeatCounter < maxRepeat) {
    try {
      await page.goto(data.url, { waitUntil: 'networkidle2' });
      repeatCounter = maxRepeat + 10;
    } catch (e) {
      console.log(`Ошибка при загрузки страницы, повтор (${repeatCounter}/${maxRepeat})`, data.url);
      repeatCounter++;
    }
  }

  if (repeatCounter < 10) {
    await page.close();
    return false;
  }
  try {
    const age = await page.$(`'button.rectangle-button.reset--button-styles.confirm-age__apply-btn.blue.lg.normal`);
    if (age) {
      await page.waitForSelector('button.rectangle-button.reset--button-styles.confirm-age__apply-btn.blue.lg.normal', {
        timeout: 2000,
      });
      await page.click('button.rectangle-button.reset--button-styles.confirm-age__apply-btn.blue.lg.normal');
      console.log('Подтверждение возроста выполнено.');
    }
  } catch (e) {}

  // Поиск бренда
  const elems = await page.$$('div.product__additional section.product__specification.additional-block li.attrs-list__item');
  const data2save: any = { detail: null };
  for (let i = 0; i < elems.length; i++) {
    const nameParam = await (await elems[i].$('li.attrs-list__item div.left-col span.label'))?.evaluate((el) => el.innerHTML);
    const dataParam = await (await elems[i].$('span.text'))?.evaluate((el) => el.innerHTML);
    if (nameParam && dataParam) {
      if (nameParam === 'Бренд') {
        data2save.brand = dataParam;
      }
      if (nameParam === 'Страна-производитель') {
        data2save.country = dataParam;
      }
      if (nameParam === 'Регион' && dataParam === 'Крым') {
        data2save.country = dataParam;
      }

      if (!data2save.detail) {
        data2save.detail = {
          [nameParam]: dataParam,
        };
      }

      data2save.detail[nameParam] = dataParam;
    }
  }

  if (data2save.brand && data2save.country) {
    if ('id' in data) {
      await wineModel.updateProductAdditional({
        id: data.id,
        country: data2save.country,
        brand: data2save.brand,
        bodyJson: JSON.stringify(data2save.detail),
      });
    }
  }
  await page.close();
  return true;
};

const startTimeGlobal = new Date().getTime();

findCorrectVersionSite().then(async (browser) => {
  wineModel
    .findProducts4GetAdditionalSpec(1000)
    .then(async (data2work) => {
      const data: IUSubData[] = data2work.map((x) => {
        return {
          id: x.id,
          url: x.urlDescription,
          inWork: false,
          isReady: false,
          repeatCounter: 0,
        };
      });

      const succ = await handler(browser, data, getData, '');

      console.log(`Всего обработано... ${data.length} Успешно: ${succ}. Режим ожидания завершения активных операций 10 сек`);
      await delay(10000);
      console.log(`Всего обработано... ${data.length} Успешно: ${succ}`);
      await browser.close();
    })
    .catch((e) => {
      console.log('Ошибка', e);
    })
    .finally(async () => {
      await delay(5000);
      console.log(`Обработка завершена за за ${toHHMMSS(new Date().getTime() - startTimeGlobal)}`);
      process.exit(0);
    });
});
