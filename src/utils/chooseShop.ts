import { Page } from 'puppeteer';

export const chooseShop = async (page: Page, url: string) => {
  try {
    console.log('Проверка региона');
    try {
      await page.waitForSelector('div.region-confirm__actions', {
        timeout: 2000,
      });
      await page.click('button.rectangle-button.reset--button-styles.action-button.apply-button.blue.lg.normal.wide');
      console.log('Регион выбран');
    } catch (e) {
      console.log('Без проверки региона');
    }
    console.log('Выбираю магазин', url);

    // Обработки модалки с типом магазина
    await page.waitForSelector(
      'div.shop-select-dialog__item.catalog--offline button.simple-button.reset-button.catalog--online.offline-prices-sorting--best-level.item__input.item__input--offline',
      {
        timeout: 2000,
      }
    );
    await page.click(
      'div.shop-select-dialog__item.catalog--offline button.simple-button.reset-button.catalog--online.offline-prices-sorting--best-level.item__input.item__input--offline'
    );

    await page.waitForSelector('button.rectangle-button.reset--button-styles.action-button.apply-button.blue.lg.normal.wide', {
      timeout: 2000,
    });

    await page.click('button.rectangle-button.reset--button-styles.action-button.apply-button.blue.lg.normal.wide');

    await page.waitForSelector('span.header-address__receive-address', {
      timeout: 2000,
    });

  //
  //   console.log('Нажимаю иконку выбора магазина:', url);
  //   await page.click('span.header-address__receive-address');
  //   console.log('Ищем самовывоз', url);
  //   await page.waitForSelector('label.obtainments-list__item input[value=pickup]', {
  //     timeout: 2000,
  //   });
  //   console.log('Жмем самовывоз:', url);
  //   await page.click('label.obtainments-list__item input[value=pickup]');
  //
  //   console.log('Ищем сохранить', url);
  //   await page.waitForSelector('button.rectangle-button.reset--button-styles.blue.lg.normal.wide', {
  //     timeout: 2000,
  //   });
  //   console.log('Жмем сохранить:', url);
  //   await page.click('button.rectangle-button.reset--button-styles.blue.lg.normal.wide');
  } catch (e) {
    console.log('Ошибка при выборе магазина', url);
  }
};
