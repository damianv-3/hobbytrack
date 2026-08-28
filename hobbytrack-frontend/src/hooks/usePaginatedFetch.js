import { useState, useEffect, useCallback } from 'react';

function usePaginatedFetch(fetchFn, deps = [], limit = 10)
{
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [extra, setExtra] = useState({});

  const refetch = useCallback(async () =>
  {
    const res = await fetchFn(page, limit);
    setData(res.items);
    setTotalPages(res.totalPages);
    setExtra(res.extra || {});
  }, [page, limit, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, page, setPage, totalPages, extra, refetch };
}

export default usePaginatedFetch;