import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

const Cart = () => {
  const { user } = useAuth()
  const { 
    cart, 
    cartLoading, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    applyCoupon, 
    removeCoupon 
  } = useCart()
  const queryClient = useQueryClient()

  const [couponCode, setCouponCode] = useState('')
  const [showCouponForm, setShowCouponForm] = useState(false)

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      updateCartItem.mutate({
        productId,
        quantity: newQuantity
      })
    }
  }

  const handleRemoveItem = (productId) => {
    removeFromCart.mutate(productId)
  }

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCoupon.mutate(couponCode.trim())
      setCouponCode('')
      setShowCouponForm(false)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon.mutate()
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart.mutate()
    }
  }

  if (cartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <ShoppingBag className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <button
          onClick={handleClearCart}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Cart Items ({cart.totalItems})
              </h2>
            </div>
            
            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.product._id} className="p-6">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            <Link 
                              to={`/products/${item.product._id}`}
                              className="hover:text-primary-600 transition-colors"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600 mb-2">
                              Variant: {item.variant.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            ${item.price} each
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.product._id)}
                          disabled={removeFromCart.isLoading}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateCartItem.isLoading}
                            className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.countInStock || updateCartItem.isLoading}
                            className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.product.countInStock < item.quantity && (
                            <p className="text-sm text-red-600">
                              Only {item.product.countInStock} available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Coupon Section */}
            <div className="mb-6">
              {cart.coupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {cart.coupon.code} applied
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Save ${cart.coupon.discount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              ) : (
                <div>
                  {showCouponForm ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || applyCoupon.isLoading}
                          className="flex-1 btn btn-primary text-sm disabled:opacity-50"
                        >
                          {applyCoupon.isLoading ? 'Applying...' : 'Apply'}
                        </button>
                        <button
                          onClick={() => setShowCouponForm(false)}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCouponForm(true)}
                      className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-800"
                    >
                      <Tag className="h-4 w-4" />
                      <span>Add coupon code</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span>${cart.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              
              {cart.shippingCost > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>${cart.shippingCost?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              
              {cart.coupon && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${cart.coupon.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>${cart.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              to="/checkout"
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Continue Shopping */}
            <div className="mt-4 text-center">
              <Link
                to="/products"
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
