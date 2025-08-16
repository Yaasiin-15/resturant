import api from './axios'

// Create order from cart
export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData)
  return response.data
}

// Get user orders
export const getUserOrders = async (params = {}) => {
  const queryParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key])
    }
  })

  const response = await api.get(`/orders?${queryParams.toString()}`)
  return response.data
}

// Get single order
export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`)
  return response.data
}

// Cancel order
export const cancelOrder = async (id) => {
  const response = await api.put(`/orders/${id}/cancel`)
  return response.data
}

// Update order status (admin)
export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData)
  return response.data
}