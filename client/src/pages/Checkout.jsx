import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { CreditCard, MapPin, Truck, ShoppingBag, Lock, ArrowLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Checkout = () => {
  const { cart, cartLoading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [selectedShipping, setSelectedShipping] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('stripe')

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  // Shipping methods
  const shippingMethods = [
    { id: 'standard', name: 'Standard Shipping', price: 5.99, days: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', price: 12.99, days: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 24.99, days: '1 business day' }
  ]

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await api.post('/orders', orderData)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Order placed successfully!')
      navigate(`/orders/${data.data._id}`)
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to place order'
      toast.error(message)
    }
  })

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart')
    }
  }, [cart, navigate])

  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0]
      setSelectedAddress(defaultAddress)
    }
  }, [user])

  const handleAddressSubmit = (data) => {
    setSelectedAddress(data)
    setCurrentStep(2)
  }

  const handleShippingSelect = (shipping) => {
    setSelectedShipping(shipping)
    setCurrentStep(3)
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedShipping) {
      toast.error('Please complete all steps')
      return
    }

    const orderData = {
      shippingAddress: selectedAddress,
      billingAddress: selectedAddress,
      paymentMethod,
      shippingMethod: selectedShipping,
      notes: ''
    }

    createOrderMutation.mutate(orderData)
  }

  if (cartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return null
  }

  const steps = [
    { id: 1, name: 'Shipping Address', icon: MapPin },
    { id: 2, name: 'Shipping Method', icon: Truck },
    { id: 3, name: 'Payment', icon: CreditCard }
  ]

  const subtotal = cart.subtotal || 0
  const shippingCost = selectedShipping?.price || 0
  const discount = cart.couponDiscount || 0
  const total = subtotal + shippingCost - discount

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive 
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 text-gray-400'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping Address */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
              
              {user?.addresses?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Addresses</h3>
                  <div className="space-y-3">
                    {user.addresses.map((address) => (
                      <div
                        key={address._id}
                        onClick={() => {
                          setSelectedAddress(address)
                          setCurrentStep(2)
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddress?._id === address._id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">{address.firstName} {address.lastName}</p>
                        <p className="text-gray-600">{address.address}</p>
                        <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                        <p className="text-gray-600">{address.country}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-gray-500">or</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className="input"
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="input"
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    {...register('address', { required: 'Address is required' })}
                    className="input"
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      {...register('city', { required: 'City is required' })}
                      className="input"
                    />
                    {errors.city && (
                      <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      {...register('state', { required: 'State is required' })}
                      className="input"
                    />
                    {errors.state && (
                      <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      {...register('zipCode', { required: 'ZIP code is required' })}
                      className="input"
                    />
                    {errors.zipCode && (
                      <p className="text-red-600 text-sm mt-1">{errors.zipCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      defaultValue="United States"
                      {...register('country', { required: 'Country is required' })}
                      className="input"
                    />
                    {errors.country && (
                      <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Phone is required' })}
                      className="input"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full btn btn-primary">
                  Continue to Shipping
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Shipping Method */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Method</h2>
              
              <div className="space-y-4">
                {shippingMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => handleShippingSelect(method)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedShipping?.id === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-600">{method.days}</p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${method.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-outline"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="space-y-4 mb-6">
                <div
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'stripe'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-3" />
                    <span className="font-medium">Credit/Debit Card</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Pay securely with Stripe</p>
                </div>

                <div
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'paypal'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-3 bg-blue-600 rounded"></div>
                    <span className="font-medium">PayPal</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Pay with your PayPal account</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-outline"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isLoading}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {createOrderMutation.isLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex items-center space-x-3">
                  <img
                    src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.price}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              
              {selectedShipping && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping ({selectedShipping.name})</span>
                  <span className="text-gray-900">${shippingCost.toFixed(2)}</span>
                </div>
              )}
              
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Lock className="h-4 w-4 mr-2" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout