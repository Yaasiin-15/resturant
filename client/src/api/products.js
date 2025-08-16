import axios from './axios'

// Get products with filters
export const getProducts = async (params = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key])
    }
  })

  const response = await axios.get(`/products?${queryParams.toString()}`)
  return response.data
}

// Get single product by ID
export const getProduct = async (id) => {
  const response = await axios.get(`/products/${id}`)
  return response.data
}

// Get product by slug
export const getProductBySlug = async (slug) => {
  const response = await axios.get(`/products/slug/${slug}`)
  return response.data
}

// Get featured products
export const getFeaturedProducts = async () => {
  const response = await axios.get('/products/featured')
  return response.data
}

// Get related products
export const getRelatedProducts = async (productId) => {
  const response = await axios.get(`/products/${productId}/related`)
  return response.data
}

// Search products
export const searchProducts = async (query) => {
  const response = await axios.get(`/products/search?q=${encodeURIComponent(query)}`)
  return response.data
}

// Get products by category
export const getProductsByCategory = async (categoryId, params = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key])
    }
  })

  const response = await axios.get(`/products/category/${categoryId}?${queryParams.toString()}`)
  return response.data
}
