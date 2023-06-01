import { Page } from '@app/common'

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 1000

type TypeOrmPage = {
  skip: number,
  take: number,
}

export function processPage(page?: Page): TypeOrmPage {
  let { number = 0, size = DEFAULT_PAGE_SIZE } = page || {}

  size = Math.min(size, MAX_PAGE_SIZE)

  return {
    skip: number * size,
    take: size,
  }
}