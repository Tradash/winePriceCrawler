import puppeteer from 'puppeteer';
import * as process from 'process';
import threads from 'worker_threads';
import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';
import { findPrice, findValue, getFullQuantity } from '../utils';
import { IProductList } from '../types';

const shopData = {
  shopUrl: threads.workerData.shopUrl,
  descUrl: threads.workerData.descUrl,
  categoriesUrl: threads.workerData.categoriesUrl,
};

console.log(`Запущен воркер по парсингу цен ${shopData.categoriesUrl}`, new Date().getTime());

const width = 1920;
const height = 1080;
const startPage = 0;

const timerName = `start:${shopData.categoriesUrl}`;

console.time(timerName);

const wineModel = new ProductModel(db);

puppeteer
  .launch({
    headless: true,
    slowMo: 10,
    args: [`--window-size=${width},${height}`, '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--incognito'],
  })
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

          // Получение наименования
          const domName = await data.$('a.catalog-item_name');
          if (!domName) continue;
          const name = await domName.evaluate((el) => el.innerHTML);

          // Ссылка на детализацию товара
          const prodUrlNode = await data.$('a.catalog-item_name');
          if (!prodUrlNode) continue;
          const prodUrl = await prodUrlNode.evaluate((el) => el.getAttribute('href'));

          // ссылка на картинку
          const pictUrlNode = await data.$('div.catalog-item_defaut-image a.catalog-item_image');
          if (!pictUrlNode) continue;
          const pictUrl = await pictUrlNode.evaluate((el) => el.getAttribute('data-src') || '');

          // Получение цен
          const domPrice = await data.$$('div.catalog-item__hidden-content div.catalog-item_cost');
          const prodPrice: any = [];
          for (let j = 0; j < domPrice.length; j++) {
            const priceRaw = await domPrice[j].$('div.catalog-item_price-lvl_current');
            if (!priceRaw) continue;
            const price = findPrice(await priceRaw.evaluate((el) => el.innerHTML));
            const valueRaw = await domPrice[j].$('div.catalog-item_discount-lvl');
            if (!valueRaw) continue;
            const value = findValue(await valueRaw.evaluate((el) => el.innerHTML));
            prodPrice.push({ price, value });
          }
          const wine = {
            id,
            categoryName,
            name: name.trim().replace('amp;', ''),
            prodUrl: shopData.shopUrl + prodUrl,
            pictUrl: pictUrl,
            prices: prodPrice,
          };
          totalList.push(wine);
          await wineModel.addPrice(wine);

          // process.exit(1);
          // console.log(id, name, prodPrice);
        }
        console.timeLog(timerName, `Обработано страниц: ${pageCounter}`, `осталось обработать: ${remaining2process}`);
      }
      console.log('Всего обработано...', totalList.length, shopData.categoriesUrl);
      await browser.close()
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
