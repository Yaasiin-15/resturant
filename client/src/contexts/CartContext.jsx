import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // Fetch cart data
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!isAuthenticated) return null
      const response = await api.get('/cart')
      return response.data.cart
    },
    enabled: isAuthenticated,
  })

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1, variantKey = null }) => {
      const response = await api.post('/cart/add', { productId, quantity, variantKey })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Added to cart!')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to add to cart'
      toast.error(message)
    },
  })

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ productId, quantity, variantKey = null }) => {
      const response = await api.put('/cart/update', { productId, quantity, variantKey })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Cart updated!')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update cart'
      toast.error(message)
    },
  })

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async ({ productId, variantKey = null }) => {
      const response = await api.delete('/cart/remove', { 
        data: { productId, variantKey } 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Item removed from cart!')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to remove from cart'
      toast.error(message)
    },
  })

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/cart/clear')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Cart cleared!')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to clear cart'
      toast.error(message)
    },
  })

  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code) => {
      const response = await api.post('/cart/apply-coupon', { code })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Coupon applied!')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to apply coupon'
      toast.error(message)
    },
  })

  // Remove coupon mutation
  const removeCouponMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/cart/remove-coupon')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart'])
      toast.success('Coupon removed!')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to remove coupon'
      toast.error(message)
    },
  })

  const addToCart = (productId, quantity = 1, variantKey = null) => {
    return addToCartMutation.mutate({ productId, quantity, variantKey })
  }

  const updateCartItem = (productId, quantity, variantKey = null) => {
    return updateCartItemMutation.mutate({ productId, quantity, variantKey })
  }

  const removeFromCart = (productId, variantKey = null) => {
    return removeFromCartMutation.mutate({ productId, variantKey })
  }

  const clearCart = () => {
    return clearCartMutation.mutate()
  }

  const applyCoupon = (code) => {
    return applyCouponMutation.mutate(code)
  }

  const removeCoupon = () => {
    return removeCouponMutation.mutate()
  }

  const value = {
    cart,
    cartLoading,
    addToCart: addToCartMutation,
    updateCartItem: updateCartItemMutation,
    removeFromCart: removeFromCartMutation,
    clearCart: clearCartMutation,
    applyCoupon: applyCouponMutation,
    removeCoupon: removeCouponMutation,
    cartItemCount: cart?.totalItems || 0,
    cartTotal: cart?.total || 0,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
