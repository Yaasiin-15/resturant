import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  variantKey: String,
  image: String
});

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'flutterwave']
  },
  intentId: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  transactionId: String,
  refundId: String
});

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  payment: paymentSchema,
  totals: {
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  shippingMethod: {
    name: String,
    price: Number,
    estimatedDays: String,
    trackingNumber: String,
    carrier: String
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  notes: String,
  timeline: [timelineSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of orders for today
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: today }
    });
    
    this.orderNumber = `ORD${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
    
    // Add initial timeline entry
    this.timeline.push({
      status: 'pending',
      message: 'Order created'
    });
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, message) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    message: message || `Order status updated to ${newStatus}`
  });
  return this.save();
};

// Method to add tracking information
orderSchema.methods.addTracking = function(trackingNumber, carrier) {
  this.shippingMethod.trackingNumber = trackingNumber;
  this.shippingMethod.carrier = carrier;
  this.timeline.push({
    status: 'shipped',
    message: `Tracking number added: ${trackingNumber} (${carrier})`
  });
  return this.save();
};

// Static method to get orders with pagination
orderSchema.statics.getOrders = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const orders = await this.find({ user: userId })
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
  const total = await this.countDocuments({ user: userId });
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export default mongoose.model('Order', orderSchema);
