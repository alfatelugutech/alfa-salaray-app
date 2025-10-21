import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireHR } from "../middleware/auth";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Test route without authentication
router.get("/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Attendance service is working",
    timestamp: new Date().toISOString()
  });
});

// Smart productivity metrics endpoint
router.get('/analytics/productivity', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID required",
        code: "EMPLOYEE_ID_REQUIRED"
      });
    }

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setDate(start.getDate() - 30);
    const end = endDate ? new Date(endDate as string) : new Date();

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId as string,
        date: { gte: start, lte: end },
        checkIn: { not: null },
        checkOut: { not: null }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate productivity metrics
    const totalWorkingHours = attendances.reduce((sum, att) => sum + Number(att.totalHours || 0), 0);
    const totalOvertimeHours = attendances.reduce((sum, att) => sum + Number(att.overtimeHours || 0), 0);
    const averageWorkingHours = attendances.length > 0 ? totalWorkingHours / attendances.length : 0;
    
    // Calculate efficiency score (based on consistent working hours)
    const efficiencyScore = calculateEfficiencyScore(attendances);
    
    // Calculate punctuality score
    const punctualityScore = calculatePunctualityScore(attendances);
    
    // Calculate work-life balance (based on overtime patterns)
    const workLifeBalance = calculateWorkLifeBalance(attendances);

    res.json({
      success: true,
      data: {
        averageWorkingHours: Math.round(averageWorkingHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        efficiencyScore,
        punctualityScore,
        workLifeBalance
      }
    });

  } catch (error) {
    console.error('Productivity analytics error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate productivity metrics",
      code: "PRODUCTIVITY_ERROR"
    });
  }
});

// Smart predictions endpoint
router.get('/analytics/predictions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID required",
        code: "EMPLOYEE_ID_REQUIRED"
      });
    }

    // Get last 30 days of data for predictions
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const end = new Date();

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId as string,
        date: { gte: start, lte: end }
      },
      orderBy: { date: 'desc' }
    });

    // Generate predictions
    const predictions = generateSmartPredictions(attendances);

    res.json({
      success: true,
      data: predictions
    });

  } catch (error) {
    console.error('Predictions error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate predictions",
      code: "PREDICTIONS_ERROR"
    });
  }
});

// Team analytics endpoint
router.get('/analytics/team', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date();
    start.setDate(start.getDate() - 30);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all employees and their attendance
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { name: true } },
        attendances: {
          where: { date: { gte: start, lte: end } }
        }
      }
    });

    // Calculate team performance
    const teamPerformance = calculateTeamPerformance(employees);
    const departmentComparison = calculateDepartmentComparison(employees);

    res.json({
      success: true,
      data: {
        teamPerformance,
        departmentComparison
      }
    });

  } catch (error) {
    console.error('Team analytics error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate team analytics",
      code: "TEAM_ANALYTICS_ERROR"
    });
  }
});

// Smart notifications endpoint
router.get('/analytics/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const notifications = await generateSmartNotifications();
    
    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate notifications",
      code: "NOTIFICATIONS_ERROR"
    });
  }
});

// Smart analytics endpoint
router.get('/analytics/smart-insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID required",
        code: "EMPLOYEE_ID_REQUIRED"
      });
    }

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get attendance data
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId as string,
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate smart insights
    const totalDays = attendances.length;
    const presentDays = attendances.filter(att => att.status === 'PRESENT').length;
    const lateDays = attendances.filter(att => att.status === 'LATE').length;
    const absentDays = attendances.filter(att => att.status === 'ABSENT').length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Smart pattern analysis
    const patterns = {
      lateArrivals: lateDays,
      perfectAttendance: absentDays === 0 && lateDays === 0,
      consistency: calculateConsistency(attendances),
      trends: analyzeTrends(attendances)
    };

    // Generate smart recommendations
    const recommendations = generateSmartRecommendations(attendanceRate, patterns);

    res.json({
      success: true,
      data: {
        insights: {
          totalDays,
          presentDays,
          lateDays,
          absentDays,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        },
        patterns,
        recommendations,
        performance: {
          level: attendanceRate >= 95 ? 'EXCELLENT' : 
                 attendanceRate >= 85 ? 'GOOD' : 
                 attendanceRate >= 70 ? 'NEEDS_IMPROVEMENT' : 'POOR',
          message: getPerformanceMessage(attendanceRate)
        }
      }
    });

  } catch (error) {
    console.error('Smart analytics error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to generate smart insights",
      code: "ANALYTICS_ERROR"
    });
  }
});

