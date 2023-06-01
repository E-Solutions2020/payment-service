Сервіс для реєстрації та проведення платежів. Payment частина

### Використання

Використовувати Dockerfile для запуску сервісу за допомогою докеру

#### Змінні середовища

| Назва                                      | За замовчуванням | Опис                                                                       |
|:-------------------------------------------|------------------|----------------------------------------------------------------------------|
| SERVICE_HOST                               |                  | Хост сервісу                                                               |
| SERVICE_PORT                               |                  | Порт сервісу                                                               |
| LOG_LEVEL                                  | log              | Рівень логування: error, warn, log, verbose, debug                         |
| LOG_STAT_INTERVAL_SECONDS                  | 60               | Інтервал логування статистики з'єднань                                     |
| DB_HOST                                    |                  | Хост бази даних                                                            |
| DB_PORT                                    |                  | Порт бази даних                                                            |
| DB_NAME                                    |                  | Ім’я бази даних                                                            |
| DB_USERNAME                                |                  | Користувач бази даних                                                      |
| DB_PASSWORD                                |                  | Пароль бази даних                                                          |
| DB_SCHEMA                                  |                  | Схема бази даних                                                           |
| PAY_LINK_BACK_END_URL                      |                  | Адреса бекенду сервісу PayLink                                             |
| PAY_LINK_FRONT_END_URL                     |                  | Адреса фронтенду сервісу PayLink                                           |
| PAY_LINK_TERMINAL_ID                       |                  | Ідентифікатор торговця для PayLink                                         |
| PAY_LINK_PRIVATE_KEY                       |                  | Ключ для підпису даних для PayLink                                         |
| PAY_LINK_SESSION_EXPIRATION_SECONDS        | 180              | Час життя сесії PayLink                                                    |
| POST_TRANSACTION_SERVICE_URL               |                  | Адреса сервісу позатранзакційних переказів                                 |
| POST_TRANSACTION_CERTIFICATE_PFX           |                  | Шлях до сертифікату для сервісу позатранзакційних переказів                |
| POST_TRANSACTION_CERTIFICATE_PASSWORD      |                  | Пароль для сертифікату для сервісу позатранзакційних переказів             |
| POST_TRANSACTION_BASIC_USERNAME            |                  | Username basic авторизації для сервісу позатранзакційних переказів         |
| POST_TRANSACTION_BASIC_PASSWORD            |                  | Password basic авторизації для сервісу позатранзакційних переказів         |
| POST_TRANSACTION_TERMINAL_ID               |                  | Ідентифікатор торговця для сервісу позатранзакційних переказів             |
| PAYMENT_STATUS_UPDATE_MIN_INTERVAL_SECONDS | 10               | Мінімальний інтервал перевірки статусу платежів                            |
| PAYMENT_STATUS_UPDATE_MAX_INTERVAL_SECONDS | 86400            | Максимальний інтервал перевірки статусу платежів                           |
| PAYMENT_STATUS_UPDATE_CONCURRENCY          | 5                | Кількість паралельних потоків перевірки статусу платежів                   |
| PAYMENT_STATUS_UPDATE_GIVE_UP_AFTER_DAYS   |                  | Кількість днів, після якої припиняти перевірку статусу платежів            |
| AUTH_SERVICE_URL                           |                  | Адреса сервісу авторизації                                                 |
| AUTH_CLIENT_ID                             |                  | Ідентифікатор клієнта сервісу авторизації                                  |
| AUTH_CLIENT_SECRET                         |                  | Секрет клієнта сервісу авторизації                                         |
| NOTIFICATION_MIN_INTERVAL_SECONDS          | 10               | Мінімальний інтервал сповіщення Клієнта про статус платежу                 |
| NOTIFICATION_MAX_INTERVAL_SECONDS          | 86400            | Максимальний інтервал сповіщення Клієнта про статус платежу                |
| NOTIFICATION_CONCURRENCY                   | 5                | Кількість паралельних потоків сповіщення Клієнта про статус платежу        |
| NOTIFICATION_GIVE_UP_AFTER_DAYS            | 30               | Кількість днів, після якої припиняти сповіщення Клієнта про статус платежу |
| NOTIFICATION_ON_PAYMENT_CHANGE             | false            | Ознака потреби сповіщення Клієнта про зміну деталей платежу                |
| NOTIFICATION_ON_PAYMENT_REFUND             | false            | Ознака потреби сповіщення Клієнта про повернення коштів                    |
| SSE_EXPIRATION_SECONDS                     | 900              | Час життя SSE-з'єднання                                                    |
| EMAIL_HOST                                 |                  | Хост поштового серверу                                                     |
| EMAIL_PORT                                 |                  | Порт поштового серверу                                                     |
| EMAIL_USERNAME                             |                  | Користувач поштового серверу                                               |
| EMAIL_PASSWORD                             |                  | Пароль поштового серверу                                                   |
| EMAIL_COMPANY_NAME                         |                  | Назва компанії, яку вказувати у листі                                      |
| EMAIL_COMPANY_PHONE                        |                  | Телефон компанії, який вказувати у листі                                   |