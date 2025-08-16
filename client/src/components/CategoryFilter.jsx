import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import api from '../api/axios'

const CategoryFilter = ({ selectedCategory, onCategoryChange }) => {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data
    }
  })

  const categories = categoriesData?.data || []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => onCategoryChange('')}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
          selectedCategory === '' 
            ? 'bg-primary-100 text-primary-700' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        All Categories
      </button>
      
      {categories.map((category) => (
        <button
          key={category._id}
          onClick={() => onCategoryChange(category._id)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
            selectedCategory === category._id 
              ? 'bg-primary-100 text-primary-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span>{category.name}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter