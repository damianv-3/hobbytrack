import { createContext, useContext, useState, useEffect } from 'react';

const PreferenceContext = createContext();

export function PreferenceProvider({ children })
{
  const [mediaPreference, setMediaPreferenceState] = useState(
    localStorage.getItem('mediaPreference') || 'both'
  );

  useEffect(() =>
  {
    localStorage.setItem('mediaPreference', mediaPreference);
  }, [mediaPreference]);

  const setMediaPreference = (value) =>
  {
    setMediaPreferenceState(value);
  };

  return (
    <PreferenceContext.Provider value={{ mediaPreference, setMediaPreference }}>
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreference()
{
  return useContext(PreferenceContext);
}