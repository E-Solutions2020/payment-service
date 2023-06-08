-- public.auth_client_details definition

-- Drop table

-- DROP TABLE public.auth_client_details;

CREATE TABLE public.auth_client_details (
	auth_client_id varchar(256) NOT NULL, -- Унікальний ідентифікатор клієнта
	url varchar(256) NULL, -- Посилання на WEB ресурс кліента
	CONSTRAINT client_details_pk PRIMARY KEY (auth_client_id)
);

-- Column comments

COMMENT ON COLUMN public.auth_client_details.auth_client_id IS 'Унікальний ідентифікатор клієнта';
COMMENT ON COLUMN public.auth_client_details.url IS 'Посилання на WEB ресурс кліента';

INSERT INTO public.auth_client_details (auth_client_id, url) VALUES('k_yMORUwMIMM5tufKTXKa', 'https://court.gov.ua/');


-- public.fees definition

-- Drop table

-- DROP TABLE public.fees;

CREATE TABLE public.fees (
	fee_id uuid NOT NULL DEFAULT uuid_generate_v4(), -- Унікальний ідентифікатор запису
	payment_code varchar(4) NOT NULL, -- Код платежу
	fee_percent float4 NULL, -- Відсоток комісії платежу
	min_sum numeric(10, 2) NULL, -- Мінімальна сума комісії платежу
	description varchar(500) NOT NULL, -- Опис щодо комісії платежу
	create_date timestamptz NOT NULL DEFAULT now(), -- Дата початку дії комісії платежу
	finish_date timestamptz NULL, -- Дата завершення дії комісії платежу
	deleted bool NOT NULL DEFAULT false, -- Ознака видалення
	CONSTRAINT fees_pk PRIMARY KEY (fee_id)
);
CREATE INDEX fees_payment_code_idx ON public.fees USING btree (payment_code);

insert into public.fees (payment_code,fee_percent,min_sum,description)
values('101',2.0,5.00,'court fee');

-- Column comments

COMMENT ON COLUMN public.fees.fee_id IS 'Унікальний ідентифікатор запису';
COMMENT ON COLUMN public.fees.payment_code IS 'Код платежу';
COMMENT ON COLUMN public.fees.fee_percent IS 'Відсоток комісії платежу';
COMMENT ON COLUMN public.fees.min_sum IS 'Мінімальна сума комісії платежу';
COMMENT ON COLUMN public.fees.description IS 'Опис щодо комісії платежу';
COMMENT ON COLUMN public.fees.create_date IS 'Дата початку дії комісії платежу';
COMMENT ON COLUMN public.fees.finish_date IS 'Дата завершення дії комісії платежу';
COMMENT ON COLUMN public.fees.deleted IS 'Ознака видалення';


-- public.pan_errors definition

-- Drop table

-- DROP TABLE public.pan_errors;

CREATE TABLE public.pan_errors (
	pan_error_id uuid NOT NULL DEFAULT uuid_generate_v4(), -- Унікальний ідентифікатор помилки
	pan varchar(6) NOT NULL, -- Перші 6 цифр картки
	status int2 NULL, -- Статус платежу
	create_date timestamptz NOT NULL DEFAULT now(), -- Дата створення запису
	update_date timestamptz NOT NULL DEFAULT now(), -- Дата оновлення запису
	bank_name varchar(256) NULL, -- Назва банку
	CONSTRAINT pan_errors_pk PRIMARY KEY (pan_error_id),
	CONSTRAINT pan_errors_un UNIQUE (pan)
);

-- Column comments

COMMENT ON COLUMN public.pan_errors.pan_error_id IS 'Унікальний ідентифікатор помилки';
COMMENT ON COLUMN public.pan_errors.pan IS 'Перші 6 цифр картки';
COMMENT ON COLUMN public.pan_errors.status IS 'Статус платежу';
COMMENT ON COLUMN public.pan_errors.create_date IS 'Дата створення запису';
COMMENT ON COLUMN public.pan_errors.update_date IS 'Дата оновлення запису';
COMMENT ON COLUMN public.pan_errors.bank_name IS 'Назва банку';


-- public.payments definition

-- Drop table

-- DROP TABLE public.payments;

