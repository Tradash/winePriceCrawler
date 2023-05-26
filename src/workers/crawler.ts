import * as process from 'process';
import threads from 'worker_threads';
import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';
import { delay, getFullQuantity } from '../utils/utils';
import { maxRepeat, TShopDetail } from '../config';
import { IUData } from '../types';
import { findCorrectVersionSite } from '../utils/findCorrectVersionSite';
import { chooseShop } from '../utils/chooseShop';
import { handler, THandler } from '../utils/handler';

const shopData: {
  shopUrl: string;
  descUrl: string;
  categories: TShopDetail;
} = {
  shopUrl: threads.workerData.shopUrl,
  descUrl: threads.workerData.descUrl,
  categories: threads.workerData.categories,
};

console.log(`Запущен воркер по парсингу цен ${shopData.categories.url}`, new Date().getTime());

const startPage = 0;

const timerName = `start:${shopData.categories.url}`;

console.time(timerName);

const productModel = new ProductModel(db);

const getData: THandler = async (browser, data, extData = ''): Promise<boolean> => {
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
  const artElem = await page.$('p.product-page-content__article');
  const artData = (await artElem?.evaluate((el) => el.innerHTML)) || '';
  const art = /^\s*\W+:\s*(?<art>\d+)\s*$/.exec(artData);
  let id = '';
  if (art && art.groups) {
    id = art.groups.art;
  }
  // Определение названия
  const nameElem = await page.$('h1.product-page-content__product-name.catalog-heading.heading__h2 span');
  let prodName = ((await nameElem?.evaluate((el) => el.innerHTML)) || '').trim();
  const f = prodName.indexOf('<meta');
  if (f > 0) {
    prodName = prodName.slice(0, f - 1);
  }

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
  const domPrice = await page.$$('li.product-range-prices__item');
  for (let j = 0; j < domPrice.length; j++) {
    const priceRaw = await domPrice[j].$('span.product-price__sum-rubles');
    if (!priceRaw) continue;
    const pr = (await priceRaw.evaluate((el) => el.innerHTML)) || '';

    const itRaw = await domPrice[j].$('span.product-range-prices__item-count.nowrap');
    if (!itRaw) continue;
    const value = ((await itRaw.evaluate((el) => el.innerHTML)) || '').trim();

    const price = Number(pr.trim().replace('&nbsp;', ''));
    // const countRaw = await domPrice[j].$('span.level-min-count');
    // if (!countRaw) continue;
    // const value = findValue((await countRaw.evaluate((el) => el.innerHTML)) || '');
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
  .then(async (browser) => {
    const context = browser.defaultBrowserContext();
    let page = await browser.newPage();
    await context.overridePermissions(shopData.shopUrl + shopData.categories.url + shopData.descUrl, ['notifications']);
    console.log('Переход на страницу', shopData.categories.url);
    await page.goto(shopData.shopUrl + shopData.categories.url + shopData.descUrl, { waitUntil: 'networkidle2' });

    // Выбираем магазин
    await chooseShop(page, shopData.categories.url);

    // Нужно ли проверить возраст
    try {
      await page.waitForSelector(
        'button.simple-button.reset-button.catalog-2-level-product-card__button.catalog-2-level-product-card__button--confirm-age.style--catalog-2-level-product-card.catalog--offline.offline-prices-sorting--best-level.not-in-cart',
        {
          timeout: 4000,
        }
      );
      await page.click(
        'button.simple-button.reset-button.catalog-2-level-product-card__button.catalog-2-level-product-card__button--confirm-age.style--catalog-2-level-product-card.catalog--offline.offline-prices-sorting--best-level.not-in-cart'
      );
      console.log('Возраст подтвержден.');
    } catch (e) {
      console.log('Без подтверждения возроста.');
    }

    // Определяем количество позиций товара в каталоге
    let size;

    size = getFullQuantity((await (await page.$('div.heading-products-count.subcategory-or-type__heading-count'))?.evaluate((el) => el.innerHTML)) || '0');
    if (size === 0) {
      size = getFullQuantity((await (await page.$('span.heading-products-count.subcategory-or-type__heading-count'))?.evaluate((el) => el.innerHTML)) || '0');
    }

    const categoryName = (
      (await (await page.$('h1.subcategory-or-type__heading-title.catalog-heading.heading__h1 span'))?.evaluate((el) => el.innerHTML)) || shopData.categories.url
    ).trim();
    let remaining2process = size;
    let pageCounter = startPage;
    console.log('Выбираем элементы, Всего:', size, shopData.categories.url);
    console.timeLog(timerName, 'Начата обработка страниц', shopData.categories.url);
    const prodUrls: string[] = [];
    while (remaining2process > 0) {
      pageCounter++;
      if (pageCounter !== 1) {
        let successful = false;
        let counter = 10;
        while (!successful && counter !== 0) {
          counter--;
          try {
            await page.goto(`${shopData.shopUrl + shopData.categories.url + shopData.descUrl}&page=${pageCounter}`, { waitUntil: 'networkidle2' });
            successful = true;
          } catch (e) {
            console.warn('Ошибка при переходе на страницу', e);
          }
        }
        if (!successful) {
          console.warn('Выполнено 10 неудачных попыток перейти на станицу');
          process.exit(1);
        }
      } else {
        const checkAge = await page.$$(
          'button.simple-button.reset-button.catalog-2-level-product-card__button.catalog-2-level-product-card__button--confirm.style--catalog-2-level-product-card.not-in-cart'
        );
        if (checkAge.length > 0) {
          console.log('Нужно подтверждение возраста');
          await checkAge[0].click();
          console.log('Подтверждение возраста выполнено');
        }
      }
      //simple-button reset-button catalog-2-level-product-card__button catalog-2-level-product-card__button--confirm style--catalog-2-level-product-card not-in-cart
      //simple-button reset-button catalog-2-level-product-card__button catalog-2-level-product-card__button--reserve style--catalog-2-level-product-card not-in-cart
      console.timeLog(timerName, `Загружена страница: ${pageCounter}`, shopData.categories.url);

      // await delay(5000)
      // const elem = await page.$$('div.base-product-item.catalog-2-level-product.subcategory-or-type__products-item');
      // const elem = await page.$$('div.catalog-2-level-product-card.product-card.subcategory-or-type__products-item');
      const elem = await page.$$(shopData.categories.prodElem);
      if (elem.length === 0) {
        console.error('Ошибка при определении количества товаров на странице!!!!!-1');
        process.exit(1);
      }
      remaining2process -= elem.length;

      for (let i = 0; i < elem.length; i++) {
        const data = elem[i];

        // Определяем ссылку на детальное описание
        // const aData = await data.$('a.product-card-photo__link.reset-link');
        // const aData = await data.$('a.base-product-photo__link.reset-link');
        const aData = await data.$(shopData.categories.prodDetail);
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

    console.log(`Всего обработано... ${uData.length} Успешно: ${succ}. Режим ожидания завершения активных операций 10 сек`, shopData.categories.url);
    await delay(10000);
    console.log(`Всего обработано... ${uData.length} Успешно: ${succ}`, shopData.categories.url);
    await browser.close();
  })
  .catch((e) => {
    console.log('Ошибка', e, shopData.categories.url);
  })
  .finally(() => {
    console.timeEnd(timerName);
    console.log('Завершена обработка', shopData.categories.url);
    process.exit(0);
  });
