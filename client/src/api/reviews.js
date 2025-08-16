import api from './axios'

// Get product reviews
export const getProductReviews = async (productId, params = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key])
    }
  })

  const response = await api.get(`/reviews/product/${productId}?${queryParams.toString()}`)
  return response.data
}

// Create review
export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData)
  return response.data
}

// Update review
export const updateReview = async (id, reviewData) => {
  const response = await api.put(`/reviews/${id}`, reviewData)
  return response.data
}

// Delete review
export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/${id}`)
  return response.data
}

// Mark review as helpful
export const markReviewHelpful = async (id) => {
  const response = await api.post(`/reviews/${id}/helpful`)
  return response.data
}

// Get user reviews
export const getUserReviews = async (params = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key])
    }
  })

  const response = await api.get(`/reviews/user?${queryParams.toString()}`)
  return response.data
}