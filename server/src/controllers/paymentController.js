import { validationResult } from 'express-validator';
import Stripe from 'stripe';
import Order from '../models/Order.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { amount, currency = 'usd', orderId, paymentMethodTypes = ['card'] } = req.body;

    // Validate amount
    if (amount < 50) { // Minimum 50 cents
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 50 cents'
      });
    }

    // Check if order exists and belongs to user
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to pay for this order'
        });
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: paymentMethodTypes,
      metadata: {
        userId: req.user.id,
        orderId: orderId || '',
        userEmail: req.user.email
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Payment intent creation failed'
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        error: 'Payment intent not found'
      });
    }

    // Check if payment intent belongs to user
    if (paymentIntent.metadata.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to confirm this payment'
      });
    }

    // Update order payment status
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.payment.status = paymentIntent.status;
        order.payment.transactionId = paymentIntent.id;
        order.payment.confirmedAt = new Date();
        
        if (paymentIntent.status === 'succeeded') {
          order.status = 'processing';
          await order.updateStatus('processing', null, 'Payment confirmed');
        }
        
        await order.save();
      }
    }

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment confirmation failed'
    });
  }
};

// @desc    Process webhook
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private/Admin
export const processRefund = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (!order.payment.transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Order has no payment transaction'
      });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: order.payment.transactionId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: reason || 'requested_by_customer',
      metadata: {
        orderId: orderId,
        adminId: req.user.id
      }
    });

    // Update order
    order.payment.refunds = order.payment.refunds || [];
    order.payment.refunds.push({
      refundId: refund.id,
      amount: refund.amount / 100,
      reason: refund.reason,
      status: refund.status,
      createdAt: new Date()
    });

    if (refund.status === 'succeeded') {
      order.status = 'refunded';
      await order.updateStatus('refunded', null, 'Payment refunded');
    }

    await order.save();

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Refund processing failed'
    });
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
export const getPaymentMethods = async (req, res) => {
  try {
    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripeCustomerId,
      type: 'card'
    });

    res.json({
      success: true,
      data: paymentMethods.data
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
};

// @desc    Create customer
// @route   POST /api/payments/create-customer
// @access  Private
export const createCustomer = async (req, res) => {
  try {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.name,
      metadata: {
        userId: req.user.id
      }
    });

    // Update user with Stripe customer ID
    req.user.stripeCustomerId = customer.id;
    await req.user.save();

    res.json({
      success: true,
      data: {
        customerId: customer.id
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
};

// Helper functions for webhook handling
const handlePaymentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      order.payment.status = 'completed';
      order.payment.confirmedAt = new Date();
      order.status = 'processing';
      await order.updateStatus('processing', null, 'Payment completed');
      await order.save();
    }
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      order.payment.status = 'failed';
      order.status = 'cancelled';
      await order.updateStatus('cancelled', null, 'Payment failed');
      await order.save();
    }
  }
};

const handleChargeRefunded = async (charge) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
  const orderId = paymentIntent.metadata.orderId;
  
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'refunded';
      await order.updateStatus('refunded', null, 'Payment refunded');
      await order.save();
    }
  }
};
