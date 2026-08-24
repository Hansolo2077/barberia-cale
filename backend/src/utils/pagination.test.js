const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPaginationMeta,
  getPagination,
} = require("./pagination");

test("getPagination applies safe defaults and caps page size", () => {
  assert.deepEqual(getPagination({}), {
    page: 1,
    pageSize: 100,
    offset: 0,
  });

  assert.deepEqual(
    getPagination({ page: "3", pageSize: "999" }),
    {
      page: 3,
      pageSize: 100,
      offset: 200,
    }
  );
});

test("buildPaginationMeta reports whether another page exists", () => {
  assert.deepEqual(
    buildPaginationMeta({
      page: 2,
      pageSize: 50,
      total: 101,
    }),
    {
      page: 2,
      pageSize: 50,
      total: 101,
      totalPages: 3,
      hasMore: true,
    }
  );
});
