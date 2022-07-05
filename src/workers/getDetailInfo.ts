import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';
import { delay, findCorrectVersionSite, get2work, toHHMMSS } from '../utils';
import { maxPage, maxRepeat } from '../config';
import { Browser } from 'puppeteer';
import { IUSubData } from '../types';

const timerName = `start:GetExtInfo`;

console.time(timerName);

const wineModel = new ProductModel(db);

const getData = async (browser: Browser, url: string, id: number): Promise<boolean> => {
  const page = await browser.newPage();
  let repeatCounter = 0;
  while (repeatCounter < maxRepeat) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      repeatCounter = maxRepeat + 10;
    } catch (e) {
      console.log(`Ошибка при загрузки страницы, повтор (${repeatCounter}/${maxRepeat})`, url);
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
    await wineModel.updateProductAdditional({
      id: id,
      country: data2save.country,
      brand: data2save.brand,
      bodyJson: JSON.stringify(data2save.detail),
    });
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
      const startTimeLocal = new Date().getTime();
      let isWork = true;
      let active = 0;
      let succ = 0;
      while (isWork) {
        const i = get2work(data);

        if (i == -1) {
          isWork = false;
        } else {
          if (active < maxPage) {
            data[i].inWork = true;
            data[i].repeatCounter++;
            active++;
            const startTime = new Date().getTime();
            getData(browser, data[i].url, data[i].id)
              .then((x) => {
                active--;
                if (x) {
                  succ++;
                  data[i].isReady = true;
                  console.log(
                    `Страница ${data[i].url} обработана за ${toHHMMSS(new Date().getTime() - startTime)}, ${succ}/${data.length}, Осталось времени: ${toHHMMSS(
                      ((new Date().getTime() - startTimeLocal) / succ) * (data.length - succ)
                    )}`
                  );
                }
                data[i].inWork = false;
              })
              .catch((e) => {
                active--;
                data[i].inWork = false;
                console.warn(`Ошибка при обработке ${data[i].url}, Попытка ${data[i].repeatCounter}/${maxRepeat}`, e.message);
              });
          }
        }
        await delay(1000);
      }
    })
    .finally(async () => {
      await delay(5000);
      console.log(`Обработка завершена за обработана за ${toHHMMSS(new Date().getTime() - startTimeGlobal)}`);
      await browser.close();
    });
});
