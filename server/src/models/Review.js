import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment'],
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  images: [{
    url: String,
    alt: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpful: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Pre-save middleware to update product rating
reviewSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('rating')) {
    const Product = mongoose.model('Product');
    
    // Calculate average rating for the product
    const stats = await this.constructor.aggregate([
      {
        $match: { product: this.product, isActive: true }
      },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(this.product, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        numReviews: stats[0].numReviews
      });
    }
  }
  next();
});

// Pre-remove middleware to update product rating when review is deleted
reviewSchema.pre('remove', async function(next) {
  const Product = mongoose.model('Product');
  
  // Recalculate average rating for the product
  const stats = await this.constructor.aggregate([
    {
      $match: { product: this.product, isActive: true }
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].numReviews
    });
  } else {
    await Product.findByIdAndUpdate(this.product, {
      rating: 0,
      numReviews: 0
    });
  }
  
  next();
});

// Static method to get reviews with pagination
reviewSchema.statics.getReviews = async function(productId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const reviews = await this.find({ product: productId, isActive: true })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
  const total = await this.countDocuments({ product: productId, isActive: true });
  
  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId, helpful = true) {
  const existingIndex = this.helpful.findIndex(h => h.user.toString() === userId);
  
  if (existingIndex > -1) {
    this.helpful[existingIndex].helpful = helpful;
  } else {
    this.helpful.push({ user: userId, helpful });
  }
  
  return this.save();
};

export default mongoose.model('Review', reviewSchema);