CREATE TABLE public.payments (
	payment_id uuid NOT NULL DEFAULT uuid_generate_v4(), -- Унікальний ідентифікатор платежу
	order_id text NOT NULL, -- Унікальний ідентифікатор платежу у системі клієнта
	sid varchar(200) NOT NULL, -- Ідентифікатор сесії PayLink
	currency varchar(3) NOT NULL, -- Валюта операції (ISO 4217), українська гривня = 980
	amount numeric(10, 2) NOT NULL, -- Сума платежу
	fee_id uuid NOT NULL, -- Ідентифікатор запису з таблиці fees
	fee numeric(10, 2) NULL, -- Сума комісії платежу
	recipient_iban varchar(34) NOT NULL, -- Номер рахунку Отримувача
	recipient_name varchar(500) NOT NULL, -- Найменування Отримувача
	recipient_edrpou varchar(10) NOT NULL, -- ЗКПО/ІНН Отримувача
	recipient_mfo varchar(10) NOT NULL, -- МФО Отримувача
	recipient_bank varchar(200) NOT NULL, -- Назва банку Отримувача
	payer_name varchar(100) NULL, -- Найменування Платника
	description varchar(500) NOT NULL, -- Призначення платежу
	status int2 NULL, -- Статус платежа:¶¶                                                   null - створено та не отримано відповіді від ТАС¶¶                                                   100-999 - отримано відповідь від ТАС згідно таблиці статусів. Див Специфікацію PAYLINK¶¶                                                   0 - отримано відповідь від АБС - позитивно¶¶                                                   більш 0 або менш 99 - отримано відповідь від АБС - негативно
	processing_id varchar(7) NULL, -- ID транзакції в процесінгу ТАС-Линк (TWOID) 
	transaction_id uuid NULL, -- Id операції торговця
	abs_status int2 NULL, -- Статус платежа в АБС
	abs_action_id int4 NULL, -- Унікальний ідентифікатор запиту в АБС
	abs_action_status text NULL, -- Статус запиту в АБС
	abs_action_time timestamptz NULL, -- Час запиту в АБС
	create_date timestamptz NOT NULL DEFAULT now(), -- Дата створення запису
	update_date timestamptz NOT NULL DEFAULT now(), -- Дата оновлення запису
	finish_date timestamptz NULL, -- Час і дата останньої зміни статусу транзакції ТАС
	finish_abs_date timestamptz NULL, -- Час і дата останньої зміни статусу документу в АБС
	notify_url varchar(200) NULL, -- Посилання на бекенд Клієнта щодо статусу платежа
	notified bool NOT NULL DEFAULT false, -- Ознака сповіщення по notify_url
	notify_retry_at timestamptz NULL, -- Дата наступної спроби сповіщення
	notify_attempts int4 NOT NULL DEFAULT 0, -- Кількість спроб сповіщення
	notify_error varchar NULL, -- Помилка сповіщення
	expired bool NOT NULL DEFAULT false, -- Ознака застарілої сесії
	failed bool NOT NULL DEFAULT false, -- Ознака неуспішної оплати
	finished bool NOT NULL DEFAULT false, -- Ознака успішної оплати
	status_message text NULL, -- Опис статусу PayLink або АБС
	started_pay bool NOT NULL DEFAULT false, -- Ознака переходу на сайт банку
	"refund_status" public."refund_status" NULL, -- Статус повернення коштів: started - замовлено; failed - невдало; finished - успішно
	refund_status_code int2 NULL, -- Статус-код повернення коштів від банку
	refund_status_message varchar NULL, -- Опис статусу повернення коштів від банку
	refund_amount float4 NULL, -- Сума повернутих коштів
	notify_start_at timestamptz NULL, -- Дата першої спроби сповіщення
	details_changed bool NOT NULL DEFAULT false, -- Змінено деталі платежу: реквізити або отримувач
	auth_client_id varchar(256) NOT NULL, -- Ідентифікатор клієнта у сервісі авторизації
	auth_client_name varchar(256) NOT NULL, -- Назва клієнта у сервісі авторизації
	pan varchar(6) NULL, -- Перші 6 цифр картки
	status_update_start_at timestamptz NULL, -- Дата першої спроби оновлення статусу
	status_update_retry_at timestamptz NULL, -- Дата наступної спроби оновлення статусу
	status_update_attempts int4 NOT NULL DEFAULT 0, -- Кількість спроб оновлення статусу
	abs_finished bool NOT NULL DEFAULT false, -- Ознака успішної оплати в АБС
	abs_failed bool NOT NULL DEFAULT false, -- Ознака помилки оплати в АБС
	CONSTRAINT payments_pk PRIMARY KEY (payment_id),
	CONSTRAINT payments_fee_fk FOREIGN KEY (fee_id) REFERENCES public.fees(fee_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX payments_flags_idx ON public.payments USING btree (failed, finished, abs_finished, refund_status, notified);
CREATE INDEX payments_refund_status_idx ON public.payments USING btree (refund_status);
CREATE INDEX payments_search_idx ON public.payments USING gin (description gin_trgm_ops, create_date);

-- Column comments

COMMENT ON COLUMN public.payments.payment_id IS 'Унікальний ідентифікатор платежу';
COMMENT ON COLUMN public.payments.order_id IS 'Унікальний ідентифікатор платежу у системі клієнта';
COMMENT ON COLUMN public.payments.sid IS 'Ідентифікатор сесії PayLink';
COMMENT ON COLUMN public.payments.currency IS 'Валюта операції (ISO 4217), українська гривня = 980';
COMMENT ON COLUMN public.payments.amount IS 'Сума платежу';
COMMENT ON COLUMN public.payments.fee_id IS 'Ідентифікатор запису з таблиці fees';
COMMENT ON COLUMN public.payments.fee IS 'Сума комісії платежу';
COMMENT ON COLUMN public.payments.recipient_iban IS 'Номер рахунку Отримувача';
COMMENT ON COLUMN public.payments.recipient_name IS 'Найменування Отримувача';
COMMENT ON COLUMN public.payments.recipient_edrpou IS 'ЗКПО/ІНН Отримувача';
COMMENT ON COLUMN public.payments.recipient_mfo IS 'МФО Отримувача';
COMMENT ON COLUMN public.payments.recipient_bank IS 'Назва банку Отримувача';
COMMENT ON COLUMN public.payments.payer_name IS 'Найменування Платника';
COMMENT ON COLUMN public.payments.description IS 'Призначення платежу';
COMMENT ON COLUMN public.payments.status IS 'Статус платежа:

                                                   null - створено та не отримано відповіді від ТАС

                                                   100-999 - отримано відповідь від ТАС згідно таблиці статусів. Див Специфікацію PAYLINK

                                                   0 - отримано відповідь від АБС - позитивно

                                                   більш 0 або менш 99 - отримано відповідь від АБС - негативно';
COMMENT ON COLUMN public.payments.processing_id IS 'ID транзакції в процесінгу ТАС-Линк (TWOID) ';
COMMENT ON COLUMN public.payments.transaction_id IS 'Id операції торговця';
COMMENT ON COLUMN public.payments.abs_status IS 'Статус платежа в АБС';
COMMENT ON COLUMN public.payments.abs_action_id IS 'Унікальний ідентифікатор запиту в АБС';
COMMENT ON COLUMN public.payments.abs_action_status IS 'Статус запиту в АБС';
COMMENT ON COLUMN public.payments.abs_action_time IS 'Час запиту в АБС';
COMMENT ON COLUMN public.payments.create_date IS 'Дата створення запису';
COMMENT ON COLUMN public.payments.update_date IS 'Дата оновлення запису';
COMMENT ON COLUMN public.payments.finish_date IS 'Час і дата останньої зміни статусу транзакції ТАС';
COMMENT ON COLUMN public.payments.finish_abs_date IS 'Час і дата останньої зміни статусу документу в АБС';
COMMENT ON COLUMN public.payments.notify_url IS 'Посилання на бекенд Клієнта щодо статусу платежа';
COMMENT ON COLUMN public.payments.notified IS 'Ознака сповіщення по notify_url';
COMMENT ON COLUMN public.payments.notify_retry_at IS 'Дата наступної спроби сповіщення';
COMMENT ON COLUMN public.payments.notify_attempts IS 'Кількість спроб сповіщення';
COMMENT ON COLUMN public.payments.notify_error IS 'Помилка сповіщення';
COMMENT ON COLUMN public.payments.expired IS 'Ознака застарілої сесії';
COMMENT ON COLUMN public.payments.failed IS 'Ознака неуспішної оплати';
COMMENT ON COLUMN public.payments.finished IS 'Ознака успішної оплати';
COMMENT ON COLUMN public.payments.status_message IS 'Опис статусу PayLink або АБС';
COMMENT ON COLUMN public.payments.started_pay IS 'Ознака переходу на сайт банку';
COMMENT ON COLUMN public.payments."refund_status" IS 'Статус повернення коштів: started - замовлено; failed - невдало; finished - успішно';
COMMENT ON COLUMN public.payments.refund_status_code IS 'Статус-код повернення коштів від банку';
COMMENT ON COLUMN public.payments.refund_status_message IS 'Опис статусу повернення коштів від банку';
COMMENT ON COLUMN public.payments.refund_amount IS 'Сума повернутих коштів';
COMMENT ON COLUMN public.payments.notify_start_at IS 'Дата першої спроби сповіщення';
COMMENT ON COLUMN public.payments.details_changed IS 'Змінено деталі платежу: реквізити або отримувач';
COMMENT ON COLUMN public.payments.auth_client_id IS 'Ідентифікатор клієнта у сервісі авторизації';
COMMENT ON COLUMN public.payments.auth_client_name IS 'Назва клієнта у сервісі авторизації';
COMMENT ON COLUMN public.payments.pan IS 'Перші 6 цифр картки';
COMMENT ON COLUMN public.payments.status_update_start_at IS 'Дата першої спроби оновлення статусу';
COMMENT ON COLUMN public.payments.status_update_retry_at IS 'Дата наступної спроби оновлення статусу';
COMMENT ON COLUMN public.payments.status_update_attempts IS 'Кількість спроб оновлення статусу';
COMMENT ON COLUMN public.payments.abs_finished IS 'Ознака успішної оплати в АБС';
COMMENT ON COLUMN public.payments.abs_failed IS 'Ознака помилки оплати в АБС';


-- public.refund_orders definition

-- Drop table

-- DROP TABLE public.refund_orders;

CREATE TABLE public.refund_orders (
	refund_order_id uuid NOT NULL DEFAULT uuid_generate_v4(), -- Унікальний ідентифікатор заявки на поверення коштів
	refund_order_numb varchar(10) NOT NULL, -- Короткий номер заявки на поверення коштів для зручності платника та співробітника контакт-центру
	payment_id uuid NULL, -- Ідентифікатор платежу
	return_url varchar(200) NULL, -- Посилання на сторінку Клієнта для повернення
	notify_url varchar(200) NULL, -- Посилання на бекенд Клієнта для повідомлення
	refund_reason varchar(200) NOT NULL, -- Причина повернення платежу
	status int2 NOT NULL DEFAULT 0, -- Статус звернення: 0 - нове звернення; 1 - звернення в обробці; 2 - опрацьовано, платіж відсутній; 3 - опрацьовано, платіж не можна повернути; 4 - опрацьовано, платіж повернуто
	note varchar(250) NULL, -- Коментар
	payer_name varchar(100) NOT NULL, -- ПІБ Платника
	payer_edrpou varchar(10) NOT NULL, -- ЄДРПОУ/РНОКПП Платника
	payer_phone numeric(12) NOT NULL, -- Номер телефону Платника
	payer_email varchar(100) NOT NULL, -- Email Платника
	payment_date date NOT NULL, -- Дата здійснення платежу
	case_numb varchar(70) NULL, -- Номер судової справи
	court_code varchar(25) NOT NULL, -- Унікальний код суду ЄДРСР 2007, до якого було здійснено платіж
	amount numeric(10, 2) NULL, -- Сума платежу без комісії
	amount_and_fee numeric(10, 2) NOT NULL, -- Сума платежу з комісією
	create_date timestamptz NOT NULL DEFAULT now(), -- Дата створення запису
	update_date timestamptz NOT NULL DEFAULT now(), -- Дата редагування запису
	payer_notified bool NOT NULL DEFAULT false, -- Ознака сповіщення Платника по email
	payer_notify_start_at timestamptz NULL, -- Дата першої спроби сповіщення
	payer_notify_retry_at timestamptz NULL, -- Дата наступної спроби сповіщення
	payer_notify_attempts int4 NOT NULL DEFAULT 0, -- Кількість спроб сповіщення
	payer_notify_error varchar NULL, -- Помилка сповіщення
	CONSTRAINT refund_orders_pk PRIMARY KEY (refund_order_id),
	CONSTRAINT refund_orders_fk FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX refund_orders_amount_and_fee_idx ON public.refund_orders USING btree (amount_and_fee);
CREATE INDEX refund_orders_amount_idx ON public.refund_orders USING btree (amount);
CREATE INDEX refund_orders_case_numb_idx ON public.refund_orders USING btree (case_numb);
CREATE INDEX refund_orders_court_code_idx ON public.refund_orders USING btree (court_code);
CREATE INDEX refund_orders_create_date_idx ON public.refund_orders USING btree (create_date);
CREATE INDEX refund_orders_payer_edrpou_idx ON public.refund_orders USING btree (payer_edrpou);
CREATE INDEX refund_orders_payer_name_idx ON public.refund_orders USING gin (payer_name gin_trgm_ops);
CREATE INDEX refund_orders_payer_notified_idx ON public.refund_orders USING btree (payer_notified);
CREATE UNIQUE INDEX refund_orders_refund_order_numb_idx ON public.refund_orders USING btree (refund_order_numb);
CREATE INDEX refund_orders_status_idx ON public.refund_orders USING btree (status);

-- Column comments

COMMENT ON COLUMN public.refund_orders.refund_order_id IS 'Унікальний ідентифікатор заявки на поверення коштів';
COMMENT ON COLUMN public.refund_orders.refund_order_numb IS 'Короткий номер заявки на поверення коштів для зручності платника та співробітника контакт-центру';
COMMENT ON COLUMN public.refund_orders.payment_id IS 'Ідентифікатор платежу';
COMMENT ON COLUMN public.refund_orders.return_url IS 'Посилання на сторінку Клієнта для повернення';
COMMENT ON COLUMN public.refund_orders.notify_url IS 'Посилання на бекенд Клієнта для повідомлення';
COMMENT ON COLUMN public.refund_orders.refund_reason IS 'Причина повернення платежу';
COMMENT ON COLUMN public.refund_orders.status IS 'Статус звернення: 0 - нове звернення; 1 - звернення в обробці; 2 - опрацьовано, платіж відсутній; 3 - опрацьовано, платіж не можна повернути; 4 - опрацьовано, платіж повернуто';
COMMENT ON COLUMN public.refund_orders.note IS 'Коментар';
COMMENT ON COLUMN public.refund_orders.payer_name IS 'ПІБ Платника';
COMMENT ON COLUMN public.refund_orders.payer_edrpou IS 'ЄДРПОУ/РНОКПП Платника';
COMMENT ON COLUMN public.refund_orders.payer_phone IS 'Номер телефону Платника';
COMMENT ON COLUMN public.refund_orders.payer_email IS 'Email Платника';
COMMENT ON COLUMN public.refund_orders.payment_date IS 'Дата здійснення платежу';
COMMENT ON COLUMN public.refund_orders.case_numb IS 'Номер судової справи';
COMMENT ON COLUMN public.refund_orders.court_code IS 'Унікальний код суду ЄДРСР 2007, до якого було здійснено платіж';
COMMENT ON COLUMN public.refund_orders.amount IS 'Сума платежу без комісії';
COMMENT ON COLUMN public.refund_orders.amount_and_fee IS 'Сума платежу з комісією';
COMMENT ON COLUMN public.refund_orders.create_date IS 'Дата створення запису';
COMMENT ON COLUMN public.refund_orders.update_date IS 'Дата редагування запису';
COMMENT ON COLUMN public.refund_orders.payer_notified IS 'Ознака сповіщення Платника по email';
COMMENT ON COLUMN public.refund_orders.payer_notify_start_at IS 'Дата першої спроби сповіщення';
COMMENT ON COLUMN public.refund_orders.payer_notify_retry_at IS 'Дата наступної спроби сповіщення';
COMMENT ON COLUMN public.refund_orders.payer_notify_attempts IS 'Кількість спроб сповіщення';
COMMENT ON COLUMN public.refund_orders.payer_notify_error IS 'Помилка сповіщення';