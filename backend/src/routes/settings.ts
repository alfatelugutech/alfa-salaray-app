import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireHR } from "../middleware/auth";
import Joi from "joi";

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createSettingSchema = Joi.object({
  key: Joi.string().required(),
  value: Joi.string().required(),
  type: Joi.string().valid("STRING", "NUMBER", "BOOLEAN", "JSON").default("STRING"),
  category: Joi.string().optional()
});

const updateSettingSchema = Joi.object({
  value: Joi.string().required(),
  type: Joi.string().valid("STRING", "NUMBER", "BOOLEAN", "JSON").optional(),
  category: Joi.string().optional()
});

// Get all settings
router.get("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, category = "", search = "" } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { key: { contains: search as string, mode: "insensitive" } },
        { value: { contains: search as string, mode: "insensitive" } }
      ];
    }

    const [settings, total] = await Promise.all([
      prisma.systemSetting.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { key: "asc" }
      }),
      prisma.systemSetting.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        settings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings",
      code: "FETCH_SETTINGS_ERROR"
    });
  }
});

// Get setting by key
router.get("/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      res.status(404).json({
        success: false,
        error: "Setting not found",
        code: "SETTING_NOT_FOUND"
      });
      return;
    }

    res.json({
      success: true,
      data: { setting }
    });

  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch setting",
      code: "FETCH_SETTING_ERROR"
    });
  }
});

// Create new setting
router.post("/", requireHR, async (req: Request, res: Response) => {
  try {
    const { error, value } = createSettingSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const { key, value: settingValue, type, category } = value;

    // Check if setting already exists
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (existingSetting) {
      res.status(400).json({
        success: false,
        error: "Setting with this key already exists",
        code: "SETTING_EXISTS"
      });
      return;
    }

    const setting = await prisma.systemSetting.create({
      data: {
        key,
        value: settingValue,
        type,
        category
      }
    });

    res.status(201).json({
      success: true,
      message: "Setting created successfully",
      data: { setting }
    });

  } catch (error) {
    console.error("Create setting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create setting",
      code: "CREATE_SETTING_ERROR"
    });
  }
});

// Update setting
router.put("/:key", requireHR, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { error, value } = updateSettingSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: "VALIDATION_ERROR"
      });
      return;
    }

    const setting = await prisma.systemSetting.update({
      where: { key },
      data: value
    });

    res.json({
      success: true,
      message: "Setting updated successfully",
      data: { setting }
    });

  } catch (error) {
    console.error("Update setting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update setting",
      code: "UPDATE_SETTING_ERROR"
    });
  }
});

// Delete setting
router.delete("/:key", requireHR, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    await prisma.systemSetting.delete({
      where: { key }
    });

    res.json({
      success: true,
      message: "Setting deleted successfully"
    });

  } catch (error) {
    console.error("Delete setting error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete setting",
      code: "DELETE_SETTING_ERROR"
    });
  }
});

// Get settings by category
router.get("/category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const settings = await prisma.systemSetting.findMany({
      where: { category },
      orderBy: { key: "asc" }
    });

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error("Get settings by category error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings by category",
      code: "FETCH_SETTINGS_BY_CATEGORY_ERROR"
    });
  }
});

// Bulk update settings
router.put("/bulk", requireHR, async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      res.status(400).json({
        success: false,
        error: "Settings must be an array",
        code: "INVALID_SETTINGS_FORMAT"
      });
      return;
    }

    const updatePromises = settings.map((setting: any) => {
      const updateData: any = {
        value: String(setting.value)
      };
      
      if (setting.type !== undefined) {
        updateData.type = setting.type;
      }
      if (setting.category !== undefined) {
        updateData.category = setting.category;
      }
      
      return prisma.systemSetting.update({
        where: { key: setting.key },
        data: updateData
      });
    });

    const updatedSettings = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: { settings: updatedSettings }
    });

  } catch (error) {
    console.error("Bulk update settings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update settings",
      code: "BULK_UPDATE_SETTINGS_ERROR"
    });
  }
});

// Get system configuration
router.get("/config/system", async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        category: {
          in: ["SYSTEM", "GENERAL", "SECURITY", "NOTIFICATIONS"]
        }
      },
      orderBy: { key: "asc" }
    });

    // Convert settings to key-value pairs
    const config = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      // Parse value based on type
      switch (setting.type) {
        case "NUMBER":
          value = Number(setting.value);
          break;
        case "BOOLEAN":
          value = setting.value === "true";
          break;
        case "JSON":
          try {
            value = JSON.parse(setting.value);
          } catch (e) {
            value = setting.value;
          }
          break;
        default:
          value = setting.value;
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      data: { config }
    });

  } catch (error) {
    console.error("Get system config error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system configuration",
      code: "FETCH_SYSTEM_CONFIG_ERROR"
    });
  }
});

export default router;


