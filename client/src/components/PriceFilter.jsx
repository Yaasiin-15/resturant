import { useState } from 'react'

const PriceFilter = ({ minPrice, maxPrice, onPriceChange }) => {
  const [localMin, setLocalMin] = useState(minPrice || '')
  const [localMax, setLocalMax] = useState(maxPrice || '')

  const handleApply = () => {
    onPriceChange(localMin, localMax)
  }

  const handleClear = () => {
    setLocalMin('')
    setLocalMax('')
    onPriceChange('', '')
  }

  const priceRanges = [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: 'Over $200', min: 200, max: null }
  ]

  return (
    <div className="space-y-4">
      {/* Quick Price Ranges */}
      <div className="space-y-2">
        {priceRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => {
              setLocalMin(range.min)
              setLocalMax(range.max || '')
              onPriceChange(range.min, range.max || '')
            }}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              (minPrice == range.min && maxPrice == range.max) 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Custom Range */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Custom Range</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min</label>
              <input
                type="number"
                placeholder="0"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max</label>
              <input
                type="number"
                placeholder="1000"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceFilter