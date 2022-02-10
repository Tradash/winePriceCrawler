import puppeteer from 'puppeteer';
import { ProductModel } from '../models/productModel';
import { db } from '../db/dbController';

const width = 1920;
const height = 1080;

const timerName = `start:GetExtInfo`;

console.time(timerName);

const wineModel = new ProductModel(db);

wineModel.findProducts4GetAdditionalSpec(1000).then((data) => {
  puppeteer
    .launch({
      headless: true,
      slowMo: 10,
      args: [`--window-size=${width},${height}`, '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--incognito'],
    })
    .then(async (browser) => {
      const context = browser.defaultBrowserContext();
      let page = await browser.newPage();
      for (let i = 0; i < data.length; i++) {
        if (i == 0) {
          await context.overridePermissions(data[i].urlDescription, ['notifications']);
          await page.goto(data[i].urlDescription, { waitUntil: 'networkidle2' });
          try {
            await page.waitForSelector('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active', {
              timeout: 5000,
            });
            await page.click('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active');
            await page.waitForSelector('div.warning__block a.warning__button', {
              timeout: 5000,
            });
            await page.click('div.warning__block a.warning__button');
          } catch (e) {
            console.log('Ошибка при подтверждении города/возраста', e);
          }
        } else {
          await page.goto(data[i].urlDescription, { waitUntil: 'networkidle2' });
        }
        const brandData = await page.$('div.product-page__tablet-brand p span');
        if (!brandData) continue;
        const brand = await brandData.evaluate((el) => el.innerHTML);

        const elems = await page.$$('div.product-page__fullspec-line');
        const fullSpec: any = {};
        for (let i = 0; i < elems.length; i++) {
          const elem = elems[i];
          const nameSpec = await (await elem.$('div.product-page__fullspec-line p'))?.evaluate((el) => el.innerHTML);
          const value = await (await elem.$('div.product-page__fullspec-line span'))?.evaluate((el) => el.innerHTML);
          if (nameSpec && value) fullSpec[nameSpec] = value;
        }
        await wineModel.updateProductAdditional({ id: data[i].id, country: fullSpec['Страна'] || "Не указана", brand: brand.replace('amp;', '') || "Не указан", bodyJson: JSON.stringify(fullSpec) || "Не указан" });
        console.timeLog(timerName, `Обработано: ${i+1}, Осталось: ${data.length-i-1}`);

      }
      await browser.close();
    }).catch(e=>{
      console.log("Ошибка при обработке", e)
  }).finally(()=>{
      db.closeConnection();
      console.timeEnd(timerName)
  });
});
