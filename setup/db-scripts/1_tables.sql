-- public.payments definition

-- Drop table

-- DROP TABLE public.payments;

CREATE TABLE public.payments (
	payment_id uuid NOT NULL DEFAULT uuid_generate_v4(), -- Унікальний ідентифікатор платежу
	sid varchar(200) NOT NULL, -- Ідентифікатор сесії PayLink
	amount numeric(10, 2) NOT NULL, -- Сума платежу
	fee_id uuid NOT NULL, -- Ідентифікатор запису з таблиці fees
	fee numeric(10, 2) NULL, -- Сума комісії платежу
	recipient_iban varchar(34) NOT NULL, -- Номер рахунку Отримувача
	recipient_name varchar(500) NOT NULL, -- Найменування Отримувача
	recipient_edrpou varchar(10) NOT NULL, -- ЗКПО/ІНН Отримувача
	recipient_mfo varchar(10) NOT NULL, -- МФО Отримувача
	recipient_bank varchar(200) NOT NULL, -- Назва банку Отримувача
	description varchar(500) NOT NULL, -- Призначення платежу
	status int2 NULL, -- Статус платежа:¶¶                                                   null - створено та не отримано відповіді від ТАС¶¶                                                   100-999 - отримано відповідь від ТАС згідно таблиці статусів. Див Специфікацію PAYLINK¶¶                                                   0 - отримано відповідь від АБС - позитивно¶¶                                                   більш 0 або менш 99 - отримано відповідь від АБС - негативно
	abs_action_id int4 NULL, -- Унікальний ідентифікатор запиту в АБС
	processing_id varchar(7) NULL, -- ID транзакції в процесінгу ТАС-Линк (TWOID)
	create_date timestamptz NOT NULL DEFAULT now(), -- Дата створення запису
	finish_date timestamptz NULL, -- Час і дата останньої зміни статусу транзакції ТАС
	finish_abs_date timestamptz NULL, -- Час і дата останньої зміни статусу документу в АБС
	notify_url varchar(200) NULL, -- Посилання на бекенд Клієнта щодо статусу платежа
	expired bool NOT NULL DEFAULT false, -- Ознака застарілої сесії
	transaction_id uuid NULL, -- Id операції торговця
	currency varchar(3) NOT NULL, -- Код валюти
	abs_status int2 NULL,
	status_message text NULL,
	abs_action_status text NULL,
	order_id text NOT NULL, -- Унікальний ідентифікатор платежу у системі клієнта
	notified bool NOT NULL DEFAULT false, -- Ознака сповіщення по notify_url
	notify_retry_at timestamptz NULL, -- Дата наступної спроби сповіщення
	update_date timestamptz NOT NULL DEFAULT now(), -- Дата оновлення запису
	failed bool NOT NULL DEFAULT false, -- Ознака неуспішної оплати
	finished bool NOT NULL DEFAULT false, -- Ознака успішної оплати
	notify_attempts int4 NOT NULL DEFAULT 0, -- Кількість спроб сповіщення
	payer_name varchar(100) NULL, -- Найменування Платника
	abs_action_time timestamptz NULL, -- Час запиту в АБС
	notify_error varchar NULL, -- Помилка сповіщення
	started_pay bool NOT NULL DEFAULT false, -- Ознака переходу на сайт банку
	"refund_status" public."refund_status" NULL, -- Статус повернення коштів: started - замовлено; failed - невдало; finished - успішно
	refund_status_code int2 NULL, -- Статус-код повернення коштів від банку
	refund_status_message varchar NULL, -- Опис статусу повернення коштів від банку
	refund_amount float4 NULL, -- Сума повернутих коштів
	notify_start_at timestamptz NULL, -- Дата першої спроби сповіщення
	details_changed bool NOT NULL DEFAULT false, -- Змінено деталі платежу: реквізити або отримувач
	auth_client_id varchar(256) NULL, -- Ідентифікатор клієнта у сервісі авторизації
	auth_client_name varchar(256) NULL, -- Назва клієнта у сервісі авторизації
	pan varchar(6) NULL, -- Перші 6 цифр картки
	status_update_start_at timestamptz NULL, -- Дата першої спроби оновлення статусу
	status_update_retry_at timestamptz NULL, -- Дата наступної спроби оновлення статусу
	status_update_attempts int4 NOT NULL DEFAULT 0, -- Кількість спроб оновлення статусу
	abs_finished bool NOT NULL DEFAULT false, -- Ознака успішної оплати в АБС
	CONSTRAINT payments_pk PRIMARY KEY (payment_id)
);
CREATE INDEX payments_flags_idx ON public.payments USING btree (failed, finished, status, refund_status, notified);
CREATE INDEX payments_search_idx ON public.payments USING gin (description gin_trgm_ops, create_date);