// Helper functions for smart analytics
function calculateConsistency(attendances: any[]): number {
  if (attendances.length < 2) return 100;
  
  const checkInTimes = attendances
    .filter(att => att.checkIn)
    .map(att => new Date(att.checkIn).getHours() * 60 + new Date(att.checkIn).getMinutes());
  
  if (checkInTimes.length < 2) return 100;
  
  const avgTime = checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length;
  const variance = checkInTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / checkInTimes.length;
  const consistency = Math.max(0, 100 - (Math.sqrt(variance) / 60) * 10); // Convert to percentage
  
  return Math.round(consistency);
}

function analyzeTrends(attendances: any[]): any {
  if (attendances.length < 7) return { trend: 'INSUFFICIENT_DATA' };
  
  const recentWeek = attendances.slice(0, 7);
  const previousWeek = attendances.slice(7, 14);
  
  const recentPresent = recentWeek.filter(att => att.status === 'PRESENT').length;
  const previousPresent = previousWeek.filter(att => att.status === 'PRESENT').length;
  
  if (recentPresent > previousPresent) return { trend: 'IMPROVING', change: recentPresent - previousPresent };
  if (recentPresent < previousPresent) return { trend: 'DECLINING', change: previousPresent - recentPresent };
  return { trend: 'STABLE', change: 0 };
}

function generateSmartRecommendations(attendanceRate: number, patterns: any): string[] {
  const recommendations: string[] = [];
  
  if (attendanceRate < 70) {
    recommendations.push('🚨 Consider discussing attendance concerns with your manager');
  } else if (attendanceRate < 85) {
    recommendations.push('⚠️ Focus on consistent daily attendance');
  } else if (attendanceRate >= 95) {
    recommendations.push('🌟 Excellent attendance! Keep up the great work');
  }
  
  if (patterns.lateArrivals > 0) {
    recommendations.push('⏰ Consider adjusting your morning routine to avoid late arrivals');
  }
  
  if (patterns.consistency < 70) {
    recommendations.push('📅 Try to maintain more consistent check-in times');
  }
  
  if (patterns.trends.trend === 'DECLINING') {
    recommendations.push('📉 Your attendance has been declining recently - consider addressing any issues');
  }
  
  return recommendations;
}

function getPerformanceMessage(attendanceRate: number): string {
  if (attendanceRate >= 95) return '🌟 Excellent attendance record!';
  if (attendanceRate >= 85) return '👍 Good attendance performance';
  if (attendanceRate >= 70) return '⚠️ Attendance needs improvement';
  return '🚨 Poor attendance record';
}

// Helper functions for smart analytics
function calculateEfficiencyScore(attendances: any[]): number {
  if (attendances.length === 0) return 0;
  
  const workingHours = attendances.map(att => att.totalHours || 0);
  const avgHours = workingHours.reduce((a, b) => a + b, 0) / workingHours.length;
  const variance = workingHours.reduce((sum, hours) => sum + Math.pow(hours - avgHours, 2), 0) / workingHours.length;
  
  // Higher score for consistent working hours (lower variance)
  const consistencyScore = Math.max(0, 100 - (Math.sqrt(variance) * 10));
  return Math.round(consistencyScore);
}

function calculatePunctualityScore(attendances: any[]): number {
  if (attendances.length === 0) return 0;
  
  const onTimeCount = attendances.filter(att => att.status === 'PRESENT').length;
  const totalCount = attendances.length;
  
  return Math.round((onTimeCount / totalCount) * 100);
}

function calculateWorkLifeBalance(attendances: any[]): number {
  if (attendances.length === 0) return 100;
  
  const overtimeDays = attendances.filter(att => (att.overtimeHours || 0) > 0).length;
  const totalDays = attendances.length;
  const overtimeRatio = overtimeDays / totalDays;
  
  // Higher score for better work-life balance (less overtime)
  return Math.round((1 - overtimeRatio) * 100);
}

