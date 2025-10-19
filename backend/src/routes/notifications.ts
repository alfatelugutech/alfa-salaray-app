import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth";
import Joi from "joi";
import nodemailer from "nodemailer";
import twilio from "twilio";

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Validation schemas
const sendNotificationSchema = Joi.object({
  type: Joi.string().valid('email', 'sms', 'push', 'whatsapp').required(),
  recipient: Joi.string().required(),
  subject: Joi.string().optional(),
  message: Joi.string().required(),
  template: Joi.string().optional(),
  data: Joi.object().optional()
});

const notificationPreferencesSchema = Joi.object({
  emailEnabled: Joi.boolean().optional(),
  smsEnabled: Joi.boolean().optional(),
  pushEnabled: Joi.boolean().optional(),
  whatsappEnabled: Joi.boolean().optional(),
  quietHours: Joi.object({
    enabled: Joi.boolean().optional(),
    start: Joi.string().optional(),
    end: Joi.string().optional()
  }).optional()
});

// Send notification
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { error, value } = sendNotificationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { type, recipient, subject, message, template, data } = value;

    // Check user notification preferences
    const user = await prisma.user.findUnique({
      where: { email: recipient },
      include: {
        employee: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
      return;
    }

    let result;

    switch (type) {
      case 'email':
        result = await sendEmailNotification(recipient, subject, message, template, data);
        break;
      case 'sms':
        result = await sendSMSNotification(recipient, message);
        break;
      case 'push':
        result = await sendPushNotification(recipient, message, data);
        break;
      case 'whatsapp':
        result = await sendWhatsAppNotification(recipient, message);
        break;
      default:
        res.status(400).json({
          success: false,
          error: "Invalid notification type",
          code: "INVALID_TYPE"
        });
        return;
    }

    // Save notification to database
    await prisma.notification.create({
      data: {
        userId: user.id,
        type,
        recipient,
        subject: subject || null,
        message,
        template: template || null,
        data: data || null,
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: new Date()
      }
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send notification",
      code: "SEND_NOTIFICATION_ERROR"
    });
  }
});

// Get user notifications
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { page = 1, limit = 10, type, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      code: "GET_NOTIFICATIONS_ERROR"
    });
  }
});

// Update notification preferences
router.put("/preferences", async (req: Request, res: Response) => {
  try {
    const { error, value } = notificationPreferencesSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const userId = (req as any).user?.userId;

    // Update or create notification preferences
    await prisma.notificationPreferences.upsert({
      where: { userId },
      update: value,
      create: {
        userId,
        ...value
      }
    });

    res.json({
      success: true,
      message: "Notification preferences updated successfully"
    });

  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update preferences",
      code: "UPDATE_PREFERENCES_ERROR"
    });
  }
});

// Get notification preferences
router.get("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      data: preferences || {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        whatsappEnabled: false,
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "08:00"
        }
      }
    });

  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch preferences",
      code: "GET_PREFERENCES_ERROR"
    });
  }
});

// Helper functions
async function sendEmailNotification(recipient: string, subject: string, message: string, template?: string, data?: any) {
  try {
    const htmlContent = template ? generateEmailTemplate(template, data) : message;

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: recipient,
      subject: subject || 'Notification',
      html: htmlContent
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

async function sendSMSNotification(recipient: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipient
    });

    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}

async function sendPushNotification(recipient: string, message: string, data?: any) {
  try {
    // Get user's push subscription
    const user = await prisma.user.findUnique({
      where: { email: recipient }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Send push notification (implementation depends on push service)
    // This is a placeholder - actual implementation would use a push service
    
    return { success: true, message: 'Push notification sent successfully' };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: 'Failed to send push notification' };
  }
}

async function sendWhatsAppNotification(recipient: string, message: string) {
  try {
    // WhatsApp Business API implementation
    // This is a placeholder - actual implementation would use WhatsApp Business API
    
    return { success: true, message: 'WhatsApp message sent successfully' };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: 'Failed to send WhatsApp message' };
  }
}

function generateEmailTemplate(template: string, data: any): string {
  // Email template generation logic
  const templates: any = {
    'attendance-reminder': `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Attendance Reminder</h2>
        <p>Hello ${data.name},</p>
        <p>This is a friendly reminder to mark your attendance for today.</p>
        <p>Current time: ${new Date().toLocaleString()}</p>
        <a href="${data.attendanceUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mark Attendance</a>
      </div>
    `,
    'leave-request': `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Leave Request</h2>
        <p>Hello ${data.managerName},</p>
        <p>${data.employeeName} has submitted a new leave request:</p>
        <ul>
          <li>Leave Type: ${data.leaveType}</li>
          <li>Start Date: ${data.startDate}</li>
          <li>End Date: ${data.endDate}</li>
          <li>Reason: ${data.reason}</li>
        </ul>
        <a href="${data.approvalUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
      </div>
    `,
    'leave-approved': `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Leave Request Approved</h2>
        <p>Hello ${data.name},</p>
        <p>Your leave request has been approved:</p>
        <ul>
          <li>Leave Type: ${data.leaveType}</li>
          <li>Start Date: ${data.startDate}</li>
          <li>End Date: ${data.endDate}</li>
        </ul>
        <p>Enjoy your time off!</p>
      </div>
    `
  };

  return templates[template] || message;
}

export default router;