-- Column comments

COMMENT ON COLUMN public.payments.payment_id IS 'Унікальний ідентифікатор платежу';
COMMENT ON COLUMN public.payments.sid IS 'Ідентифікатор сесії PayLink';
COMMENT ON COLUMN public.payments.amount IS 'Сума платежу';
COMMENT ON COLUMN public.payments.fee_id IS 'Ідентифікатор запису з таблиці fees';
COMMENT ON COLUMN public.payments.fee IS 'Сума комісії платежу';
COMMENT ON COLUMN public.payments.recipient_iban IS 'Номер рахунку Отримувача';
COMMENT ON COLUMN public.payments.recipient_name IS 'Найменування Отримувача';
COMMENT ON COLUMN public.payments.recipient_edrpou IS 'ЗКПО/ІНН Отримувача';
COMMENT ON COLUMN public.payments.recipient_mfo IS 'МФО Отримувача';
COMMENT ON COLUMN public.payments.recipient_bank IS 'Назва банку Отримувача';
COMMENT ON COLUMN public.payments.description IS 'Призначення платежу';
COMMENT ON COLUMN public.payments.status IS 'Статус платежа:

                                                   null - створено та не отримано відповіді від ТАС

                                                   100-999 - отримано відповідь від ТАС згідно таблиці статусів. Див Специфікацію PAYLINK

                                                   0 - отримано відповідь від АБС - позитивно

                                                   більш 0 або менш 99 - отримано відповідь від АБС - негативно';
COMMENT ON COLUMN public.payments.abs_action_id IS 'Унікальний ідентифікатор запиту в АБС';
COMMENT ON COLUMN public.payments.processing_id IS 'ID транзакції в процесінгу ТАС-Линк (TWOID) ';
COMMENT ON COLUMN public.payments.create_date IS 'Дата створення запису';
COMMENT ON COLUMN public.payments.finish_date IS 'Час і дата останньої зміни статусу транзакції ТАС';
COMMENT ON COLUMN public.payments.finish_abs_date IS 'Час і дата останньої зміни статусу документу в АБС';
COMMENT ON COLUMN public.payments.notify_url IS 'Посилання на бекенд Клієнта щодо статусу платежа';
COMMENT ON COLUMN public.payments.expired IS 'Ознака застарілої сесії';
COMMENT ON COLUMN public.payments.transaction_id IS 'Id операції торговця';
COMMENT ON COLUMN public.payments.currency IS 'Код валюти';
COMMENT ON COLUMN public.payments.order_id IS 'Унікальний ідентифікатор платежу у системі клієнта';
COMMENT ON COLUMN public.payments.notified IS 'Ознака сповіщення по notify_url';
COMMENT ON COLUMN public.payments.notify_retry_at IS 'Дата наступної спроби сповіщення';
COMMENT ON COLUMN public.payments.update_date IS 'Дата оновлення запису';
COMMENT ON COLUMN public.payments.failed IS 'Ознака неуспішної оплати';
COMMENT ON COLUMN public.payments.finished IS 'Ознака успішної оплати';
COMMENT ON COLUMN public.payments.notify_attempts IS 'Кількість спроб сповіщення';
COMMENT ON COLUMN public.payments.payer_name IS 'Найменування Платника';
COMMENT ON COLUMN public.payments.abs_action_time IS 'Час запиту в АБС';
COMMENT ON COLUMN public.payments.notify_error IS 'Помилка сповіщення';
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


-- public.payments foreign keys

ALTER TABLE public.payments ADD CONSTRAINT payments_fee_fk FOREIGN KEY (fee_id) REFERENCES public.fees(fee_id) ON DELETE RESTRICT ON UPDATE CASCADE;