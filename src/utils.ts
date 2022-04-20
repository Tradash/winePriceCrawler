export const findPrice = (s: string): number => {
  const regGetPrice = new RegExp('(?<price>(?:\\d+\\s)?\\d+).*$', "gm");
  const m = regGetPrice.exec(s);
  if (m && m.groups) return Number(m.groups.price.replace(/ /g, ''));
  return 0;
};

export const findValue = (s: string): string => {
  const regGetValue = /^\D*(?<value>\d+\s((шт)|(Па)|(уп)|(кг)|(бт))).*$/gm;
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
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
};