function generateSmartPredictions(attendances: any[]): any {
  if (attendances.length < 7) {
    return {
      nextWeekPrediction: {
        expectedAttendance: 5,
        confidence: 50,
        riskFactors: ['Insufficient data for accurate prediction']
      },
      performanceForecast: {
        trend: 'STABLE',
        projectedScore: 75
      },
      recommendations: ['More data needed for accurate predictions']
    };
  }
  
  const recentWeek = attendances.slice(0, 7);
  const presentDays = recentWeek.filter(att => att.status === 'PRESENT').length;
  
  // Simple prediction based on recent performance
  const expectedAttendance = Math.min(5, Math.max(0, presentDays));
  const confidence = Math.min(95, 50 + (presentDays * 8));
  
  const riskFactors: string[] = [];
  if (presentDays < 4) riskFactors.push('Low recent attendance');
  if (recentWeek.some(att => att.status === 'LATE')) riskFactors.push('Punctuality concerns');
  
  const trend = presentDays >= 5 ? 'UP' : presentDays <= 3 ? 'DOWN' : 'STABLE';
  const projectedScore = Math.min(100, 60 + (presentDays * 8));
  
  const recommendations: string[] = [];
  if (presentDays < 4) recommendations.push('Focus on consistent daily attendance');
  if (recentWeek.some(att => att.status === 'LATE')) recommendations.push('Improve punctuality');
  if (presentDays >= 5) recommendations.push('Maintain excellent attendance');
  
  return {
    nextWeekPrediction: {
      expectedAttendance,
      confidence,
      riskFactors
    },
    performanceForecast: {
      trend,
      projectedScore
    },
    recommendations
  };
}

function calculateTeamPerformance(employees: any[]): any {
  const totalEmployees = employees.length;
  if (totalEmployees === 0) {
    return {
      averageAttendance: 0,
      topPerformers: [],
      improvementAreas: []
    };
  }
  
  const employeeScores = employees.map(emp => {
    const attendances = emp.attendances || [];
    const presentDays = attendances.filter(att => att.status === 'PRESENT').length;
    const totalDays = attendances.length;
    const score = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    return {
      name: `${emp.user.firstName} ${emp.user.lastName}`,
      score: Math.round(score)
    };
  });
  
  const averageAttendance = employeeScores.reduce((sum, emp) => sum + emp.score, 0) / totalEmployees;
  const topPerformers = employeeScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(emp => emp.score > 0);
  
  const improvementAreas: string[] = [];
  const lowPerformers = employeeScores.filter(emp => emp.score < 70);
  if (lowPerformers.length > 0) {
    improvementAreas.push(`${lowPerformers.length} employees need attendance improvement`);
  }
  
  return {
    averageAttendance: Math.round(averageAttendance),
    topPerformers,
    improvementAreas
  };
}

function calculateDepartmentComparison(employees: any[]): any[] {
  const departmentMap = new Map();
  
  employees.forEach(emp => {
    const deptName = emp.department?.name || 'Unassigned';
    if (!departmentMap.has(deptName)) {
      departmentMap.set(deptName, { employees: [], totalScore: 0, count: 0 });
    }
    
    const attendances = emp.attendances || [];
    const presentDays = attendances.filter(att => att.status === 'PRESENT').length;
    const totalDays = attendances.length;
    const score = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    const dept = departmentMap.get(deptName);
    dept.employees.push(emp);
    dept.totalScore += score;
    dept.count += 1;
  });
  
  return Array.from(departmentMap.entries()).map(([name, data]) => ({
    department: name,
    attendanceRate: Math.round(data.totalScore / data.count),
    productivity: Math.round((data.totalScore / data.count) * 0.8) // Simplified productivity calculation
  }));
}

