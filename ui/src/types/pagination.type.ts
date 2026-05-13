export interface Pagination {
  page: number
  maxPage: number
  totalItem: number
}

export interface PaginationData<T> {
  items: T[]
  pagination: Pagination
}
