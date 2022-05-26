-- Выборка с сортировкой по продуктам
SELECT p.catalogName, p.id, p.code, p.name, p.brand, pt.priceDate, pd.measure, pd.price from product p
JOIN pricetag pt ON pt.productId=p.id
JOIN pricedetail pd ON pt.id=pd.priceTagId
ORDER BY p.catalogName, p.code asc, pt.priceDate DESC;

-- Выборка по продукту с указанием текущих цен, минимальных и максимальных исторических цен, с разбивкой по группам предложений
SELECT timestamp(DATE(max(priceDate)))  INTO @p1 FROM pricetag;

SELECT @p1 as dateNow, tb.id, tb.measure, max(tb.minPrice) as minPrice, max(tb.maxPrice) AS maxPrice, max(tb.lastPrice) AS lastPrice, pp.* FROM (SELECT p.id AS id , pd.measure AS measure, 0 AS minPrice, 0 AS maxPrice, pd.price AS lastPrice FROM product p
JOIN pricetag pt ON pt.productId=p.id AND pt.priceDate>=@p1
JOIN pricedetail pd ON pd.priceTagId=pt.id
union
SELECT p.id AS id , pd.measure AS measure, MIN(pd.price) AS minPrice, MAX(pd.price) AS maxPrice, 0 AS lastPrice FROM product p
JOIN pricetag pt ON pt.productId=p.id AND pt.priceDate<@p1
JOIN pricedetail pd ON pd.priceTagId=pt.id
WHERE p.id IN (
SELECT p.id FROM product p
JOIN pricetag pt ON pt.productId=p.id AND pt.priceDate>=@p1
JOIN pricedetail pd ON pd.priceTagId=pt.id
)
GROUP BY p.id, pd.measure) AS tb
JOIN product pp ON tb.id=pp.id
WHERE pp.catalogName='Вино'
-- AND pp.code='79078'
GROUP BY tb.id, tb.measure
;
