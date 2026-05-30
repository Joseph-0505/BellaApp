import { buildPaginationMeta, getPagination } from "./pagination";

describe("pagination utils", () => {
  it("deve converter página e limite em skip/take", () => {
    expect(getPagination({ page: 3, limit: 20 })).toEqual({
      skip: 40,
      take: 20,
    });
  });

  it("deve montar metadados de paginação para listas vazias e preenchidas", () => {
    expect(buildPaginationMeta(0, 1, 10)).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

    expect(buildPaginationMeta(21, 2, 10)).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });
});