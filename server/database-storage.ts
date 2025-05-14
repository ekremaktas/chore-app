import { and, eq, isNull, inArray } from "drizzle-orm";
import { db } from "./db";
import { nanoid } from "nanoid";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import type { IStorage } from "./storage";
import {
  users,
  families,
  chores,
  rewards,
  redemptions,
  achievements,
  userAchievements,
  type User,
  type InsertUser,
  type Family,
  type InsertFamily,
  type Chore,
  type InsertChore,
  type Reward,
  type InsertReward,
  type Redemption,
  type InsertRedemption,
  type Achievement,
  type UserAchievement,
  type InsertUserAchievement
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

// Create a PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Express session store

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize default achievements if not already present
    this.initializeAchievements();
  }

  private async initializeAchievements() {
    const existingAchievements = await db.select().from(achievements);

    if (existingAchievements.length === 0) {
      const defaultAchievements = [
        {
          name: "First Chore",
          description: "Complete your first chore",
          icon: "ri-award-line",
          backgroundColor: "#FFD700"
        },
        {
          name: "Chore Master",
          description: "Complete 10 chores",
          icon: "ri-trophy-line",
          backgroundColor: "#C0C0C0"
        },
        {
          name: "Consistency King",
          description: "Complete chores 5 days in a row",
          icon: "ri-calendar-check-line",
          backgroundColor: "#CD7F32"
        },
        {
          name: "Early Bird",
          description: "Complete a chore before 9 AM",
          icon: "ri-sun-line",
          backgroundColor: "#87CEEB"
        },
        {
          name: "Weekend Warrior",
          description: "Complete 3 chores on a weekend",
          icon: "ri-sword-line",
          backgroundColor: "#9932CC"
        },
      ];

      try {
        await db.insert(achievements).values(defaultAchievements);
        console.log("Default achievements initialized");
      } catch (error) {
        console.error("Error initializing default achievements:", error);
      }
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash the password
    const hashedPassword = await this.hashPassword(user.password);
    
    const result = await db.insert(users)
      .values({
        ...user,
        password: hashedPassword,
        points: 0,
        level: 1
      })
      .returning();
    
    return result[0];
  }

  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedPoints = user.points + points;
    const newLevel = Math.floor(updatedPoints / 100) + 1;
    
    const result = await db.update(users)
      .set({ 
        points: updatedPoints,
        level: newLevel
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }
  
  // Family operations
  async createFamily(family: InsertFamily): Promise<Family> {
    // Generate API key if not provided
    const apiKey = family.apiKey || `family_${nanoid(10)}`;
    
    const result = await db.insert(families)
      .values({
        ...family,
        apiKey
      })
      .returning();
    
    return result[0];
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const result = await db.select().from(families).where(eq(families.id, id));
    return result[0];
  }

  async getFamilyByApiKey(apiKey: string): Promise<Family | undefined> {
    const result = await db.select().from(families).where(eq(families.apiKey, apiKey));
    return result[0];
  }

  async getFamilyMembers(familyId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.familyId, familyId));
  }
  
  // Chore operations
  async getChore(id: number): Promise<Chore | undefined> {
    const result = await db.select().from(chores).where(eq(chores.id, id));
    return result[0];
  }

  async getChoresByUserId(userId: number): Promise<Chore[]> {
    return db.select()
      .from(chores)
      .where(eq(chores.assignedToId, userId));
  }

  async getChoresByFamilyId(familyId: number): Promise<Chore[]> {
    return db.select()
      .from(chores)
      .where(eq(chores.familyId, familyId));
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    // Ensure proper defaults
    const result = await db.insert(chores)
      .values({
        ...chore,
        isCompleted: false,
        completedAt: null
      })
      .returning();
    
    return result[0];
  }

  async completeChore(id: number, userId: number): Promise<Chore | undefined> {
    // First, check if the chore exists and is assigned to the user
    const choreToComplete = await db.select()
      .from(chores)
      .where(
        and(
          eq(chores.id, id),
          eq(chores.assignedToId, userId),
          eq(chores.isCompleted, false)
        )
      );
    
    if (choreToComplete.length === 0) return undefined;
    
    // Update the chore
    const result = await db.update(chores)
      .set({ 
        isCompleted: true,
        completedAt: new Date()
      })
      .where(eq(chores.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Award points to the user
    await this.updateUserPoints(userId, result[0].points);
    
    // Check for achievements
    await this.checkChoreAchievements(userId);
    
    return result[0];
  }
  
  // Helper method to check for achievements when completing chores
  private async checkChoreAchievements(userId: number) {
    try {
      // Get all completed chores for the user
      const completedChores = await db.select()
        .from(chores)
        .where(
          and(
            eq(chores.assignedToId, userId),
            eq(chores.isCompleted, true)
          )
        );
      
      // Check for "First Chore" achievement
      if (completedChores.length === 1) {
        const firstChoreAchievement = await db.select()
          .from(achievements)
          .where(eq(achievements.name, "First Chore"));
        
        if (firstChoreAchievement.length > 0) {
          await this.awardAchievement({
            userId,
            achievementId: firstChoreAchievement[0].id
          });
        }
      }
      
      // Check for "Chore Master" achievement
      if (completedChores.length === 10) {
        const choreMasterAchievement = await db.select()
          .from(achievements)
          .where(eq(achievements.name, "Chore Master"));
        
        if (choreMasterAchievement.length > 0) {
          await this.awardAchievement({
            userId,
            achievementId: choreMasterAchievement[0].id
          });
        }
      }
      
      // Additional achievement checks can be added here
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }
  
  // Reward operations
  async getReward(id: number): Promise<Reward | undefined> {
    const result = await db.select().from(rewards).where(eq(rewards.id, id));
    return result[0];
  }

  async getRewardsByFamilyId(familyId: number): Promise<Reward[]> {
    return db.select()
      .from(rewards)
      .where(eq(rewards.familyId, familyId));
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const result = await db.insert(rewards)
      .values({
        ...reward,
        isAvailable: true
      })
      .returning();
    
    return result[0];
  }
  
  // Redemption operations
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    // Verify the user has enough points
    const user = await this.getUser(redemption.userId);
    const reward = await this.getReward(redemption.rewardId);
    
    if (!user || !reward) {
      throw new Error("User or reward not found");
    }
    
    if (user.points < redemption.pointsSpent) {
      throw new Error("Not enough points");
    }
    
    // Create the redemption record
    const result = await db.insert(redemptions)
      .values({
        ...redemption,
        redeemedAt: new Date(),
        isApproved: false
      })
      .returning();
    
    // Deduct points from the user
    await this.updateUserPoints(user.id, -redemption.pointsSpent);
    
    return result[0];
  }

  async getRedemptionsByUserId(userId: number): Promise<Redemption[]> {
    return db.select()
      .from(redemptions)
      .where(eq(redemptions.userId, userId));
  }

  async approveRedemption(id: number): Promise<Redemption | undefined> {
    const result = await db.update(redemptions)
      .set({ isApproved: true })
      .where(eq(redemptions.id, id))
      .returning();
    
    return result[0];
  }
  
  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]> {
    const userAchievementsData = await db.select({
      achievementId: userAchievements.achievementId,
      earnedAt: userAchievements.earnedAt
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
    
    if (userAchievementsData.length === 0) {
      return [];
    }
    
    const achievementIds = userAchievementsData.map(ua => ua.achievementId);
    const achievementsData = await db.select()
      .from(achievements)
      .where(
        achievementIds.length > 0 
          ? inArray(achievements.id, achievementIds) 
          : eq(achievements.id, -1) // No matching achievements
      );
    
    // Combine the data
    return achievementsData.map(achievement => {
      const userAchievement = userAchievementsData.find(
        ua => ua.achievementId === achievement.id
      );
      return {
        ...achievement,
        earnedAt: userAchievement!.earnedAt
      };
    });
  }

  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    // Check if the user already has this achievement
    const existing = await db.select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userAchievement.userId),
          eq(userAchievements.achievementId, userAchievement.achievementId)
        )
      );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Award the achievement
    const result = await db.insert(userAchievements)
      .values({
        ...userAchievement,
        earnedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
}