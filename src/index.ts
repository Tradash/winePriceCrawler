import puppeteer from 'puppeteer';
import * as process from 'process';
import { findPrice, findValue } from './utils';

console.log('Запущено приложение по сбору цен на вино');

const data = {
  url: 'https://msk.metro-cc.ru/category/alkogolnaya-produkciya/vino?order=price_desc',
};

const width = 1920;
const height = 1080;

puppeteer
  .launch({
    headless: true,
    slowMo: 10,
    args: [`--window-size=${width},${height}`, '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
  })
  .then(
    async (browser) => {
      const context = browser.defaultBrowserContext();
      let page = await browser.newPage();
      await context.overridePermissions(data.url, ['notifications']);
      console.log('Переход на страницу');
      await page.goto(data.url, { waitUntil: 'networkidle2' });
      // TODO возможно нужно сделать выбор города и может и магазина
      console.log('Подтверждаю город');
      await page.waitForSelector('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active', {
        timeout: 5000,
      });
      await page.click('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active');
      console.log('Подтверждаю возраст');
      await page.waitForSelector('div.warning__block a.warning__button', {
        timeout: 5000,
      });
      console.log('Подтверждаю возраст, жму кнопку');
      await page.click('div.warning__block a.warning__button');
      // Получаем элементы в винами
      console.log('Выбираем элементы');
      const elem = await page.$$('div.catalog-list__wrapper div.catalog-item');
      // const result: {
      //   id: string;
      //   name: string;
      //   fPrice: string;
      //   tPrice: string;
      // } = {};
      for (let i = 0; i < elem.length; i++) {
        const data = elem[i];
        // Получение ID
        const id = await data.evaluate((el) => el.getAttribute('data-productid'));
        // Получение наименования
        const domName = await data.$('a.catalog-item_name');
        if (!domName) continue;
        const name = await domName.evaluate((el) => el.innerHTML);
        const domPrice = await data.$$('div.catalog-item__hidden-content div.catalog-item_cost');
        const prodPrice: any = [];
        for (let j=0; j<domPrice.length; j++) {
            const priceRaw = await domPrice[j].$('div.catalog-item_price-lvl_current');
            if (!priceRaw) continue;
            const price = findPrice(await priceRaw.evaluate((el) => el.innerHTML));
            const valueRaw = await domPrice[j].$('div.catalog-item_discount-lvl');
            if (!valueRaw) continue;
            const value = findValue(await valueRaw.evaluate((el) => el.innerHTML));

            prodPrice.push({ price, value });
        }
        console.log(id, name, prodPrice);
      }
      // console.log(data)
    }

    // console.log(elem)
  )
  .catch((e) => {
    console.log('Ошибка', e);
  })
  .finally(() => {
    console.log('Завершена обработка');
    process.exit(0);
  });
