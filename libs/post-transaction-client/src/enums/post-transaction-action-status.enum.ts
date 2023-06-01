export enum PostTransactionActionStatus {
  CLB_WAIT_IIT = 'CLB_WAIT_IIT', // Временный статус подготовки документа в отправку
  VACANT = 'VACANT', // "Свободен", статус що встановлюють після відправки запиту.
  VERIFIED = 'VERIFIED', // "Подготовлен", проміжний статус.
  POSTED = 'POSTED', // - "Проведен", проміжний статус для зовнішніх платежів.
  POSTCONTROL = 'POSTCONTROL', // "Готов к отправке по СЭП", проміжний статус для зовнішніх платежів.
  SHIPPED = 'SHIPPED', // "Отправлен по СЭП НБУ", платіж відправлений.
  CONFIRMED = 'CONFIRMED',
}

export const PENDING_POST_TRANSACTION_ACTION_STATUSES = [
  PostTransactionActionStatus.CLB_WAIT_IIT,
]

export const FINISHED_POST_TRANSACTION_ACTION_STATUSES = [
  PostTransactionActionStatus.VACANT,
  PostTransactionActionStatus.VERIFIED,
  PostTransactionActionStatus.POSTED,
  PostTransactionActionStatus.POSTCONTROL,
  PostTransactionActionStatus.SHIPPED,
  PostTransactionActionStatus.CONFIRMED,
]