async function generateSmartNotifications(): Promise<any[]> {
  const notifications: any[] = [];
  
  // Check for employees who haven't checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const employeesWithoutCheckIn = await prisma.employee.findMany({
    where: {
      attendances: {
        none: {
          date: { gte: today, lt: tomorrow }
        }
      }
    },
    include: {
      user: { select: { firstName: true, lastName: true } }
    }
  });
  
  employeesWithoutCheckIn.forEach(emp => {
    notifications.push({
      id: `no-checkin-${emp.id}`,
      type: 'WARNING',
      title: 'Missing Check-in',
      message: `${emp.user.firstName} ${emp.user.lastName} hasn't checked in today`,
      priority: 'HIGH',
      actionRequired: true,
      timestamp: new Date().toISOString()
    });
  });
  
  // Check for employees with consistent late arrivals
  const lateEmployees = await prisma.employee.findMany({
    where: {
      attendances: {
        some: {
          status: 'LATE',
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }
    },
    include: {
      user: { select: { firstName: true, lastName: true } }
    }
  });
  
  lateEmployees.forEach(emp => {
    notifications.push({
      id: `late-${emp.id}`,
      type: 'INFO',
      title: 'Punctuality Alert',
      message: `${emp.user.firstName} ${emp.user.lastName} has been late recently`,
      priority: 'MEDIUM',
      actionRequired: false,
      timestamp: new Date().toISOString()
    });
  });
  
  return notifications;
}

// Get current attendance status for user
router.get("/self/status", async (req: Request, res: Response) => {
  console.log('📊 Getting attendance status for user');
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
        code: "USER_ID_REQUIRED"
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid user or user not active",
        code: "INVALID_USER"
      });
    }

    // Find employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee record not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Determine status
    const canCheckIn = !attendance || (!attendance.checkIn && !attendance.checkOut);
    const canCheckOut = attendance && attendance.checkIn && !attendance.checkOut;
    const isCompleted = attendance && attendance.checkIn && attendance.checkOut;

    console.log('📊 Attendance status debug:', {
      hasAttendance: !!attendance,
      checkIn: attendance?.checkIn,
      checkOut: attendance?.checkOut,
      canCheckIn,
      canCheckOut,
      isCompleted
    });

    res.json({
      success: true,
      data: {
        status: {
          canCheckIn,
          canCheckOut,
          isCompleted,
          currentTime: new Date().toISOString(),
          today: today.toISOString().split('T')[0]
        },
        attendance: attendance || null
      }
    });

  } catch (error: any) {
    console.error('❌ Get attendance status error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get attendance status",
      code: "STATUS_ERROR"
    });
  }
});

// Self check-in endpoint (for employees to mark their own attendance)
router.post("/self/check-in", async (req: Request, res: Response) => {
  console.log('📝 Self check-in request received:', {
    body: req.body,
    headers: req.headers,
    authorization: req.headers.authorization,
    timestamp: new Date().toISOString()
  });
  
  try {
    const { isRemote, notes, checkInSelfie, checkInLocation, deviceInfo, shiftId, userId } = req.body;
    
    console.log('📝 Check-in data received:', {
      hasSelfie: !!checkInSelfie,
      selfieLength: checkInSelfie?.length || 0,
      hasLocation: !!checkInLocation,
      locationData: checkInLocation,
      userId: userId
    });
    
    // Simple authentication - check if userId is provided
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID required",
        code: "USER_ID_REQUIRED"
      });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid user or user not active",
        code: "INVALID_USER"
      });
    }

    // Find employee record for this user
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee record not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if attendance already exists for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingAttendance) {
      console.log('⚠️ Attendance already exists for today:', {
        attendanceId: existingAttendance.id,
        checkInTime: existingAttendance.checkIn,
        checkOutTime: existingAttendance.checkOut
      });
      return res.status(400).json({
        success: false,
        error: "Attendance already marked for today",
        code: "ATTENDANCE_EXISTS"
      });
    }

    // Enhanced validation for check-in requirements
    if (!checkInSelfie) {
      return res.status(400).json({
        success: false,
        error: "Check-in requires a selfie",
        code: "SELFIE_REQUIRED"
      });
    }

    if (!checkInLocation) {
      return res.status(400).json({
        success: false,
        error: "Check-in requires location data",
        code: "LOCATION_REQUIRED"
      });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
        isRemote: isRemote || false,
        notes: notes || null,
        checkInSelfie: checkInSelfie || null,
        checkInLocation: checkInLocation || null,
        deviceInfo: deviceInfo || null,
        shiftId: shiftId || null,
        location: checkInLocation || null
      }
    });

    console.log('✅ Check-in successful:', {
      attendanceId: attendance.id,
      employeeId: attendance.employeeId,
      checkInTime: attendance.checkIn,
      hasSelfie: !!attendance.checkInSelfie,
      hasLocation: !!attendance.checkInLocation
    });

    res.json({
      success: true,
      message: "Check-in successful - Attendance recorded with selfie and location",
      data: { 
        attendance,
        checkInTime: attendance.checkIn,
        requirements: {
          selfie: !!attendance.checkInSelfie,
          location: !!attendance.checkInLocation
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Self check-in error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to mark attendance",
      code: "ATTENDANCE_ERROR"
    });
  }
});

