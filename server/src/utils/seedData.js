import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedCategories = async () => {
  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest electronic gadgets and devices',
      image: {
        url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
        alt: 'Electronics'
      }
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel for all ages',
      image: {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        alt: 'Clothing'
      }
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Everything for your home and garden',
      image: {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        alt: 'Home & Garden'
      }
    },
    {
      name: 'Books',
      slug: 'books',
      description: 'Books for all ages and interests',
      image: {
        url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
        alt: 'Books'
      }
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports equipment and accessories',
      image: {
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        alt: 'Sports'
      }
    }
  ];

  for (const category of categories) {
    await Category.findOneAndUpdate(
      { slug: category.slug },
      category,
      { upsert: true, new: true }
    );
  }

  console.log('✅ Categories seeded');
};

const seedProducts = async () => {
  const categories = await Category.find();
  
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'High-quality wireless headphones with noise cancellation and long battery life. Perfect for music lovers and professionals.',
      brand: 'TechSound',
      category: categories.find(c => c.slug === 'electronics')._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          alt: 'Wireless Bluetooth Headphones',
          isPrimary: true
        }
      ],
      price: 129.99,
      salePrice: 99.99,
      countInStock: 50,
      rating: 4.5,
      numReviews: 128,
      isFeatured: true,
      attributes: {
        weight: 0.25,
        color: 'Black',
        material: 'Plastic, Metal'
      }
    },
    {
      name: 'Smartphone Case',
      slug: 'smartphone-case',
      description: 'Durable and stylish smartphone case with shock absorption and wireless charging compatibility.',
      brand: 'PhoneGuard',
      category: categories.find(c => c.slug === 'electronics')._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1603313011628-3d5b5b5b5b5b?w=400',
          alt: 'Smartphone Case',
          isPrimary: true
        }
      ],
      price: 24.99,
      countInStock: 100,
      rating: 4.2,
      numReviews: 89,
      attributes: {
        weight: 0.1,
        color: 'Clear',
        material: 'Silicone'
      }
    },
    {
      name: 'Cotton T-Shirt',
      slug: 'cotton-t-shirt',
      description: 'Comfortable and breathable cotton t-shirt available in multiple colors and sizes.',
      brand: 'FashionCo',
      category: categories.find(c => c.slug === 'clothing')._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          alt: 'Cotton T-Shirt',
          isPrimary: true
        }
      ],
      price: 19.99,
      countInStock: 200,
      rating: 4.0,
      numReviews: 156,
      variants: [
        {
          name: 'Size',
          options: [
            { key: 'S', value: 'Small', price: 19.99, stock: 50 },
            { key: 'M', value: 'Medium', price: 19.99, stock: 50 },
            { key: 'L', value: 'Large', price: 19.99, stock: 50 },
            { key: 'XL', value: 'X-Large', price: 19.99, stock: 50 }
          ]
        },
        {
          name: 'Color',
          options: [
            { key: 'BLACK', value: 'Black', price: 19.99, stock: 50 },
            { key: 'WHITE', value: 'White', price: 19.99, stock: 50 },
            { key: 'BLUE', value: 'Blue', price: 19.99, stock: 50 },
            { key: 'RED', value: 'Red', price: 19.99, stock: 50 }
          ]
        }
      ],
      attributes: {
        weight: 0.2,
        color: 'Multiple',
        material: '100% Cotton'
      }
    },
    {
      name: 'Garden Plant Pot',
      slug: 'garden-plant-pot',
      description: 'Beautiful ceramic plant pot perfect for indoor and outdoor plants. Available in various sizes.',
      brand: 'GardenEssentials',
      category: categories.find(c => c.slug === 'home-garden')._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
          alt: 'Garden Plant Pot',
          isPrimary: true
        }
      ],
      price: 34.99,
      countInStock: 75,
      rating: 4.3,
      numReviews: 67,
      attributes: {
        weight: 1.5,
        color: 'Terracotta',
        material: 'Ceramic'
      }
    },
    {
      name: 'Programming Book',
      slug: 'programming-book',
      description: 'Comprehensive guide to modern programming practices and techniques.',
      brand: 'TechBooks',
      category: categories.find(c => c.slug === 'books')._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
          alt: 'Programming Book',
          isPrimary: true
        }
      ],
      price: 49.99,
      salePrice: 39.99,
      countInStock: 30,
      rating: 4.7,
      numReviews: 234,
      isFeatured: true,
      attributes: {
        weight: 0.8,
        color: 'Blue',
        material: 'Paper'
      }
    },
    {
      name: 'Yoga Mat',
      slug: 'yoga-mat',
      description: 'Non-slip yoga mat perfect for yoga, pilates, and other fitness activities.',
      brand: 'FitLife',
      category: categories.find(c => c.slug === 'sports')._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
          alt: 'Yoga Mat',
          isPrimary: true
        }
      ],
      price: 29.99,
      countInStock: 60,
      rating: 4.4,
      numReviews: 98,
      attributes: {
        weight: 1.2,
        color: 'Purple',
        material: 'PVC'
      }
    }
  ];

  for (const product of products) {
    await Product.findOneAndUpdate(
      { slug: product.slug },
      product,
      { upsert: true, new: true }
    );
  }

  console.log('✅ Products seeded');
};

const seedCoupons = async () => {
  const coupons = [
    {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off your first order',
      type: 'percentage',
      value: 10,
      minAmount: 50,
      maxDiscount: 25,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxUses: 1000
    },
    {
      code: 'SAVE20',
      name: 'Save $20',
      description: '$20 off orders over $100',
      type: 'fixed',
      value: 20,
      minAmount: 100,
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      maxUses: 500
    },
    {
      code: 'FREESHIP',
      name: 'Free Shipping',
      description: 'Free shipping on all orders',
      type: 'fixed',
      value: 10,
      minAmount: 75,
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      maxUses: 2000
    }
  ];

  for (const coupon of coupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      coupon,
      { upsert: true, new: true }
    );
  }

  console.log('✅ Coupons seeded');
};

const seedAdminUser = async () => {
  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  };

  await User.findOneAndUpdate(
    { email: adminUser.email },
    adminUser,
    { upsert: true, new: true }
  );

  console.log('✅ Admin user seeded (email: admin@example.com, password: admin123)');
};

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    await seedCategories();
    await seedProducts();
    await seedCoupons();
    await seedAdminUser();
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}
