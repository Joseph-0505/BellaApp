export type PaginationInput = {
  page: number;
  limit: number;
};

// Converte pagina e limite em skip/take para consultas paginadas.
export function getPagination({ page, limit }: PaginationInput): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

// Monta os metadados padronizados usados nas respostas paginadas.
export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
