import { useState } from 'react';

export default function InfoTooltip({ text }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="w-6 h-6 rounded-full bg-[#d9d3c7] dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-[#cec8bc] dark:hover:bg-gray-600 flex items-center justify-center text-sm font-serif italic transition-colors"
        aria-label="Information"
      >
        i
      </button>
      {isVisible && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 w-64 p-3 text-sm bg-[#fffef9] dark:bg-gray-800 border border-[#c4bfb3] dark:border-gray-700 rounded-lg shadow-lg text-gray-700 dark:text-gray-300">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#fffef9] dark:bg-gray-800 border-l border-b border-[#c4bfb3] dark:border-gray-700 rotate-45"></div>
          {text}
        </div>
      )}
    </div>
  );
}
