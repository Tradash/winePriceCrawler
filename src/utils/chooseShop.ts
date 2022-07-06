import { Page } from 'puppeteer';

export const chooseShop = async (page: Page, url: string) => {
  try {
    console.log('Выбираю магазин', url);
    await page.waitForSelector('span.header-address__receive-address', {
      timeout: 2000,
    });
    console.log('Нажимаю иконку выбора магазина:', url);
    await page.click('span.header-address__receive-address');
    console.log('Ищем самовывоз', url);
    await page.waitForSelector('label.obtainments-list__item input[value=pickup]', {
      timeout: 2000,
    });
    console.log('Жмем самовывоз:', url);
    await page.click('label.obtainments-list__item input[value=pickup]');

    console.log('Ищем сохранить', url);
    await page.waitForSelector('button.rectangle-button.reset--button-styles.blue.lg.normal.wide', {
      timeout: 2000,
    });
    console.log('Жмем сохранить:', url);
    await page.click('button.rectangle-button.reset--button-styles.blue.lg.normal.wide');
  } catch (e) {
    console.log('Ошибка при выборе магазина', url);
  }
};
