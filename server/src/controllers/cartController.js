import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price salePrice images countInStock isActive')
      .populate('coupon', 'code name type value');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    // Filter out inactive products and update cart
    const validItems = cart.items.filter(item => 
      item.product && item.product.isActive && item.product.countInStock > 0
    );
    
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }
    
    res.json({
      success: true,
      cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantKey = null } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or unavailable'
      });
    }
    
    // Check stock
    if (product.countInStock < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
    }
    
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    await cart.addItem(productId, quantity, variantKey);
    
    // Populate cart with product details
    cart = await Cart.findById(cart._id)
      .populate('items.product', 'name price salePrice images countInStock')
      .populate('coupon', 'code name type value');
    
    res.json({
      success: true,
      cart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, variantKey = null } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    await cart.updateItemQuantity(productId, quantity, variantKey);
    
    // Populate cart with product details
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price salePrice images countInStock')
      .populate('coupon', 'code name type value');
    
    res.json({
      success: true,
      cart: updatedCart,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, variantKey = null } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    await cart.removeItem(productId, variantKey);
    
    // Populate cart with product details
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price salePrice images countInStock')
      .populate('coupon', 'code name type value');
    
    res.json({
      success: true,
      cart: updatedCart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    await cart.clearCart();
    
    res.json({
      success: true,
      cart,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
// @access  Private
export const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price salePrice');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }
    
    // Validate coupon
    const couponResult = await Coupon.findValidCoupon(
      code, 
      req.user.id, 
      cart.subtotal
    );
    
    if (!couponResult.valid) {
      return res.status(400).json({
        success: false,
        error: couponResult.message
      });
    }
    
    const coupon = couponResult.coupon;
    
    // Calculate discount
    const discount = coupon.calculateDiscount(cart.subtotal);
    
    // Apply coupon to cart
    cart.coupon = coupon._id;
    cart.couponDiscount = discount;
    await cart.save();
    
    // Populate cart with product details
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price salePrice images countInStock')
      .populate('coupon', 'code name type value');
    
    res.json({
      success: true,
      cart: updatedCart,
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/remove-coupon
// @access  Private
export const removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    cart.coupon = null;
    cart.couponDiscount = 0;
    await cart.save();
    
    // Populate cart with product details
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price salePrice images countInStock')
      .populate('coupon', 'code name type value');
    
    res.json({
      success: true,
      cart: updatedCart,
      message: 'Coupon removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shipping method
// @route   PUT /api/cart/shipping
// @access  Private
export const updateShippingMethod = async (req, res, next) => {
  try {
    const { name, price, estimatedDays } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Shipping method name is required'
      });
    }
    
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    cart.shippingMethod = {
      name,
      price: price || 0,
      estimatedDays: estimatedDays || '3-5 business days'
    };
    
    await cart.save();
    
    // Populate cart with product details
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name price salePrice images countInStock')
      .populate('coupon', 'code name type value');
    
    res.json({
      success: true,
      cart: updatedCart,
      message: 'Shipping method updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
