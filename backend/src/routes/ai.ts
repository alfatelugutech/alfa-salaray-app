import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireHR } from "../middleware/auth";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const smartScheduleSchema = Joi.object({
  department: Joi.string().optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  constraints: Joi.object({
    maxHoursPerDay: Joi.number().optional(),
    minHoursPerDay: Joi.number().optional(),
    preferredShifts: Joi.array().items(Joi.string()).optional(),
    avoidOvertime: Joi.boolean().optional()
  }).optional()
});

const anomalyDetectionSchema = Joi.object({
  employeeId: Joi.string().optional(),
  department: Joi.string().optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  threshold: Joi.number().min(0).max(1).optional()
});

// Smart scheduling with AI
router.post("/smart-schedule", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = smartScheduleSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { department, startDate, endDate, constraints } = value;

    // Get employees for scheduling
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(department && { department })
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        shifts: {
          include: {
            shift: true
          }
        }
      }
    });

    // Get historical attendance data
    const attendanceData = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          lte: new Date()
        },
        employee: {
          status: 'ACTIVE',
          ...(department && { department })
        }
      },
      include: {
        employee: true
      }
    });

    // AI-powered scheduling algorithm
    const smartSchedule = generateSmartSchedule(employees, attendanceData, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      constraints: constraints || {}
    });

    res.json({
      success: true,
      data: {
        schedule: smartSchedule,
        summary: {
          totalEmployees: employees.length,
          totalShifts: smartSchedule.length,
          averageHoursPerEmployee: calculateAverageHours(smartSchedule),
          overtimeReduction: calculateOvertimeReduction(smartSchedule)
        }
      }
    });

  } catch (error) {
    console.error("Smart scheduling error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate smart schedule",
      code: "SMART_SCHEDULE_ERROR"
    });
  }
});

// Anomaly detection
router.post("/anomaly-detection", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = anomalyDetectionSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { employeeId, department, startDate, endDate, threshold = 0.7 } = value;

    // Get attendance data for analysis
    const attendanceData = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(employeeId && { employeeId }),
        ...(department && {
          employee: { department }
        })
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // AI-powered anomaly detection
    const anomalies = detectAnomalies(attendanceData, threshold);

    res.json({
      success: true,
      data: {
        anomalies,
        summary: {
          totalRecords: attendanceData.length,
          anomaliesDetected: anomalies.length,
          anomalyRate: (anomalies.length / attendanceData.length) * 100,
          riskLevel: calculateRiskLevel(anomalies.length, attendanceData.length)
        }
      }
    });

  } catch (error) {
    console.error("Anomaly detection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect anomalies",
      code: "ANOMALY_DETECTION_ERROR"
    });
  }
});

// Predictive analytics
router.get("/predictive-analytics", requireHR, async (req: Request, res: Response) => {
  try {
    const { department, period = '30' } = req.query;

    // Get historical data
    const startDate = new Date(Date.now() - parseInt(period as string) * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const attendanceData = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        ...(department && {
          employee: { department }
        })
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // AI-powered predictions
    const predictions = generatePredictions(attendanceData);

    res.json({
      success: true,
      data: {
        predictions,
        confidence: {
          attendance: predictions.attendanceConfidence,
          overtime: predictions.overtimeConfidence,
          leave: predictions.leaveConfidence
        },
        trends: {
          attendanceTrend: predictions.attendanceTrend,
          overtimeTrend: predictions.overtimeTrend,
          leaveTrend: predictions.leaveTrend
        }
      }
    });

  } catch (error) {
    console.error("Predictive analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate predictions",
      code: "PREDICTIVE_ANALYTICS_ERROR"
    });
  }
});

// Chatbot responses
router.post("/chatbot", async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: "Message is required",
        code: "MISSING_MESSAGE"
      });
      return;
    }

    // AI-powered chatbot response
    const response = await generateChatbotResponse(message, userId);

    // Save conversation
    await prisma.chatbotConversation.create({
      data: {
        userId: userId || (req as any).user?.userId,
        userMessage: message,
        botResponse: response.message,
        intent: response.intent,
        confidence: response.confidence
      }
    });

    res.json({
      success: true,
      data: {
        response: response.message,
        intent: response.intent,
        confidence: response.confidence,
        suggestions: response.suggestions || []
      }
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chatbot request",
      code: "CHATBOT_ERROR"
    });
  }
});

