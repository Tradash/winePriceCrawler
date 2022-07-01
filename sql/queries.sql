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

// Запрос определяет товары с минимальными ценами на текущий день

SELECT timestamp(DATE(max(priceDate)))  INTO @p1 FROM pricetag;

drop TABLE if EXISTS DATA01;
drop TABLE if EXISTS DATA02;
drop TABLE if EXISTS DATA03;
drop TABLE if EXISTS DATA04;

create temporary TABLE DATA01 SELECT @p1 AS dateNow, tb.measure, max(tb.minPrice) as minPrice, max(tb.maxPrice) AS maxPrice, max(tb.lastPrice) AS lastPrice, pp.* FROM (SELECT p.id AS id , pd.measure AS measure, 0 AS minPrice, 0 AS maxPrice, pd.price AS lastPrice FROM product p
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
GROUP BY tb.id, tb.measure;

SELECT * FROM DATA01;


create temporary TABLE DATA02 SELECT id, min(lastPrice) AS minLastPrice FROM DATA01 WHERE lastPrice>0 GROUP BY id;
SELECT * FROM DATA02;

create temporary TABLE DATA03 SELECT id, min(minPrice) AS minPrice FROM DATA01 WHERE minPrice>0 GROUP BY id;
SELECT * FROM DATA03;

create temporary TABLE DATA04 SELECT d2.id, d2.minLastPrice FROM DATA02 d2
JOIN DATA03 d3 ON d2.id=d3.id
WHERE d2.minLastPrice<=d3.minPrice;

SELECT d4.id,catalogName,  urlDescription,NAME, country, GROUP_CONCAT(CONCAT(d1.measure, " ИMЦ ", ": ", d1.minPrice, " ТЦ:", ": ", d1.lastPrice, " ")) FROM DATA01 d1
JOIN DATA04 d4 ON d1.id=d4.id
GROUP BY d4.id

