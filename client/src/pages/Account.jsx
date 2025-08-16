import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { User, Package, MapPin, Settings, Edit, Plus, Trash2, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from '../api/axios'
import { Link } from 'react-router-dom'

const Account = () => {
  const { user, updateProfile } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [editingAddress, setEditingAddress] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  // Fetch user orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: () => axios.get('/orders').then(res => res.data),
    enabled: !!user
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
    }
  })

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: (data) => axios.post('/auth/addresses', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
      setShowAddressForm(false)
      reset()
    }
  })

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }) => axios.put(`/auth/addresses/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
      setEditingAddress(null)
      reset()
    }
  })

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (id) => axios.delete(`/auth/addresses/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
    }
  })

  const handleProfileUpdate = (data) => {
    updateProfileMutation.mutate(data)
  }

  const handleAddressSubmit = (data) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress._id, data })
    } else {
      addAddressMutation.mutate(data)
    }
  }

  const handleDeleteAddress = (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(addressId)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-blue-600 bg-blue-100',
      shipped: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100',
      refunded: 'text-gray-600 bg-gray-100'
    }
    return colors[status] || colors.pending
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      {...register('name', { required: 'Name is required' })}
                      className="input"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className="input bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="btn btn-primary"
                  >
                    {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
              </div>
              
              {ordersLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : ordersData?.data?.length > 0 ? (
                <div className="divide-y">
                  {ordersData.data.map((order) => (
                    <div key={order._id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <Link
                            to={`/orders/${order._id}`}
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-800"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-sm">View Details</span>
                          </Link>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item._id} className="flex items-center space-x-3">
                            <img
                              src={item.image || '/placeholder-product.jpg'}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              ${item.price}
                            </p>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-600">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            Total: <span className="font-medium text-gray-900">${order.totals.total}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">Start shopping to see your order history here.</p>
                  <Link to="/products" className="btn btn-primary">
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Shipping Addresses</h2>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Address</span>
                </button>
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  
                  <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          defaultValue={editingAddress?.street}
                          {...register('street', { required: 'Street address is required' })}
                          className="input"
                        />
                        {errors.street && (
                          <p className="text-red-600 text-sm mt-1">{errors.street.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          defaultValue={editingAddress?.city}
                          {...register('city', { required: 'City is required' })}
                          className="input"
                        />
                        {errors.city && (
                          <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          defaultValue={editingAddress?.state}
                          {...register('state', { required: 'State is required' })}
                          className="input"
                        />
                        {errors.state && (
                          <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code
                        </label>
                        <input
                          type="text"
                          defaultValue={editingAddress?.zipCode}
                          {...register('zipCode', { required: 'ZIP code is required' })}
                          className="input"
                        />
                        {errors.zipCode && (
                          <p className="text-red-600 text-sm mt-1">{errors.zipCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          defaultValue={editingAddress?.country}
                          {...register('country', { required: 'Country is required' })}
                          className="input"
                        />
                        {errors.country && (
                          <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={addAddressMutation.isLoading || updateAddressMutation.isLoading}
                        className="btn btn-primary"
                      >
                        {addAddressMutation.isLoading || updateAddressMutation.isLoading
                          ? 'Saving...'
                          : editingAddress ? 'Update Address' : 'Add Address'
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false)
                          setEditingAddress(null)
                          reset()
                        }}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Addresses List */}
              <div className="space-y-4">
                {user?.addresses?.map((address) => (
                  <div key={address._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{address.street}</p>
                        <p className="text-gray-600">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-gray-600">{address.country}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingAddress(address)
                            setShowAddressForm(true)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!user?.addresses || user.addresses.length === 0) && !showAddressForm && (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                    <p className="text-gray-600 mb-4">Add your first shipping address to get started.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="btn btn-primary"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <p className="text-gray-600 mb-4">
                    To change your password, please contact support or use the forgot password feature.
                  </p>
                  <button className="btn btn-outline">
                    Contact Support
                  </button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 border rounded-lg hover:bg-gray-50">
                      <h4 className="font-medium text-gray-900">Download My Data</h4>
                      <p className="text-sm text-gray-600">Get a copy of your personal data</p>
                    </button>
                    
                    <button className="w-full text-left p-4 border rounded-lg hover:bg-gray-50">
                      <h4 className="font-medium text-gray-900">Privacy Settings</h4>
                      <p className="text-sm text-gray-600">Manage your privacy preferences</p>
                    </button>
                    
                    <button className="w-full text-left p-4 border rounded-lg hover:bg-red-50 text-red-600">
                      <h4 className="font-medium">Delete Account</h4>
                      <p className="text-sm">Permanently delete your account and data</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Account