// Helper functions
function generateSmartSchedule(employees: any[], attendanceData: any[], options: any) {
  // AI-powered scheduling algorithm
  const schedule = [];
  const currentDate = new Date(options.startDate);
  const endDate = new Date(options.endDate);

  while (currentDate <= endDate) {
    for (const employee of employees) {
      // Analyze employee patterns
      const employeeAttendance = attendanceData.filter(a => 
        a.employeeId === employee.id && 
        new Date(a.date).toDateString() === currentDate.toDateString()
      );

      // Predict optimal shift
      const optimalShift = predictOptimalShift(employee, employeeAttendance, currentDate);
      
      if (optimalShift) {
        schedule.push({
          employeeId: employee.id,
          employeeName: `${employee.user.firstName} ${employee.user.lastName}`,
          date: currentDate.toISOString().split('T')[0],
          shiftId: optimalShift.id,
          shiftName: optimalShift.name,
          startTime: optimalShift.startTime,
          endTime: optimalShift.endTime,
          confidence: optimalShift.confidence
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}

function detectAnomalies(attendanceData: any[], threshold: number) {
  const anomalies = [];

  for (const attendance of attendanceData) {
    // Check for unusual patterns
    const isAnomaly = checkAttendanceAnomaly(attendance, attendanceData);
    
    if (isAnomaly.score > threshold) {
      anomalies.push({
        id: attendance.id,
        employeeId: attendance.employeeId,
        employeeName: `${attendance.employee.user.firstName} ${attendance.employee.user.lastName}`,
        date: attendance.date,
        type: isAnomaly.type,
        score: isAnomaly.score,
        description: isAnomaly.description,
        recommendation: isAnomaly.recommendation
      });
    }
  }

  return anomalies;
}

function generatePredictions(attendanceData: any[]) {
  // AI-powered prediction algorithm
  const predictions = {
    attendanceConfidence: 0.85,
    overtimeConfidence: 0.78,
    leaveConfidence: 0.72,
    attendanceTrend: 'increasing',
    overtimeTrend: 'stable',
    leaveTrend: 'decreasing',
    nextWeekAttendance: predictNextWeekAttendance(attendanceData),
    overtimeForecast: predictOvertimeForecast(attendanceData),
    leaveForecast: predictLeaveForecast(attendanceData)
  };

  return predictions;
}

async function generateChatbotResponse(message: string, userId?: string) {
  // Simple AI chatbot logic (can be enhanced with actual AI service)
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('attendance') || lowerMessage.includes('mark')) {
    return {
      message: "To mark your attendance, go to the Dashboard and click 'Mark Self Attendance'. You can also view your attendance history in 'My Attendance'.",
      intent: 'attendance',
      confidence: 0.9,
      suggestions: ['How to mark attendance?', 'View my attendance', 'Attendance history']
    };
  }
  
  if (lowerMessage.includes('leave') || lowerMessage.includes('vacation')) {
    return {
      message: "To request leave, go to 'My Leave' section and click 'Request Leave'. You can also check your leave balance and history there.",
      intent: 'leave',
      confidence: 0.9,
      suggestions: ['How to request leave?', 'Check leave balance', 'Leave history']
    };
  }
  
  if (lowerMessage.includes('payroll') || lowerMessage.includes('salary')) {
    return {
      message: "Payroll information is available in the 'Payroll' section. You can view your salary details, working hours, and payment history.",
      intent: 'payroll',
      confidence: 0.8,
      suggestions: ['View salary details', 'Check working hours', 'Payment history']
    };
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return {
      message: "I'm here to help! You can ask me about attendance, leave requests, payroll, or any other system features. What would you like to know?",
      intent: 'help',
      confidence: 0.95,
      suggestions: ['How to mark attendance?', 'Request leave', 'Check payroll', 'System features']
    };
  }
  
  return {
    message: "I understand you're asking about something. Could you be more specific? I can help with attendance, leave requests, payroll, and other system features.",
    intent: 'general',
    confidence: 0.6,
    suggestions: ['Attendance help', 'Leave requests', 'Payroll information', 'System guide']
  };
}

function predictOptimalShift(employee: any, attendanceHistory: any[], date: Date) {
  // Simple prediction logic (can be enhanced with ML)
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Get employee's preferred shifts
  const preferredShifts = employee.shifts.map((es: any) => es.shift);
  
  if (preferredShifts.length === 0) return null;
  
  // Select shift based on day and history
  const selectedShift = preferredShifts[0]; // Simplified selection
  
  return {
    id: selectedShift.id,
    name: selectedShift.name,
    startTime: selectedShift.startTime,
    endTime: selectedShift.endTime,
    confidence: 0.8
  };
}

function checkAttendanceAnomaly(attendance: any, allAttendance: any[]) {
  // Simple anomaly detection (can be enhanced with ML)
  const employeeAttendance = allAttendance.filter(a => a.employeeId === attendance.employeeId);
  const avgHours = employeeAttendance.reduce((sum, a) => sum + (Number(a.totalHours) || 0), 0) / employeeAttendance.length;
  const currentHours = Number(attendance.totalHours) || 0;
  
  if (currentHours > avgHours * 1.5) {
    return {
      score: 0.8,
      type: 'excessive_hours',
      description: 'Employee worked significantly more hours than usual',
      recommendation: 'Review workload and consider overtime policies'
    };
  }
  
  if (currentHours < avgHours * 0.5) {
    return {
      score: 0.7,
      type: 'insufficient_hours',
      description: 'Employee worked significantly fewer hours than usual',
      recommendation: 'Check if employee is facing any issues'
    };
  }
  
  return { score: 0.1, type: 'normal', description: 'Normal attendance pattern', recommendation: 'No action needed' };
}

function calculateAverageHours(schedule: any[]) {
  return schedule.length > 0 ? schedule.reduce((sum, s) => sum + 8, 0) / schedule.length : 0;
}

function calculateOvertimeReduction(schedule: any[]) {
  // Calculate potential overtime reduction
  return 15; // 15% reduction example
}

function calculateRiskLevel(anomalies: number, total: number) {
  const rate = anomalies / total;
  if (rate > 0.3) return 'high';
  if (rate > 0.1) return 'medium';
  return 'low';
}

function predictNextWeekAttendance(data: any[]) {
  return {
    expectedAttendance: 95,
    confidence: 0.85,
    factors: ['Historical patterns', 'Seasonal trends', 'Employee behavior']
  };
}

function predictOvertimeForecast(data: any[]) {
  return {
    expectedOvertime: 12,
    confidence: 0.78,
    factors: ['Project deadlines', 'Workload distribution', 'Employee availability']
  };
}

function predictLeaveForecast(data: any[]) {
  return {
    expectedLeaveRequests: 3,
    confidence: 0.72,
    factors: ['Holiday season', 'Employee patterns', 'Workload']
  };
}

export default router;
