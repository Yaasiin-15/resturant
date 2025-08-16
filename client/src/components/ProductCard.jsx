import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Eye } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

const ProductCard = ({ product, view = 'grid' }) => {
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return
    }
    
    addToCart.mutate({
      productId: product._id,
      quantity: 1
    })
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating || 0)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (view === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="flex">
          <Link to={`/products/${product._id}`} className="flex-shrink-0">
            <div className="relative">
              <img
                src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-48 h-48 object-cover"
              />
              {product.salePrice && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                  {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                </div>
              )}
            </div>
          </Link>
          
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <Link to={`/products/${product._id}`}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-2">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.numReviews || 0} reviews)
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {product.salePrice ? (
                      <>
                        <span className="text-2xl font-bold text-primary-600">
                          ${product.salePrice}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ${product.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-primary-600">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {product.countInStock > 0 ? (
                      <span className="text-green-600">In Stock</span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.countInStock === 0 || addToCart.isLoading}
                  className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {addToCart.isLoading ? 'Adding...' : 'Add to Cart'}
                </button>
                
                <Link
                  to={`/products/${product._id}`}
                  className="btn btn-outline flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <Link to={`/products/${product._id}`} className="group">
      <div className="card overflow-hidden hover:shadow-md transition-shadow">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images?.[0]?.url || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.salePrice && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
              {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={product.countInStock === 0 || addToCart.isLoading}
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center mr-2">
              {renderStars(product.rating)}
            </div>
            <span className="text-sm text-gray-500">
              ({product.numReviews || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {product.salePrice ? (
                <>
                  <span className="text-lg font-bold text-gray-900">
                    ${product.salePrice}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ${product.price}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  ${product.price}
                </span>
              )}
            </div>
            
            {/* Stock Status */}
            <span className={`text-sm ${
              product.countInStock > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
