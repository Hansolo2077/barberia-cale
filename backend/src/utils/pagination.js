const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function getPagination(query = {}) {
  const page = parsePositiveInteger(query.page, 1);
  const requestedPageSize = parsePositiveInteger(
    query.pageSize,
    DEFAULT_PAGE_SIZE
  );
  const pageSize = Math.min(
    requestedPageSize,
    MAX_PAGE_SIZE
  );

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function buildPaginationMeta({
  page,
  pageSize,
  total,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

module.exports = {
  buildPaginationMeta,
  getPagination,
};
