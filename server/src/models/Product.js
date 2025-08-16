import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  options: [{
    key: String,
    value: String,
    price: Number,
    stock: {
      type: Number,
      default: 0
    }
  }]
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please add a category']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [variantSchema],
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be positive']
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price must be positive']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price must be positive']
  },
  attributes: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    color: String,
    material: String,
    size: String
  },
  countInStock: {
    type: Number,
    required: [true, 'Please add stock count'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  metaTitle: String,
  metaDescription: String,
  sku: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.salePrice && this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for current price
productSchema.virtual('currentPrice').get(function() {
  return this.salePrice || this.price;
});

// Pre-save middleware to generate slug if not provided
productSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Static method to get products with pagination and filters
productSchema.statics.getProducts = async function(filters = {}, page = 1, limit = 12) {
  const skip = (page - 1) * limit;
  
  let query = this.find({ isActive: true });
  
  // Apply filters
  if (filters.category) {
    query = query.where('category', filters.category);
  }
  
  if (filters.brand) {
    query = query.where('brand', filters.brand);
  }
  
  if (filters.minPrice || filters.maxPrice) {
    const priceFilter = {};
    if (filters.minPrice) priceFilter.$gte = filters.minPrice;
    if (filters.maxPrice) priceFilter.$lte = filters.maxPrice;
    query = query.where('price', priceFilter);
  }
  
  if (filters.search) {
    query = query.find({ $text: { $search: filters.search } });
  }
  
  // Apply sorting
  if (filters.sort) {
    const sortOptions = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'name-asc': { name: 1 },
      'name-desc': { name: -1 },
      'rating-desc': { rating: -1 },
      'newest': { createdAt: -1 }
    };
    query = query.sort(sortOptions[filters.sort] || { createdAt: -1 });
  } else {
    query = query.sort({ createdAt: -1 });
  }
  
  const products = await query
    .populate('category', 'name slug')
    .skip(skip)
    .limit(limit)
    .lean();
    
  const total = await this.countDocuments(query.getQuery());
  
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export default mongoose.model('Product', productSchema);
