import {maxRepeat} from '../config';
import {IExtHandlerData} from "../types";

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

export const getId2Processing = <T extends IExtHandlerData>(data: T[]): number => {
    for (let i = 0; i < data.length; i++) {
        if (!data[i].isReady && data[i].repeatCounter < maxRepeat && !data[i].inWork) {
            return i;
        }
    }
    return -1;
};
