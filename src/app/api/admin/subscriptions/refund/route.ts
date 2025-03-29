import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema for request body validation
const RefundSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID is required"),
  chargeId: z.string().optional(),
  amount: z.number().int().positive().optional(),
  reason: z.string().min(10, "Detailed refund reason is required (min 10 characters)"),
});

export async function POST(request: NextRequest) {
  try {
    // Get the session to authenticate the request
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { paymentIntentId, chargeId, amount, reason } = RefundSchema.parse(body);
    
    // Create an audit log entry before making any changes
    const auditLogId = uuidv4();
    await db.systemLog.create({
      data: {
        id: auditLogId,
        type: 'AUDIT',
        level: 'INFO',
        message: `Admin initiated payment refund`,
        details: JSON.stringify({
          paymentIntentId,
          chargeId,
          amount,
          reason,
          adminId: session.user.id,
          adminEmail: session.user.email,
          timestamp: new Date().toISOString()
        }),
        userId: session.user.id,
        source: 'admin-api',
      }
    });
    
    // First, get payment intent details to verify and get associated customer/charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      await db.systemLog.create({
        data: {
          id: uuidv4(),
          type: 'ERROR',
          level: 'ERROR',
          message: `Refund failed - Payment intent not found`,
          details: JSON.stringify({
            paymentIntentId,
            adminId: session.user.id,
            adminEmail: session.user.email,
            timestamp: new Date().toISOString()
          }),
          userId: session.user.id,
          source: 'admin-api',
        }
      });
      
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }
    
    // Find associated customer and user
    const stripeCustomerId = paymentIntent.customer?.toString();
    let userId = null;
    
    if (stripeCustomerId) {
      const subscription = await db.subscription.findFirst({
        where: { stripeCustomerId },
        select: { userId: true }
      });
      userId = subscription?.userId;
    }
    
    // Process refund
    try {
      // If no charge ID provided, get it from the payment intent
      const refundChargeId = chargeId || paymentIntent.latest_charge?.toString();
      
      if (!refundChargeId) {
        throw new Error('No charge found for this payment intent');
      }
      
      // Create refund
      const refundParams: any = {
        charge: refundChargeId,
        reason: 'requested_by_customer', // Stripe only accepts specific values
        metadata: {
          initiatedBy: session.user.id,
          adminEmail: session.user.email,
          reason: reason.substring(0, 100), // Stripe metadata has size limits
          auditLogId
        }
      };
      
      // If amount specified for partial refund
      if (amount) {
        refundParams.amount = amount;
      }
      
      const refund = await stripe.refunds.create(refundParams);
      
      // Create another log entry for successful refund
      await db.systemLog.create({
        data: {
          id: uuidv4(),
          type: 'AUDIT',
          level: 'INFO',
          message: `Admin successfully processed refund`,
          details: JSON.stringify({
            paymentIntentId,
            chargeId: refundChargeId,
            refundId: refund.id,
            amount: refund.amount,
            status: refund.status,
            currency: refund.currency,
            reason,
            adminId: session.user.id,
            adminEmail: session.user.email,
            timestamp: new Date().toISOString()
          }),
          userId: session.user.id,
          source: 'admin-api',
        }
      });
      
      // Create user activity log if we found the user
      if (userId) {
        await db.userActivityLog.create({
          data: {
            id: uuidv4(),
            userId,
            action: 'PAYMENT_REFUNDED_BY_ADMIN',
            details: JSON.stringify({
              paymentIntentId,
              chargeId: refundChargeId,
              refundId: refund.id,
              amount: refund.amount,
              status: refund.status,
              reason,
              adminId: session.user.id,
              adminEmail: session.user.email,
              timestamp: new Date().toISOString()
            }),
            timestamp: new Date(),
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          id: refund.id,
          amount: refund.amount / 100, // Convert to dollars for display
          currency: refund.currency,
          status: refund.status,
        }
      });
      
    } catch (stripeError: any) {
      console.error('Error processing refund:', stripeError);
      
      // Log the error
      await db.systemLog.create({
        data: {
          id: uuidv4(),
          type: 'ERROR',
          level: 'ERROR',
          message: `Failed to process refund`,
          details: JSON.stringify({
            paymentIntentId,
            chargeId,
            error: stripeError.message,
            adminId: session.user.id,
            adminEmail: session.user.email,
            timestamp: new Date().toISOString()
          }),
          userId: session.user.id,
          source: 'admin-api',
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to process refund',
          details: stripeError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error initiating refund:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 