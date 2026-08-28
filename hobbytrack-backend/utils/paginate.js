function buildPagination(page, limit, total)
{
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit)
  };
}

function getOffset(page, limit)
{
  return (page - 1) * limit;
}

module.exports = { buildPagination, getOffset };