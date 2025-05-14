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

  // Authentication middlewares
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
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

  // Authentication routes
  apiRouter.post("/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      
      req.logIn(user, (err: Error | null) => {
        if (err) return next(err);
        return res.json(user);
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

  apiRouter.get("/families/:id", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
      const family = await storage.getFamily(familyId);
      
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      res.json(family);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.get("/families/:id/members", isAuthenticated, async (req, res) => {
    try {
      const familyId = parseInt(req.params.id);
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

  // Chore routes
  apiRouter.get("/chores", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const familyId = (req.user as any).familyId;
      const roleType = (req.user as any).roleType;
      
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
      const data = insertChoreSchema.parse(req.body);
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
      
      const updatedChore = await storage.completeChore(choreId, userId);
      if (!updatedChore) {
        return res.status(404).json({ message: "Chore not found or already completed" });
      }
      
      res.json(updatedChore);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Reward routes
  apiRouter.get("/rewards", isAuthenticated, async (req, res) => {
    try {
      const familyId = (req.user as any).familyId;
      const rewards = await storage.getRewardsByFamilyId(familyId);
      res.json(rewards);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/rewards", isParent, async (req, res) => {
    try {
      const data = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(data);
      res.status(201).json(reward);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Redemption routes
  apiRouter.post("/redemptions", isAuthenticated, async (req, res) => {
    try {
      const data = insertRedemptionSchema.parse(req.body);
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
      const updatedRedemption = await storage.approveRedemption(redemptionId);
      
      if (!updatedRedemption) {
        return res.status(404).json({ message: "Redemption not found" });
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
      const userId = parseInt(req.params.userId);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/users/:userId/achievements", isParent, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const data = insertUserAchievementSchema.parse({ ...req.body, userId });
      const userAchievement = await storage.awardAchievement(data);
      res.status(201).json(userAchievement);
    } catch (err) {
      handleError(err, res);
    }
  });

  // External API access
  apiRouter.get("/external/chores", async (req, res) => {
    try {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({ message: "API key required" });
      }
      
      const family = await storage.getFamilyByApiKey(apiKey);
      if (!family) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      const childId = req.query.child_id ? parseInt(req.query.child_id as string) : undefined;
      
      let chores;
      if (childId) {
        chores = await storage.getChoresByUserId(childId);
      } else {
        chores = await storage.getChoresByFamilyId(family.id);
      }
      
      res.json(chores);
    } catch (err) {
      handleError(err, res);
    }
  });

  apiRouter.post("/external/chores/:id/complete", async (req, res) => {
    try {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({ message: "API key required" });
      }
      
      const family = await storage.getFamilyByApiKey(apiKey);
      if (!family) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      const choreId = parseInt(req.params.id);
      const userId = parseInt(req.body.child_id);
      
      if (!userId) {
        return res.status(400).json({ message: "child_id is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.familyId !== family.id) {
        return res.status(403).json({ message: "Child not found in family" });
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

  // Debug endpoints to troubleshoot auth issues
  app.get("/debug/session", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      session: req.session,
      user: req.user || null
    });
  });
  
  // Attach the API router
  app.use("/api", apiRouter);

  // Create HTTP server without WebSocket to avoid conflicts with Vite's WebSocket server
  const httpServer = createServer(app);
  return httpServer;
}
