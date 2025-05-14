import express, { type Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  insertUserSchema,
  insertFamilySchema,
  insertChoreSchema,
  insertRewardSchema,
  insertRedemptionSchema,
  insertUserAchievementSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: "chorequest-secret",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    })
  );

  // Initialize passport and session
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        const isValidPassword = await storage.comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Configure passport serialization for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Define API routes
  const apiRouter = express.Router();

  // Set up error handling for the API routes
  const handleError = (err: unknown, res: Response) => {
    console.error("API error:", err);
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: err.errors,
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Authentication and security middlewares
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      // Store the family ID in session for quick access and security checks
      // Using custom property, first extend session type
      (req.session as any).familyId = (req.user as any).familyId;
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  const isParent = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).roleType === "parent") {
      return next();
    }
    res.status(403).json({ message: "Parent access required" });
  };
  
  // Middleware to verify family access - prevents cross-family data access
  const verifyFamilyAccess = (req: Request, res: Response, next: Function) => {
    const userFamilyId = (req.user as any).familyId;
    const targetFamilyId = parseInt(req.params.familyId) || parseInt(req.params.id);
    
    if (!targetFamilyId || userFamilyId === targetFamilyId) {
      return next();
    }
    
    return res.status(403).json({ 
      message: "Access denied: You can only access data from your own family" 
    });
  };

  // Authentication routes
  apiRouter.post("/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      
      req.logIn(user, (err: Error | null) => {
        if (err) return next(err);
        
        // Set a cookie to help with auth
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return next(err);
          }
          
          console.log("User authenticated and session saved:", user.id);
          return res.json(user);
        });
      });
    })(req, res, next);
  });

  apiRouter.post("/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  apiRouter.get("/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Family routes
  apiRouter.post("/families", async (req, res) => {
    try {
      const data = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily(data);
      res.status(201).json(family);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.get("/families/:id", isAuthenticated, verifyFamilyAccess, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      // Only allow access to user's own family
      if (familyId !== (req.user as any).familyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      res.json(family);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.get("/families/:id/members", isAuthenticated, verifyFamilyAccess, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      // Only allow access to user's own family
      if (familyId !== (req.user as any).familyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const members = await storage.getFamilyMembers(familyId);
      res.json(members);
    } catch (err) {
      handleError(err, res);
    }
  });

  // User routes
  apiRouter.post("/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get users from user's own family only
  apiRouter.get("/users", isAuthenticated, async (req, res) => {
    try {
      // Only get users from the same family as the current user
      const familyId = (req.user as any).familyId;
      if (!familyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      const users = await storage.getFamilyMembers(familyId);
      res.status(200).json(users);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Chore routes - secure to user's family
  apiRouter.get("/chores", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const familyId = (req.user as any).familyId;
      const roleType = (req.user as any).roleType;
      
      if (!familyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      let chores;
      if (roleType === "parent") {
        chores = await storage.getChoresByFamilyId(familyId);
      } else {
        chores = await storage.getChoresByUserId(userId);
      }
      
      res.json(chores);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/chores", isParent, async (req, res) => {
    try {
      // Ensure the chore is being created for the user's family
      const userFamilyId = (req.user as any).familyId;
      if (!userFamilyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      // Force familyId to be the user's family
      const data = insertChoreSchema.parse({
        ...req.body,
        familyId: userFamilyId
      });
      
      // Verify assignedToId is from the same family
      if (data.assignedToId) {
        const assignedUser = await storage.getUser(data.assignedToId);
        if (!assignedUser || assignedUser.familyId !== userFamilyId) {
          return res.status(403).json({ 
            message: "You can only assign chores to members of your own family" 
          });
        }
      }
      
      const chore = await storage.createChore(data);
      res.status(201).json(chore);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/chores/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const choreId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const userFamilyId = (req.user as any).familyId;
      
      // Verify the chore belongs to the user's family
      const chore = await storage.getChore(choreId);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      if (chore.familyId !== userFamilyId) {
        return res.status(403).json({ message: "You can only complete chores from your own family" });
      }
      
      // For children, verify they can only complete their own chores
      if ((req.user as any).roleType === "child" && chore.assignedToId && chore.assignedToId !== userId) {
        return res.status(403).json({ message: "You can only complete chores assigned to you" });
      }
      
      const updatedChore = await storage.completeChore(choreId, userId);
      if (!updatedChore) {
        return res.status(404).json({ message: "Chore not found or already completed" });
      }
      
      res.json(updatedChore);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Reward routes - secure to user's family
  apiRouter.get("/rewards", isAuthenticated, async (req, res) => {
    try {
      const familyId = (req.user as any).familyId;
      
      if (!familyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      const rewards = await storage.getRewardsByFamilyId(familyId);
      res.json(rewards);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/rewards", isParent, async (req, res) => {
    try {
      const userFamilyId = (req.user as any).familyId;
      
      if (!userFamilyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      // Force familyId to be the user's family
      const data = insertRewardSchema.parse({
        ...req.body,
        familyId: userFamilyId
      });
      
      const reward = await storage.createReward(data);
      res.status(201).json(reward);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Redemption routes - secure by family
  apiRouter.post("/redemptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userFamilyId = (req.user as any).familyId;
      
      if (!userFamilyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      // Verify the reward belongs to the user's family
      const rewardId = req.body.rewardId;
      if (rewardId) {
        const reward = await storage.getReward(rewardId);
        if (!reward || reward.familyId !== userFamilyId) {
          return res.status(403).json({ 
            message: "You can only redeem rewards from your own family" 
          });
        }
      }
      
      // Force userId to be the current user
      const data = insertRedemptionSchema.parse({
        ...req.body,
        userId: userId
      });
      
      const redemption = await storage.createRedemption(data);
      res.status(201).json(redemption);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.get("/redemptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const redemptions = await storage.getRedemptionsByUserId(userId);
      res.json(redemptions);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/redemptions/:id/approve", isParent, async (req, res) => {
    try {
      const redemptionId = parseInt(req.params.id);
      const userFamilyId = (req.user as any).familyId;
      
      if (!userFamilyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      // First get the redemption
      const redemption = await storage.getRedemptionById(redemptionId);
      if (!redemption) {
        return res.status(404).json({ message: "Redemption not found" });
      }
      
      // Get the user who made the redemption
      const redeemingUser = await storage.getUser(redemption.userId);
      if (!redeemingUser || redeemingUser.familyId !== userFamilyId) {
        return res.status(403).json({ 
          message: "You can only approve redemptions from your own family members" 
        });
      }
      
      const updatedRedemption = await storage.approveRedemption(redemptionId);
      if (!updatedRedemption) {
        return res.status(404).json({ message: "Redemption not found or already approved" });
      }
      
      res.json(updatedRedemption);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Achievement routes
  apiRouter.get("/achievements", isAuthenticated, async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.get("/users/:userId/achievements", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const currentUserFamilyId = (req.user as any).familyId;
      const targetUserId = parseInt(req.params.userId);
      
      if (!currentUserFamilyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      // Verify the target user is from the same family as the current user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser || targetUser.familyId !== currentUserFamilyId) {
        return res.status(403).json({ 
          message: "You can only view achievements of users from your own family" 
        });
      }
      
      const achievements = await storage.getUserAchievements(targetUserId);
      res.json(achievements);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/users/:userId/achievements", isParent, async (req, res) => {
    try {
      const currentUserFamilyId = (req.user as any).familyId;
      const targetUserId = parseInt(req.params.userId);
      
      if (!currentUserFamilyId) {
        return res.status(400).json({ message: "No family associated with user" });
      }
      
      // Verify the target user is from the same family as the current user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser || targetUser.familyId !== currentUserFamilyId) {
        return res.status(403).json({ 
          message: "You can only award achievements to users from your own family" 
        });
      }
      
      const data = insertUserAchievementSchema.parse({ ...req.body, userId: targetUserId });
      const userAchievement = await storage.awardAchievement(data);
      res.status(201).json(userAchievement);
    } catch (err) {
      handleError(err, res);
    }
  });

  // External API access - secured with API key validation
  apiRouter.get("/external/chores", async (req, res) => {
    try {
      // Extract API key - support both header format options
      const apiKey = req.headers.authorization?.replace('Bearer ', '') || 
                    req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        return res.status(401).json({ 
          message: "API key required",
          details: "Provide API key in Authorization header as 'Bearer YOUR_API_KEY' or in X-API-Key header"
        });
      }
      
      // Verify API key and get associated family
      const family = await storage.getFamilyByApiKey(apiKey);
      if (!family) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      const childId = req.query.child_id ? parseInt(req.query.child_id as string) : undefined;
      
      // If child ID is provided, verify the child belongs to this family
      if (childId) {
        const child = await storage.getUser(childId);
        if (!child || child.familyId !== family.id) {
          return res.status(403).json({ 
            message: "Access denied: Child ID does not belong to this family"
          });
        }
        
        const chores = await storage.getChoresByUserId(childId);
        return res.json(chores);
      } 
      
      // Return all family chores if no child ID specified
      const chores = await storage.getChoresByFamilyId(family.id);
      res.json(chores);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/external/chores/:id/complete", async (req, res) => {
    try {
      // Extract API key - support both header format options
      const apiKey = req.headers.authorization?.replace('Bearer ', '') || 
                    req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        return res.status(401).json({ 
          message: "API key required",
          details: "Provide API key in Authorization header as 'Bearer YOUR_API_KEY' or in X-API-Key header"
        });
      }
      
      // Verify API key and get associated family
      const family = await storage.getFamilyByApiKey(apiKey);
      if (!family) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      const choreId = parseInt(req.params.id);
      const userId = parseInt(req.body.child_id);
      
      if (!userId) {
        return res.status(400).json({ message: "child_id is required in request body" });
      }
      
      // Verify the chore exists and belongs to the family
      const chore = await storage.getChore(choreId);
      if (!chore) {
        return res.status(404).json({ message: "Chore not found" });
      }
      
      if (chore.familyId !== family.id) {
        return res.status(403).json({ message: "Access denied: Chore does not belong to this family" });
      }
      
      // Verify the user exists and belongs to the family
      const user = await storage.getUser(userId);
      if (!user || user.familyId !== family.id) {
        return res.status(403).json({ message: "Child not found in family" });
      }
      
      // Complete the chore
      const updatedChore = await storage.completeChore(choreId, userId);
      if (!updatedChore) {
        return res.status(404).json({ message: "Chore not found or already completed" });
      }
      
      res.json(updatedChore);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Debug endpoints to troubleshoot auth issues
  app.get("/debug/session", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      session: req.session,
      sessionID: req.sessionID,
      cookies: req.headers.cookie,
      user: req.user || null
    });
  });
  
  // Attach the API router
  app.use("/api", apiRouter);

  // Create HTTP server without WebSocket to avoid conflicts with Vite's WebSocket server
  const httpServer = createServer(app);
  return httpServer;
}
