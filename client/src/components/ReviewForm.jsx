import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Star, Upload, X } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ReviewForm = ({ productId, onClose, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [images, setImages] = useState(existingReview?.images || [])
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: existingReview?.title || '',
      comment: existingReview?.comment || ''
    }
  })

  const reviewMutation = useMutation({
    mutationFn: async (data) => {
      if (existingReview) {
        const response = await api.put(`/reviews/${existingReview._id}`, data)
        return response.data
      } else {
        const response = await api.post('/reviews', data)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product', productId])
      queryClient.invalidateQueries(['reviews', productId])
      toast.success(existingReview ? 'Review updated!' : 'Review submitted!')
      onClose()
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to submit review'
      toast.error(message)
    }
  })

  const handleSubmitReview = (data) => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    reviewMutation.mutate({
      productId,
      rating,
      title: data.title,
      comment: data.comment,
      images
    })
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    // In a real app, you'd upload these to a cloud service
    // For now, we'll just store placeholder URLs
    const newImages = files.map((file, index) => ({
      url: URL.createObjectURL(file),
      alt: `Review image ${images.length + index + 1}`
    }))
    setImages([...images, ...newImages])
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {existingReview ? 'Edit Review' : 'Write a Review'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleSubmitReview)} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title *
              </label>
              <input
                type="text"
                {...register('title', { 
                  required: 'Title is required',
                  minLength: { value: 3, message: 'Title must be at least 3 characters' }
                })}
                className="input"
                placeholder="Summarize your experience"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                rows={4}
                {...register('comment', { 
                  required: 'Review comment is required',
                  minLength: { value: 10, message: 'Comment must be at least 10 characters' }
                })}
                className="input"
                placeholder="Tell others about your experience with this product"
              />
              {errors.comment && (
                <p className="text-red-600 text-sm mt-1">{errors.comment.message}</p>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional)
              </label>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="review-images"
                />
                <label
                  htmlFor="review-images"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload photos
                  </span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewMutation.isLoading}
                className="flex-1 btn btn-primary"
              >
                {reviewMutation.isLoading 
                  ? 'Submitting...' 
                  : existingReview ? 'Update Review' : 'Submit Review'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewForm