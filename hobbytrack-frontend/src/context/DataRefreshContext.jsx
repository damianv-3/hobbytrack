import { createContext, useContext, useState } from 'react';

const DataRefreshContext = createContext();

export function DataRefreshProvider({ children })
{
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () =>
  {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DataRefreshContext.Provider value={{ refreshKey, bumpRefresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh()
{
  return useContext(DataRefreshContext);
}