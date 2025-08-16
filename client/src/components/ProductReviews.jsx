import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, ThumbsUp, Edit, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ReviewForm from './ReviewForm'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ProductReviews = ({ productId }) => {
  const { user, isAuthenticated } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [filterRating, setFilterRating] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const queryClient = useQueryClient()

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['reviews', productId, filterRating, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterRating) params.append('rating', filterRating)
      params.append('sort', sortBy)
      
      const response = await api.get(`/reviews/product/${productId}?${params.toString()}`)
      return response.data
    },
    enabled: !!productId
  })

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await api.post(`/reviews/${reviewId}/helpful`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', productId])
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to mark as helpful'
      toast.error(message)
    }
  })

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await api.delete(`/reviews/${reviewId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', productId])
      toast.success('Review deleted successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete review'
      toast.error(message)
    }
  })

  const reviews = reviewsData?.data || []
  const stats = reviewsData?.stats || {}

  const renderStars = (rating, size = 'h-4 w-4') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating || 0)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(reviewId)
    }
  }

  const userReview = reviews.find(review => review.user._id === user?.id)

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {stats.averageRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center justify-center mb-2">
              {renderStars(stats.averageRating, 'h-5 w-5')}
            </div>
            <p className="text-sm text-gray-600">
              Based on {stats.totalReviews || 0} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution?.[rating] || 0
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 w-8">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Write Review Button */}
        {isAuthenticated && !userReview && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Write a Review
            </button>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Rating
            </label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {review.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.user.name}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                {user?.id === review.user._id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">{review.title}</h3>
                <p className="text-gray-700">{review.comment}</p>
              </div>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Helpful Button */}
              {isAuthenticated && user?.id !== review.user._id && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => helpfulMutation.mutate(review._id)}
                    disabled={helpfulMutation.isLoading}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful ({review.helpfulCount || 0})</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">Be the first to review this product!</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn btn-primary"
              >
                Write a Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onClose={() => setShowReviewForm(false)}
        />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewForm
          productId={productId}
          existingReview={editingReview}
          onClose={() => setEditingReview(null)}
        />
      )}
    </div>
  )
}

export default ProductReviews