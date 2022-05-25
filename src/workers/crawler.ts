import * as process from 'process';
import threads from 'worker_threads';
import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';
import {delay, findCorrectVersionSite, findPrice, findValue, getFullQuantity} from '../utils';
import { IProductList } from '../types';

const shopData = {
  shopUrl: threads.workerData.shopUrl,
  descUrl: threads.workerData.descUrl,
  categoriesUrl: threads.workerData.categoriesUrl,
};

console.log(`Запущен воркер по парсингу цен ${shopData.categoriesUrl}`, new Date().getTime());

const startPage = 0;

const timerName = `start:${shopData.categoriesUrl}`;

console.time(timerName);

const wineModel = new ProductModel(db);

findCorrectVersionSite()
  .then(
    async (browser) => {
      const context = browser.defaultBrowserContext();
      let page = await browser.newPage();
      await context.overridePermissions(shopData.shopUrl + shopData.categoriesUrl + shopData.descUrl, ['notifications']);
      console.log('Переход на страницу', shopData.categoriesUrl);
      await page.goto(shopData.shopUrl + shopData.categoriesUrl + shopData.descUrl, { waitUntil: 'networkidle2' });
      // TODO возможно нужно сделать выбор города и может и магазина
      console.log('Подтверждаю город', shopData.categoriesUrl);
      await page.waitForSelector('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active', {
        timeout: 5000,
      });
      await page.click('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active');
      try {
        console.log('Подтверждаю возраст', shopData.categoriesUrl);
        await page.waitForSelector('div.warning__block a.warning__button', {
          timeout: 5000,
        });
        console.log('Подтверждаю возраст, жму кнопку', shopData.categoriesUrl);
        await page.click('div.warning__block a.warning__button');
      } catch (e) {
        console.log('Ошибка при подтверждении возраста', shopData.categoriesUrl);
      }

      // Выбираем магазин
      try {
        console.log('Выбираю магазин', shopData.categoriesUrl);
        await page.waitForSelector('svg.delivery-info__pin-icon', {
          timeout: 2000,
        });
        console.log('Нажимаю иконку выбора магазина:', shopData.categoriesUrl);
        await page.click('svg.delivery-info__pin-icon');
        console.log('Ищем самовывоз', shopData.categoriesUrl);
        await page.waitForSelector('input[value=pickup].obtainments-list__control', {
          timeout: 2000,
        });
        console.log('Жмем самовывоз:', shopData.categoriesUrl);
        await page.click('input[value=pickup].obtainments-list__control');

        console.log('Ищем сохранить', shopData.categoriesUrl);
        await page.waitForSelector('button.rectangle-button.reset--button-styles.blue.lg.normal.wide', {
          timeout: 2000,
        });
        console.log('Жмем сохранить:', shopData.categoriesUrl);
        await page.click('button.rectangle-button.reset--button-styles.blue.lg.normal.wide');
      } catch (e) {
        console.log('Ошибка при выборе магазина', shopData.categoriesUrl);
      }

      // Определяем количество вин
      const size = getFullQuantity((await (await page.$('span.search-page__total'))?.evaluate((el) => el.innerHTML)) || '0');
      const categoryName = (await (await page.$('h1.catalog-title'))?.evaluate((el) => el.innerHTML)) || shopData.categoriesUrl;
      let remaining2process = size;
      let pageCounter = startPage;
      console.log('Выбираем элементы, Всего:', size, shopData.categoriesUrl);
      const totalList: IProductList[] = [];
      console.timeLog(timerName, 'Начата обработка страниц', shopData.categoriesUrl);
      while (remaining2process > 0) {
        pageCounter++;
        // console.log('Обработка страницы....', pageCounter, 'Осталось обработать...', remaining2process);
        if (pageCounter !== 1) {
          await page.goto(`${shopData.shopUrl + shopData.categoriesUrl + shopData.descUrl}&page=${pageCounter}`, { waitUntil: 'networkidle2' });
        }
        console.timeLog(timerName, `Загружена страница: ${pageCounter}`, shopData.categoriesUrl);
        const elem = await page.$$('div.catalog-list__wrapper div.catalog-item');
        remaining2process -= elem.length;
        for (let i = 0; i < elem.length; i++) {
          const data = elem[i];
          // Получение ID
          const id = await data.evaluate((el) => el.getAttribute('data-productid'));
          if (!id) continue;

          // let flag = false;
          // if (id === '638859') flag = true;

          // Получение наименования
          const domName = await data.$('a.catalog-item_name');
          if (!domName) continue;
          const name = await domName.evaluate((el) => el.innerHTML);
          // if (flag) console.warn(1, name);

          // Ссылка на детализацию товара
          const prodUrlNode = await data.$('a.catalog-item_name');
          if (!prodUrlNode) continue;
          const prodUrl = await prodUrlNode.evaluate((el) => el.getAttribute('href'));
          // if (flag) console.warn(2, prodUrl);
          // ссылка на картинку
          const pictUrlNode = await data.$('div.catalog-item_defaut-image a.catalog-item_image');
          if (!pictUrlNode) continue;
          const pictUrl = await pictUrlNode.evaluate((el) => el.getAttribute('data-src') || '');
          // if (flag) console.warn(3, pictUrl);
          // Получение цен
          const domPrice = await data.$$('div.catalog-item__hidden-content div.catalog-item_cost');
          const prodPrice: any = [];
          for (let j = 0; j < domPrice.length; j++) {
            const priceRaw = await domPrice[j].$('div.catalog-item_price-lvl_current');
            if (!priceRaw) continue;
            const body = await priceRaw.evaluate((el) => el.innerHTML);
            // if (flag) console.warn(4, j, body);
            const price = findPrice(body);
            const valueRaw = await domPrice[j].$('div.catalog-item_discount-lvl');
            if (!valueRaw) continue;
            const body01 = await valueRaw.evaluate((el) => el.innerHTML);
            // if (flag) console.warn(5, j, body01);
            const value = findValue(body01);
            prodPrice.push({ price, value });
          }
          // if (flag) process.exit(1);
          const wine = {
            id,
            categoryName: categoryName.trim(),
            name: name.trim().replace('amp;', ''),
            prodUrl: shopData.shopUrl + prodUrl,
            pictUrl: pictUrl,
            prices: prodPrice,
          };
          totalList.push(wine);
          await wineModel.addPrice(wine);
        }
        console.timeLog(timerName, `Обработано страниц: ${pageCounter}`, `осталось обработать: ${remaining2process}`);
        await delay(Math.floor(Math.random() * 10000) + 1);
      }
      console.log('Всего обработано...', totalList.length, shopData.categoriesUrl);
      await browser.close();
    }

    // console.log(elem)
  )
  .catch((e) => {
    console.log('Ошибка', e, shopData.categoriesUrl);
  })
  .finally(() => {
    console.timeEnd(timerName);
    console.log('Завершена обработка', shopData.categoriesUrl);
    process.exit(0);
  });
