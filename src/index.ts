import puppeteer from 'puppeteer';
import * as process from 'process';

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
  .then(async (browser) => {
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
    await page.click('div.warning__block a.warning__button');
    // const fff = await page.content()
    // console.log(fff.length)
    //     .then(() => {
    //   console.log('Поле найдено');
    //   page.click('div.header__tradecenter_question-buttons button.header__tradecenter_question-btn.header__tradecenter_question-btn--active').then(() => {
    //     console.log('Выбран город');
    //   });
    // }).catch(e=>{
    //     console.log('Ошибка', e);
    // });
  })
  .catch((e) => {
    console.log('Ошибка', e);
  })
  .finally(() => {
    console.log('Завершена обработка');
    process.exit(0);
  });