// Self check-out endpoint (for employees to mark their own check-out)
router.post("/self/check-out", async (req: Request, res: Response) => {
  console.log('📝 Self check-out request received:', {
    body: req.body,
    headers: req.headers,
    authorization: req.headers.authorization,
    timestamp: new Date().toISOString()
  });
  
  try {
    const { notes, checkOutSelfie, checkOutLocation, userId } = req.body;
    
    console.log('📝 Check-out data received:', {
      hasSelfie: !!checkOutSelfie,
      selfieLength: checkOutSelfie?.length || 0,
      hasLocation: !!checkOutLocation,
      locationData: checkOutLocation,
      userId: userId
    });
    
    // Simple authentication - check if userId is provided
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User ID required",
        code: "USER_ID_REQUIRED"
      });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid user or user not active",
        code: "INVALID_USER"
      });
    }

    // Find employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee record not found",
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: "No check-in found for today",
        code: "NO_CHECK_IN"
      });
    }

    if (attendance.checkOut) {
      console.log('⚠️ Check-out already exists for today:', {
        attendanceId: attendance.id,
        checkOutTime: attendance.checkOut
      });
      return res.status(400).json({
        success: false,
        error: "Already checked out for today",
        code: "ALREADY_CHECKED_OUT"
      });
    }

    // Enhanced validation for check-out requirements
    if (!checkOutSelfie) {
      return res.status(400).json({
        success: false,
        error: "Check-out requires a selfie",
        code: "SELFIE_REQUIRED"
      });
    }

    if (!checkOutLocation) {
      return res.status(400).json({
        success: false,
        error: "Check-out requires location data",
        code: "LOCATION_REQUIRED"
      });
    }

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn!);
    const checkOutTime = new Date();
    
    // Calculate total time worked
    const totalTimeMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = totalTimeMs / (1000 * 60 * 60); // Convert to hours
    
    // Standard working day is 8 hours
    const standardWorkingHours = 8;
    
    // Calculate break time (1 hour lunch break if working more than 6 hours)
    let breakHours = 0;
    if (totalHours > 6) {
      breakHours = 1; // 1 hour lunch break
    }
    
    // Calculate actual working hours (excluding break)
    const actualWorkingHours = totalHours - breakHours;
    
    // Calculate regular hours (up to 8 hours)
    const regularHours = Math.min(actualWorkingHours, standardWorkingHours);
    
    // Calculate overtime hours (anything over 8 hours)
    let overtimeHours = 0;
    if (actualWorkingHours > standardWorkingHours) {
      overtimeHours = actualWorkingHours - standardWorkingHours;
    }

    // Update attendance with check-out and calculated hours
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        checkOutSelfie: checkOutSelfie || null,
        checkOutLocation: checkOutLocation || null,
        notes: notes || attendance.notes,
        totalHours: totalHours,
        regularHours: regularHours > 0 ? regularHours : null,
        overtimeHours: overtimeHours > 0 ? overtimeHours : null,
        breakHours: breakHours > 0 ? breakHours : null
      }
    });

    console.log('✅ Check-out successful:', {
      attendanceId: updatedAttendance.id,
      employeeId: updatedAttendance.employeeId,
      checkOutTime: updatedAttendance.checkOut,
      hasSelfie: !!updatedAttendance.checkOutSelfie,
      hasLocation: !!updatedAttendance.checkOutLocation
    });

    res.json({
      success: true,
      message: "Check-out successful - Attendance recorded with selfie and location",
      data: { 
        attendance: updatedAttendance,
        checkOutTime: updatedAttendance.checkOut,
        requirements: {
          selfie: !!updatedAttendance.checkOutSelfie,
          location: !!updatedAttendance.checkOutLocation
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Self check-out error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to mark check-out",
      code: "CHECKOUT_ERROR"
    });
  }
});

