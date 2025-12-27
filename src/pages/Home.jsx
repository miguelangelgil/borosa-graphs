import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Link to="/" className="flex items-center gap-2 text-4xl font-bold text-yellow-500">
            Borosa Graphs
          </Link>
        </div>
        <p className="text-gray-500 text-lg mb-6">Up-to-date financial data with weekly automated updates</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <a href="https://www.imf.org/external/datamapper" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            IMF DataMapper
          </a>
          <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            World Bank
          </a>
          <a href="https://www.investing.com/rates-bonds/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            Investing.com
          </a>
          <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            FRED
          </a>
        </div>
      </div>
    </div>
  );
}
