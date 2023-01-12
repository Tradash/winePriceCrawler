export const isHeadless = false;
export const maxRepeat = 5; //Количество повторных попыток, получения данных после получения ошибки

export type TShopDetail = {
  url: string;
  prodElem: string;
  prodDetail: string;
  active: boolean;
};
export type TShopType = {
  shopUrl: string;
  descUrl: string;
  categories: TShopDetail[];
};

export const shopData: TShopType = {
  shopUrl: 'https://online.metro-cc.ru',
  descUrl: '?order=price_desc',
  categories: [
    {
      url: '/category/alkogolnaya-produkciya/shampanskoe-igristye-vina',
      prodElem: 'div.catalog-2-level-product-card.product-card.subcategory-or-type__products-item',
      prodDetail: 'a.product-card-photo__link.reset-link',
      active: true,
    },
    {
      url: '/category/myasnye/myaso/govyadina',
      prodElem: 'div.catalog-2-level-product-card.product-card.subcategory-or-type__products-item',
      prodDetail: 'a.product-card-photo__link.reset-link',
      active: true,
    },
    {
      url: '/category/chaj-kofe-kakao/kofe-zernovoj',
      prodElem: 'div.catalog-2-level-product-card.product-card.subcategory-or-type__products-item',
      prodDetail: 'a.product-card-photo__link.reset-link',
      active: true,
    },
    {
      url: '/category/alkogolnaya-produkciya/vino',
      prodElem: 'div.catalog-2-level-product-card.product-card.subcategory-or-type__products-item',
      prodDetail: 'a.product-card-photo__link.reset-link',
      active: true,
    },
  ],
};
export const maxWorker = 1; // Количество максимальных параллельных потоков (более 2-х комп начинает плохо себя чувствовать)
export const maxPage = 5; // Максимальное количество одновременно открытых страниц
