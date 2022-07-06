import {IExtHandlerData, IUData, IUSubData} from "../types";
import {delay, getId2Processing} from "./utils";
import {maxPage} from "../config";
import {toHHMMSS} from "./toHHMMSS";
import {Browser} from "puppeteer";

export type THandler = (browser:Browser, data: IUData|IUSubData, extData?: string) => Promise<boolean>

export const handler = async <T extends IExtHandlerData, E extends IUData|IUSubData> (browser: Browser, data: (T & E)[], func: THandler, extData?: string): Promise<number> => {

    const startTimeGlobal = new Date().getTime();
    const maxRepeat = 3;
    let active = 0;
    let succ = 0;
    let isWork = true;

    while (isWork) {
        const i = getId2Processing(data);
        if (i == -1) {
            isWork = false;
        } else {
            if (active < maxPage) {
                data[i].inWork = true;
                data[i].repeatCounter++;
                active++;
                const startTime = new Date().getTime();
                // getData(browser, uData[i].url, categoryName)
                func(browser, data[i], extData)
                    .then((x) => {
                        active--;
                        if (x) {
                            succ++;
                            data[i].isReady = true;
                            console.log(`Страница ${data[i].url} обработана за ${toHHMMSS(new Date().getTime() - startTime)}, ${succ}/${data.length}, Осталось времени: ${toHHMMSS(((new Date().getTime() - startTimeGlobal) / succ ) * (data.length - succ ))}`);
                        } else {
                            data[i].inWork = false;
                        }
                    })
                    .catch((e) => {
                        active--;
                        data[i].inWork = false;
                        console.warn(`Ошибка при обработке ${data[i].url}, Попытка ${data[i].repeatCounter}/${maxRepeat}`, e.message);
                    });
            }
        }
        await delay(1000);
    }
    return succ;
}
