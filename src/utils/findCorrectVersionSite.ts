import puppeteer from "puppeteer";
import {isHeadless, shopData} from "../config";

export const findCorrectVersionSite = async (): Promise<puppeteer.Browser> => {
    const width = 800;
    const height = 600;
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
        await page.goto(shopData.shopUrl, {waitUntil: 'networkidle2'});
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
