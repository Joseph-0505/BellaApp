interface Page<T> { data: T[]; meta: { total: number } }

export async function listAllPages<T>(fetchPage: (params: { page: number; limit: number }) => Promise<Page<T>>) {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const response = await fetchPage({ page, limit: 100 });
    if (!Array.isArray(response.data) || !Number.isFinite(response.meta?.total)) {
      throw new Error("Resposta de paginação inválida.");
    }
    items.push(...response.data);
    if (!response.data.length || items.length >= response.meta.total) return items;
  }
}
