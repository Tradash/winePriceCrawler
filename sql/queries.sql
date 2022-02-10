-- Выборка с сортировкой по продуктам
SELECT p.catalogName, p.id, p.code, p.name, p.brand, pt.priceDate, pd.measure, pd.price from product p
JOIN pricetag pt ON pt.productId=p.id
JOIN pricedetail pd ON pt.id=pd.priceTagId
ORDER BY p.catalogName, p.code asc, pt.priceDate DESC;

