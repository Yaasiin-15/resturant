import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a coupon name'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Please specify coupon type']
  },
  value: {
    type: Number,
    required: [true, 'Please add a discount value'],
    min: [0, 'Value must be positive']
  },
  minAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum amount must be positive']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount must be positive']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  maxUses: {
    type: Number,
    default: null,
    min: [1, 'Maximum uses must be at least 1']
  },
  currentUses: {
    type: Number,
    default: 0
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  userLimit: {
    type: Number,
    default: 1,
    min: [1, 'User limit must be at least 1']
  },
  isFirstTimeOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

// Virtual for is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual for is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate && 
         (!this.maxUses || this.currentUses < this.maxUses);
});

// Method to validate coupon for a user and order
couponSchema.methods.validateForOrder = function(userId, orderAmount, productIds = []) {
  // Check if coupon is valid
  if (!this.isValid) {
    return { valid: false, message: 'Coupon is not valid' };
  }
  
  // Check minimum amount
  if (orderAmount < this.minAmount) {
    return { 
      valid: false, 
      message: `Minimum order amount of $${this.minAmount} required` 
    };
  }
  
  // Check if user has already used this coupon
  const userUsage = this.usedBy.filter(usage => usage.user.toString() === userId);
  if (userUsage.length >= this.userLimit) {
    return { 
      valid: false, 
      message: 'You have already used this coupon' 
    };
  }
  
  // Check if it's first time only and user has previous orders
  if (this.isFirstTimeOnly) {
    // This would need to be checked against actual order history
    // For now, we'll assume it's valid
  }
  
  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (orderAmount * this.value) / 100;
  } else {
    discount = this.value;
  }
  
  // Apply maximum discount limit
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }
  
  // Ensure discount doesn't exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }
  
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Method to use coupon
couponSchema.methods.useCoupon = function(userId) {
  this.currentUses += 1;
  this.usedBy.push({ user: userId });
  return this.save();
};

// Static method to find valid coupon by code
couponSchema.statics.findValidCoupon = async function(code, userId, orderAmount) {
  const coupon = await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true
  }).populate('categories products excludeProducts');
  
  if (!coupon) {
    return { valid: false, message: 'Coupon not found' };
  }
  
  const validation = coupon.validateForOrder(userId, orderAmount);
  if (!validation.valid) {
    return validation;
  }
  
  return { valid: true, coupon };
};

export default mongoose.model('Coupon', couponSchema);
