export type Enum<E> = Record<keyof E, number | string> & { [k: number]: keyof E }
