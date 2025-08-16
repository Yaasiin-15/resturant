import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  variantKey: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses',
    default: null
  },
  billingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses',
    default: null
  },
  shippingMethod: {
    name: String,
    price: {
      type: Number,
      default: 0
    },
    estimatedDays: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
cartSchema.index({ user: 1 });

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
});

// Virtual for shipping cost
cartSchema.virtual('shippingCost').get(function() {
  return this.shippingMethod?.price || 0;
});

// Virtual for total
cartSchema.virtual('total').get(function() {
  return this.subtotal + this.shippingCost - this.couponDiscount;
});

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, variantKey = null) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.countInStock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  const price = product.salePrice || product.price;
  
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId && item.variantKey === variantKey
  );
  
  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    if (newQuantity > product.countInStock) {
      throw new Error('Insufficient stock');
    }
    this.items[existingItemIndex].quantity = newQuantity;
    this.items[existingItemIndex].price = price; // Update price in case it changed
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      variantKey,
      price
    });
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function(productId, variantKey = null) {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId && item.variantKey === variantKey)
  );
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity, variantKey = null) {
  const item = this.items.find(item => 
    item.product.toString() === productId && item.variantKey === variantKey
  );
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    return this.removeItem(productId, variantKey);
  }
  
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (product.countInStock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  item.quantity = quantity;
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.coupon = null;
  this.couponDiscount = 0;
  return this.save();
};

export default mongoose.model('Cart', cartSchema);