// Apply authentication to all other routes
router.use(authenticateToken);

// Validation schemas
const markAttendanceSchema = Joi.object({
  employeeId: Joi.string().required(),
  date: Joi.date().required(),
  checkIn: Joi.date().optional(),
  checkOut: Joi.date().optional(),
  status: Joi.string().valid("PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "HALF_DAY").required(),
  notes: Joi.string().optional(),
  // Phase 2 fields
  shiftId: Joi.string().optional(),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  deviceInfo: Joi.object({
    deviceType: Joi.string().optional(),
    os: Joi.string().optional(),
    browser: Joi.string().optional(),
    userAgent: Joi.string().optional()
  }).optional(),
  isRemote: Joi.boolean().optional(),
  overtimeHours: Joi.number().optional(),
  checkInSelfie: Joi.string().allow('').optional(), // Morning check-in selfie
  checkOutSelfie: Joi.string().allow('').optional(), // Evening check-out selfie
  checkInLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  checkOutLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional()
});

const updateAttendanceSchema = Joi.object({
  checkIn: Joi.date().optional(),
  checkOut: Joi.date().optional(),
  status: Joi.string().valid("PRESENT", "ABSENT", "LATE", "EARLY_LEAVE", "HALF_DAY").optional(),
  notes: Joi.string().optional(),
  // Phase 2 fields
  shiftId: Joi.string().optional(),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  deviceInfo: Joi.object({
    deviceType: Joi.string().optional(),
    os: Joi.string().optional(),
    browser: Joi.string().optional(),
    userAgent: Joi.string().optional()
  }).optional(),
  isRemote: Joi.boolean().optional(),
  overtimeHours: Joi.number().optional(),
  checkInSelfie: Joi.string().allow('').optional(),
  checkOutSelfie: Joi.string().allow('').optional(),
  checkInLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional(),
  checkOutLocation: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().optional(),
    accuracy: Joi.number().optional()
  }).optional()
});

// Mark attendance (for employees and admins)
router.post("/mark", async (req: Request, res: Response) => {
  console.log('📝 Attendance mark request received:', {
    body: req.body,
    headers: req.headers,
    user: (req as any).user
  });
  try {
    const { error, value } = markAttendanceSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { employeeId, date, checkIn, checkOut, status, notes, shiftId, location, deviceInfo, isRemote, checkInSelfie, checkOutSelfie, checkInLocation, checkOutLocation } = value;

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(date)
        }
      }
    });

    if (existingAttendance) {
      res.status(400).json({
        success: false,
        error: "Attendance already marked for this date",
        code: "ATTENDANCE_EXISTS"
      });
      return;
    }

    // Calculate working hours for salary calculation
    let totalHours: number | null = null;
    let regularHours: number = 0;
    let overtimeHours: number = 0;
    let breakHours: number = 0;
    
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      
      // Calculate total time worked
      const totalTimeMs = checkOutTime.getTime() - checkInTime.getTime();
      totalHours = totalTimeMs / (1000 * 60 * 60); // Convert to hours
      
      // Standard working day is 8 hours
      const standardWorkingHours = 8;
      
      // Calculate break time (1 hour lunch break if working more than 6 hours)
      if (totalHours > 6) {
        breakHours = 1; // 1 hour lunch break
      }
      
      // Calculate actual working hours (excluding break)
      const actualWorkingHours = totalHours - breakHours;
      
      // Calculate regular hours (up to 8 hours)
      regularHours = Math.min(actualWorkingHours, standardWorkingHours);
      
      // Calculate overtime hours (anything over 8 hours)
      if (actualWorkingHours > standardWorkingHours) {
        overtimeHours = actualWorkingHours - standardWorkingHours;
      }
      
      // If manual overtime hours provided in request, use that instead
      const manualOvertimeHours = (value as any).overtimeHours;
      if (manualOvertimeHours && manualOvertimeHours > 0) {
        regularHours = Math.min(actualWorkingHours - manualOvertimeHours, standardWorkingHours);
        overtimeHours = manualOvertimeHours;
      }
    }

    // Auto-detect HALF_DAY if check-in is after 11:59 AM
    let finalStatus = status;
    if (checkIn) {
      const checkInTime = new Date(checkIn);
      const hours = checkInTime.getHours();
      const minutes = checkInTime.getMinutes();
      
      // If check-in after 11:59 AM, mark as HALF_DAY
      if (hours >= 12 || (hours === 11 && minutes >= 59)) {
        finalStatus = "HALF_DAY";
      }
    }

    // Get IP address from request
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    // Get user ID from token for createdBy
    const createdBy = (req as any).user?.userId || null;

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        totalHours,
        regularHours: regularHours > 0 ? regularHours : null,
        overtimeHours: overtimeHours > 0 ? overtimeHours : null,
        breakHours: breakHours > 0 ? breakHours : null,
        status: finalStatus, // Auto-detected status
        notes,
        // Phase 2 fields
        shiftId: shiftId || null,
        location: location || null, // Legacy support
        deviceInfo: deviceInfo || null,
        ipAddress: ipAddress as string || null,
        isRemote: isRemote || false,
        createdBy: createdBy,
        checkInSelfie: checkInSelfie || null,
        checkOutSelfie: checkOutSelfie || null,
        checkInLocation: checkInLocation || null,
        checkOutLocation: checkOutLocation || null
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

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: { attendance }
    });

  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark attendance",
      code: "MARK_ATTENDANCE_ERROR"
    });
  }
});

