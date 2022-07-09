import * as process from 'process';
import threads from 'worker_threads';
import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';
import { delay, findValue, getFullQuantity } from '../utils/utils';
import {  maxRepeat } from '../config';
import { IUData } from '../types';
import { findCorrectVersionSite } from '../utils/findCorrectVersionSite';
import { chooseShop } from '../utils/chooseShop';
import { handler, THandler } from '../utils/handler';

const shopData = {
  shopUrl: threads.workerData.shopUrl,
  descUrl: threads.workerData.descUrl,
  categoriesUrl: threads.workerData.categoriesUrl,
};

console.log(`Запущен воркер по парсингу цен ${shopData.categoriesUrl}`, new Date().getTime());

const startPage = 0;

const timerName = `start:${shopData.categoriesUrl}`;

console.time(timerName);

const productModel = new ProductModel(db);

const getData: THandler = async (browser, data, extData=""): Promise<boolean> => {
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

  // Определение артикула
  const artElem = await page.$('span.product__article');
  const artData = (await artElem?.evaluate((el) => el.innerHTML)) || '';
  const art = /^\s*Aртикул:\s*(?<art>\d+)\s*$/.exec(artData);
  let id = '';
  if (art && art.groups) {
    id = art.groups.art;
  }
  // Определение названия
  const nameElem = await page.$('h1.product__title');
  const prodName = ((await nameElem?.evaluate((el) => el.innerHTML)) || '').trim();

  // Получение картинки

  const pictUrlNode = await page.$('div.slide-img img');
  if (!pictUrlNode) {
    await page.close();
    return false;
  }
  const pictUrl = await pictUrlNode.evaluate((el) => el.getAttribute('data-src') || '');

  // Получение цены
  // TODO Настроить обработку товаров с категорией расскупили
  const prodPrice: any = [];
  const domPrice = await page.$$('section.product-prices__levels-info div.price-level');
  for (let j = 0; j < domPrice.length; j++) {
    const priceRaw = await domPrice[j].$('span.level-price span');
    if (!priceRaw) continue;
    const pr = (await priceRaw.evaluate((el) => el.innerHTML)) || '';
    const price = Number(pr.trim().replace('&nbsp;', ''));
    const countRaw = await domPrice[j].$('span.level-min-count');
    if (!countRaw) continue;
    const value = findValue((await countRaw.evaluate((el) => el.innerHTML)) || '');
    prodPrice.push({ price, value });
    if (prodPrice.length > 0) {
      const wine = {
        id,
        categoryName: extData.trim(),
        name: prodName.trim().replace('amp;', ''),
        prodUrl: data.url,
        pictUrl: pictUrl,
        prices: prodPrice,
      };
      await productModel.addPrice(wine);
    }
  }
  await page.close();
  return true;
};

findCorrectVersionSite()
  .then(
    async (browser) => {
      const context = browser.defaultBrowserContext();
      let page = await browser.newPage();
      await context.overridePermissions(shopData.shopUrl + shopData.categoriesUrl + shopData.descUrl, ['notifications']);
      console.log('Переход на страницу', shopData.categoriesUrl);
      await page.goto(shopData.shopUrl + shopData.categoriesUrl + shopData.descUrl, { waitUntil: 'networkidle2' });

      // Выбираем магазин
      await chooseShop(page, shopData.categoriesUrl);

      // Нужно ли проверить возраст
      try {
        await page.waitForSelector('button.product-item-button__btn-cart.age-confirm', {
          timeout: 2000,
        });
        await page.click('button.product-item-button__btn-cart.age-confirm');
        console.log('Возраст подтвержден.');
      } catch (e) {
        console.log('Без подтверждения возроста.');
      }

      // Определяем количество позиций товара в каталоге
      const size = getFullQuantity((await (await page.$('div.heading-products-count.subcategory-or-type__heading-count'))?.evaluate((el) => el.innerHTML)) || '0');
      const categoryName = (
        (await (await page.$('h1.subcategory-or-type__heading-title.catalog-heading.heading__h1 span'))?.evaluate((el) => el.innerHTML)) || shopData.categoriesUrl
      ).trim();
      let remaining2process = size;
      let pageCounter = startPage;
      console.log('Выбираем элементы, Всего:', size, shopData.categoriesUrl);
      console.timeLog(timerName, 'Начата обработка страниц', shopData.categoriesUrl);
      const prodUrls: string[] = [];
      while (remaining2process > 0) {
        pageCounter++;
        if (pageCounter !== 1) {
          await page.goto(`${shopData.shopUrl + shopData.categoriesUrl + shopData.descUrl}&page=${pageCounter}`, { waitUntil: 'networkidle2' });
        }
        console.timeLog(timerName, `Загружена страница: ${pageCounter}`, shopData.categoriesUrl);
        const elem = await page.$$('div.base-product-item.catalog-2-level-product.subcategory-or-type__products-item');
        remaining2process -= elem.length;

        for (let i = 0; i < elem.length; i++) {
          const data = elem[i];

          // Определяем ссылку на детальное описание

          const aData = await data.$('a.base-product-photo__link.reset-link');
          const href = await aData?.getProperty('href');
          if (href?._remoteObject.value) {
            prodUrls.push(href._remoteObject.value);
          }
        }
        console.timeLog(timerName, `Обработано страниц: ${pageCounter}`, `осталось обработать: ${remaining2process}`);
        await delay(Math.floor(Math.random() * 10000) + 1);
      }



      const uData: IUData[] = prodUrls.map((x) => {
        return {
          url: x,
          isReady: false,
          inWork: false,
          repeatCounter: 0,
        };
      });

      const succ = await handler(browser, uData, getData, categoryName);

      console.log(`Всего обработано... ${uData.length} Успешно: ${succ}. Режим ожидания завершения активных операций 10 сек`, shopData.categoriesUrl);
      await delay(10000);
      console.log(`Всего обработано... ${uData.length} Успешно: ${succ}`, shopData.categoriesUrl);
      await browser.close();
    }

  )
  .catch((e) => {
    console.log('Ошибка', e, shopData.categoriesUrl);
  })
  .finally(() => {
    console.timeEnd(timerName);
    console.log('Завершена обработка', shopData.categoriesUrl);
    process.exit(0);
  });
