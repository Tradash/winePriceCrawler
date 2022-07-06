# ProductPriceCrawler 

Парсинг цен на сайте метро-СС
Категории:
Вино, Шампанское и игристые вина, Кофе зерновой, Шампанское и игристые вина <br>
И можно добавить любые другие, в .src/index.ts, переменная shopData.categories

Версия 2.0 
Для обновленной версии сайта Metro-CC с 23/06/2022.

### Установка
1. Клонировать репозитарий
2. npm i
3. Скрипт для создания БД mysql .sql/createDB.sql
4. Изменить конфиг доступа к БД в .src/db/dbController.ts, переменная mysqlConfig


### Запуск парсинга цен на текущую дата
`npm run startLocal`

### Запуск получения дополнительных характеристик продуктов (необязательно)
`npm run startLocalGetExtInfo`
