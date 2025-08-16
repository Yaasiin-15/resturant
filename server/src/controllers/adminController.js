import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';

// @desc    Get dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private/Admin
export const getDashboardMetrics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalCoupons = await Coupon.countDocuments();

    // Get recent activity counts
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    const newOrders = await Order.countDocuments({ createdAt: { $gte: startDate } });
    const newProducts = await Product.countDocuments({ createdAt: { $gte: startDate } });
    const newReviews = await Review.countDocuments({ createdAt: { $gte: startDate } });

    // Get revenue metrics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totals.total' },
          averageOrderValue: { $avg: '$totals.total' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Get order status breakdown
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'delivered'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          totalRevenue: 1,
          image: { $arrayElemAt: ['$product.images', 0] }
        }
      }
    ]);

    // Get user growth over time
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get low stock products
    const lowStockProducts = await Product.find({ countInStock: { $lt: 10 } })
      .select('name countInStock images price')
      .limit(10)
      .sort({ countInStock: 1 });

    const metrics = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalReviews,
        totalCoupons
      },
      recentActivity: {
        newUsers,
        newOrders,
        newProducts,
        newReviews
      },
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0,
        orderCount: 0
      },
      orderStatus: orderStatusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      topProducts,
      userGrowth,
      lowStockProducts
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user management data
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get inventory management data
// @route   GET /api/admin/inventory
// @access  Private/Admin
export const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, stockStatus, sortBy = 'name', sortOrder = 'asc' } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (stockStatus) {
      switch (stockStatus) {
        case 'in_stock':
          query.countInStock = { $gt: 0 };
          break;
        case 'low_stock':
          query.countInStock = { $gt: 0, $lt: 10 };
          break;
        case 'out_of_stock':
          query.countInStock = 0;
          break;
      }
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(query);

    // Get inventory summary
    const inventorySummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$countInStock' },
          averageStock: { $avg: '$countInStock' },
          lowStockCount: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$countInStock', 0] }, { $lt: ['$countInStock', 10] }] }, 1, 0]
            }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$countInStock', 0] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: products,
      summary: inventorySummary[0] || {
        totalProducts: 0,
        totalStock: 0,
        averageStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update product stock
// @route   PUT /api/admin/inventory/:id/stock
// @access  Private/Admin
export const updateProductStock = async (req, res) => {
  try {
    const { countInStock } = req.body;

    if (countInStock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock count cannot be negative'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { countInStock },
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get coupon management data
// @route   GET /api/admin/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      switch (status) {
        case 'active':
          query.endDate = { $gt: new Date() };
          query.$expr = { $lt: ['$currentUses', '$maxUses'] };
          break;
        case 'expired':
          query.endDate = { $lt: new Date() };
          break;
        case 'maxed_out':
          query.$expr = { $gte: ['$currentUses', '$maxUses'] };
          break;
      }
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const coupons = await Coupon.find(query)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Coupon.countDocuments(query);

    res.json({
      success: true,
      data: coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
  try {
    const { period = '30', type = 'revenue' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let analytics = {};

    switch (type) {
      case 'revenue':
        analytics = await getRevenueAnalytics(startDate);
        break;
      case 'orders':
        analytics = await getOrderAnalytics(startDate);
        break;
      case 'users':
        analytics = await getUserAnalytics(startDate);
        break;
      case 'products':
        analytics = await getProductAnalytics(startDate);
        break;
      default:
        analytics = await getRevenueAnalytics(startDate);
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper functions for analytics
const getRevenueAnalytics = async (startDate) => {
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['completed', 'delivered'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$totals.total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return {
    type: 'revenue',
    data: dailyRevenue.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders
    }))
  };
};

const getOrderAnalytics = async (startDate) => {
  const dailyOrders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        orders: { $sum: 1 },
        totalValue: { $sum: '$totals.total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return {
    type: 'orders',
    data: dailyOrders.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      orders: item.orders,
      totalValue: item.totalValue
    }))
  };
};

const getUserAnalytics = async (startDate) => {
  const dailyUsers = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        users: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return {
    type: 'users',
    data: dailyUsers.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      users: item.users
    }))
  };
};

const getProductAnalytics = async (startDate) => {
  const productSales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['completed', 'delivered'] }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        totalSold: 1,
        totalRevenue: 1
      }
    }
  ]);

  return {
    type: 'products',
    data: productSales
  };
};
