import { useState, useEffect } from 'react';

export function useChartData(dataFile) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(dataFile)
      .then(res => {
        if (!res.ok) throw new Error('Data file not found');
        return res.json();
      })
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [dataFile]);

  return { data, loading, error };
}
