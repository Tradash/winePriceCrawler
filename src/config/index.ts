export const isHeadless = false;
export const maxRepeat = 5; //Количество повторных попыток, получения данных после получения ошибки
export const shopData = {
  shopUrl: 'https://online.metro-cc.ru',
  descUrl: '?order=price_desc',
  categories: [
    '/category/alkogolnaya-produkciya/shampanskoe-igristye-vina',
    '/category/myasnye/myaso/govyadina',
     '/category/chaj-kofe-kakao/kofe-zernovoj',
    '/category/alkogolnaya-produkciya/vino',
  ],
};
export const maxWorker = 2; // Количество максимальных параллельных потоков (более 2-х комп начинает плохо себя чувствовать)
