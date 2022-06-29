import puppeteer from 'puppeteer';
import { isHeadless, shopData } from './config';

export const findPrice = (s: string): number => {
  const regGetPrice = new RegExp('(?<price>(?:\\d+\\s)?\\d+).*$', 'gm');
  const m = regGetPrice.exec(s);
  if (m && m.groups) return Number(m.groups.price.replace(/ /g, ''));
  return 0;
};

export const findValue = (s: string): string => {
  const regGetValue = /^\s*от\s*(?<value>\d+\s((шт)|(Па)|(уп)|(кг)|(бт)))\s*$/gm;
  const m = regGetValue.exec(s);
  if (m && m.groups) return m.groups.value.trim();
  return 'Не указан';
};

export const getFullQuantity = (s: string): number => {
  const reg = /^\s*(?<quantity>\d*).*$/gm;
  const m = reg.exec(s);
  if (m && m.groups) return Number(m.groups.quantity.replace(/ /g, ''));
  return 0;
};

export const delay = async (delayInms: number): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
};

export const findCorrectVersionSite = async (): Promise<puppeteer.Browser> => {
  const width = 1920;
  const height = 1080;
  let count = 0;
  let browser: puppeteer.Browser;
  while (count < 30) {
    browser = await puppeteer.launch({
      headless: isHeadless,
      slowMo: 10,
      args: [`--window-size=${width},${height}`, '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--incognito'],
    });
    const context = browser.defaultBrowserContext();
    let page = await browser.newPage();
    await context.overridePermissions(shopData.shopUrl, ['notifications']);
    await page.goto(shopData.shopUrl, { waitUntil: 'networkidle2' });
    try {
      await page.waitForSelector('span.header-address__receive-method', {
        timeout: 3000,
      });
      count++;
      console.log('Корректная версия сайта, сделано попыток', count);
      await page.close();
      count = 100;
    } catch (e) {
      console.log('Некорректная версия сайта, сделано попыток', count + 1);
      await page.close();
      await browser.close();
    }
  }

  if (count !== 100) {
    console.log('Невозможно загрузить нужный вариант сайта после 10 плпыток');
    process.exit(1);
  }
  // @ts-ignore
  return browser as puppeteer.Browser;
};

export const toHHMMSS = (x: number) => {
  const sec_num = Math.floor(x / 1000); // don't forget the second param
  let hours = Math.floor(sec_num / 3600).toString();
  let minutes = Math.floor((sec_num - Number(hours) * 3600) / 60).toString();
  let seconds = (sec_num - Number(hours) * 3600 - Number(minutes) * 60).toString();

  if (hours.length < 2) {
    hours = '0' + hours;
  }
  if (minutes.length < 2) {
    minutes = '0' + minutes;
  }
  if (seconds.length < 2) {
    seconds = '0' + seconds;
  }
  return hours + ':' + minutes + ':' + seconds;
};