// Get attendance records
router.get("/", async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      employeeId, 
      startDate, 
      endDate, 
      status = "" 
    } = req.query;

    console.log('📊 Attendance GET request:', {
      page, limit, employeeId, startDate, endDate, status
    });

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (employeeId) {
      where.employeeId = employeeId;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (status) {
      where.status = status;
    }

    console.log('📊 Attendance query where clause:', where);

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
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
        },
        skip,
        take: Number(limit),
        orderBy: { date: "desc" }
      }),
      prisma.attendance.count({ where })
    ]);

    console.log('📊 Attendance query results:', {
      total,
      attendancesCount: attendances.length,
      attendances: attendances.map(att => ({
        id: att.id,
        date: att.date,
        status: att.status,
        employeeId: att.employeeId
      }))
    });

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance records",
      code: "FETCH_ATTENDANCE_ERROR"
    });
  }
});

// Get attendance by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const attendance = await prisma.attendance.findUnique({
      where: { id },
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

    if (!attendance) {
      res.status(404).json({
        success: false,
        error: "Attendance record not found",
        code: "ATTENDANCE_NOT_FOUND"
      });
      return;
    }

    res.json({
      success: true,
      data: { attendance }
    });

  } catch (error) {
    console.error("Get attendance by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance record",
      code: "FETCH_ATTENDANCE_ERROR"
    });
  }
});

// Update attendance
router.put("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error, value } = updateAttendanceSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { checkIn, checkOut, status, notes } = value;

    // Calculate total hours if both check-in and check-out are provided
    let totalHours: number | null = null;
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        totalHours,
        status,
        notes
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

    res.json({
      success: true,
      message: "Attendance updated successfully",
      data: { attendance }
    });

  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update attendance",
      code: "UPDATE_ATTENDANCE_ERROR"
    });
  }
});

// Delete attendance
router.delete("/:id", requireHR, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete attendance record",
      code: "DELETE_ATTENDANCE_ERROR"
    });
  }
});

// Get attendance statistics
router.get("/stats/overview", requireHR, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [totalRecords, presentCount, absentCount, lateCount] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
      prisma.attendance.count({ where: { ...where, status: "LATE" } })
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
      }
    });

  } catch (error) {
    console.error("Get attendance stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance statistics",
      code: "FETCH_STATS_ERROR"
    });
  }
});

// Get employee's attendance history
router.get("/employee/:employeeId", async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { employeeId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
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
        },
        skip,
        take: Number(limit),
        orderBy: { date: "desc" }
      }),
      prisma.attendance.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get employee attendance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee attendance",
      code: "FETCH_EMPLOYEE_ATTENDANCE_ERROR"
    });
  }
});

export default router;
