import {
  users, families, chores, rewards, redemptions, achievements, userAchievements,
  type User, type InsertUser,
  type Family, type InsertFamily,
  type Chore, type InsertChore,
  type Reward, type InsertReward,
  type Redemption, type InsertRedemption,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement
} from "@shared/schema";
import { nanoid } from 'nanoid';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;
  
  // Family operations
  createFamily(family: InsertFamily): Promise<Family>;
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyByApiKey(apiKey: string): Promise<Family | undefined>;
  getFamilyMembers(familyId: number): Promise<User[]>;
  
  // Chore operations
  getChore(id: number): Promise<Chore | undefined>;
  getChoresByUserId(userId: number): Promise<Chore[]>;
  getChoresByFamilyId(familyId: number): Promise<Chore[]>;
  createChore(chore: InsertChore): Promise<Chore>;
  completeChore(id: number, userId: number): Promise<Chore | undefined>;
  
  // Reward operations
  getReward(id: number): Promise<Reward | undefined>;
  getRewardsByFamilyId(familyId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  
  // Redemption operations
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getRedemptionsByUserId(userId: number): Promise<Redemption[]>;
  approveRedemption(id: number): Promise<Redemption | undefined>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private families: Map<number, Family>;
  private chores: Map<number, Chore>;
  private rewards: Map<number, Reward>;
  private redemptions: Map<number, Redemption>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  
  private userIdCounter: number;
  private familyIdCounter: number;
  private choreIdCounter: number;
  private rewardIdCounter: number;
  private redemptionIdCounter: number;
  private achievementIdCounter: number;
  private userAchievementIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.families = new Map();
    this.chores = new Map();
    this.rewards = new Map();
    this.redemptions = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    
    this.userIdCounter = 1;
    this.familyIdCounter = 1;
    this.choreIdCounter = 1;
    this.rewardIdCounter = 1;
    this.redemptionIdCounter = 1;
    this.achievementIdCounter = 1;
    this.userAchievementIdCounter = 1;
    
    // Initialize with sample data
    this.initializeAchievements();
    this.initializeSampleData();
  }
  
  // Initialize sample data for demo purposes
  private async initializeSampleData() {
    try {
      // Create a sample family
      const family = await this.createFamily({
        name: "Smith Family",
        apiKey: "demo_api_key_123456"
      });
      
      // Create a parent user
      await this.createUser({
        username: "parent",
        password: "parent123",
        displayName: "Parent Smith",
        roleType: "parent",
        familyId: family.id,
        avatarColor: "purple"
      });
      
      // Create a child user
      const jake = await this.createUser({
        username: "jake",
        password: "jake123",
        displayName: "Jake Smith",
        roleType: "child",
        familyId: family.id,
        avatarColor: "blue"
      });
      
      // Create some sample chores
      await this.createChore({
        name: "Take out the trash",
        description: "Every evening before dinner",
        points: 30,
        icon: "ri-delete-bin-line",
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        assignedToId: jake.id,
        familyId: family.id,
        createdBy: 1 // Parent
      });
      
      await this.createChore({
        name: "Clean bedroom",
        description: "Make your bed and tidy up",
        points: 50,
        icon: "ri-home-line",
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        assignedToId: jake.id,
        familyId: family.id,
        createdBy: 1 // Parent
      });
      
      // Create some sample rewards
      await this.createReward({
        name: "Movie Night",
        description: "Pick any movie for family night",
        pointsCost: 100,
        icon: "ri-movie-line",
        familyId: family.id
      });
      
      await this.createReward({
        name: "Extra Game Time",
        description: "30 minutes of extra video game time",
        pointsCost: 150,
        icon: "ri-gamepad-line",
        familyId: family.id
      });
      
      console.log("Sample data initialized successfully");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }
  
  private initializeAchievements() {
    const defaultAchievements: InsertAchievement[] = [
      {
        name: "Early Bird",
        description: "Complete 5 morning chores",
        icon: "ri-star-line",
        backgroundColor: "primary",
      },
      {
        name: "Streak Master",
        description: "3-day completion streak",
        icon: "ri-award-line",
        backgroundColor: "secondary",
      },
      {
        name: "Point Collector",
        description: "Earned 250+ points",
        icon: "ri-trophy-line",
        backgroundColor: "accent",
      },
      {
        name: "Helper",
        description: "Complete 10 chores",
        icon: "ri-service-line",
        backgroundColor: "success",
      },
      {
        name: "Responsibility Champion",
        description: "Complete all chores for a week",
        icon: "ri-medal-line",
        backgroundColor: "primary",
      }
    ];
    
    defaultAchievements.forEach(achievement => {
      const id = this.achievementIdCounter++;
      this.achievements.set(id, { ...achievement, id });
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, points: 0, level: 1 };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedPoints = user.points + points;
    // Simple level calculation: level = 1 + floor(points / 100)
    const newLevel = 1 + Math.floor(updatedPoints / 100);
    
    const updatedUser: User = {
      ...user,
      points: updatedPoints,
      level: newLevel
    };
    
    this.users.set(userId, updatedUser);
    
    // Check for point-based achievements
    if (updatedPoints >= 250) {
      const pointCollectorAchievement = Array.from(this.achievements.values()).find(
        a => a.name === "Point Collector"
      );
      
      if (pointCollectorAchievement) {
        const existingAchievement = Array.from(this.userAchievements.values()).find(
          ua => ua.userId === userId && ua.achievementId === pointCollectorAchievement.id
        );
        
        if (!existingAchievement) {
          await this.awardAchievement({
            userId,
            achievementId: pointCollectorAchievement.id
          });
        }
      }
    }
    
    return updatedUser;
  }
  
  // Family operations
  async createFamily(family: InsertFamily): Promise<Family> {
    const id = this.familyIdCounter++;
    // Generate an API key if one is not provided
    const apiKey = family.apiKey || `fam_${nanoid(24)}`;
    const newFamily: Family = { ...family, id, apiKey };
    this.families.set(id, newFamily);
    return newFamily;
  }
  
  async getFamily(id: number): Promise<Family | undefined> {
    return this.families.get(id);
  }
  
  async getFamilyByApiKey(apiKey: string): Promise<Family | undefined> {
    return Array.from(this.families.values()).find(
      (family) => family.apiKey === apiKey
    );
  }
  
  async getFamilyMembers(familyId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.familyId === familyId
    );
  }
  
  // Chore operations
  async getChore(id: number): Promise<Chore | undefined> {
    return this.chores.get(id);
  }
  
  async getChoresByUserId(userId: number): Promise<Chore[]> {
    return Array.from(this.chores.values()).filter(
      (chore) => chore.assignedToId === userId
    );
  }
  
  async getChoresByFamilyId(familyId: number): Promise<Chore[]> {
    return Array.from(this.chores.values()).filter(
      (chore) => chore.familyId === familyId
    );
  }
  
  async createChore(chore: InsertChore): Promise<Chore> {
    const id = this.choreIdCounter++;
    const newChore: Chore = {
      ...chore,
      id,
      isCompleted: false,
      completedAt: null
    };
    this.chores.set(id, newChore);
    return newChore;
  }
  
  async completeChore(id: number, userId: number): Promise<Chore | undefined> {
    const chore = this.chores.get(id);
    if (!chore || chore.isCompleted || chore.assignedToId !== userId) {
      return undefined;
    }
    
    const now = new Date();
    const completedChore: Chore = {
      ...chore,
      isCompleted: true,
      completedAt: now
    };
    
    this.chores.set(id, completedChore);
    
    // Add points to the user
    await this.updateUserPoints(userId, chore.points);
    
    // Check for achievements
    await this.checkChoreAchievements(userId);
    
    return completedChore;
  }
  
  private async checkChoreAchievements(userId: number) {
    const userChores = await this.getChoresByUserId(userId);
    const completedChores = userChores.filter(chore => chore.isCompleted);
    
    // Check for completion count achievements
    if (completedChores.length >= 10) {
      const helperAchievement = Array.from(this.achievements.values()).find(
        a => a.name === "Helper"
      );
      
      if (helperAchievement) {
        const existingAchievement = Array.from(this.userAchievements.values()).find(
          ua => ua.userId === userId && ua.achievementId === helperAchievement.id
        );
        
        if (!existingAchievement) {
          await this.awardAchievement({
            userId,
            achievementId: helperAchievement.id
          });
        }
      }
    }
    
    // Morning chores (if completed before noon)
    const morningChores = completedChores.filter(chore => {
      if (!chore.completedAt) return false;
      const completedHour = new Date(chore.completedAt).getHours();
      return completedHour < 12;
    });
    
    if (morningChores.length >= 5) {
      const earlyBirdAchievement = Array.from(this.achievements.values()).find(
        a => a.name === "Early Bird"
      );
      
      if (earlyBirdAchievement) {
        const existingAchievement = Array.from(this.userAchievements.values()).find(
          ua => ua.userId === userId && ua.achievementId === earlyBirdAchievement.id
        );
        
        if (!existingAchievement) {
          await this.awardAchievement({
            userId,
            achievementId: earlyBirdAchievement.id
          });
        }
      }
    }
    
    // Check for 3-day streak
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Simple check for any completed chores on consecutive days
    const hasCompletedToday = completedChores.some(chore => {
      if (!chore.completedAt) return false;
      const completedDate = new Date(chore.completedAt);
      return completedDate.toDateString() === now.toDateString();
    });
    
    const hasCompletedYesterday = completedChores.some(chore => {
      if (!chore.completedAt) return false;
      const completedDate = new Date(chore.completedAt);
      return completedDate.toDateString() === yesterday.toDateString();
    });
    
    const hasCompletedTwoDaysAgo = completedChores.some(chore => {
      if (!chore.completedAt) return false;
      const completedDate = new Date(chore.completedAt);
      return completedDate.toDateString() === twoDaysAgo.toDateString();
    });
    
    if (hasCompletedToday && hasCompletedYesterday && hasCompletedTwoDaysAgo) {
      const streakMasterAchievement = Array.from(this.achievements.values()).find(
        a => a.name === "Streak Master"
      );
      
      if (streakMasterAchievement) {
        const existingAchievement = Array.from(this.userAchievements.values()).find(
          ua => ua.userId === userId && ua.achievementId === streakMasterAchievement.id
        );
        
        if (!existingAchievement) {
          await this.awardAchievement({
            userId,
            achievementId: streakMasterAchievement.id
          });
        }
      }
    }
  }
  
  // Reward operations
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }
  
  async getRewardsByFamilyId(familyId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values()).filter(
      (reward) => reward.familyId === familyId && reward.isAvailable
    );
  }
  
  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardIdCounter++;
    const newReward: Reward = {
      ...reward,
      id,
      isAvailable: true
    };
    this.rewards.set(id, newReward);
    return newReward;
  }
  
  // Redemption operations
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const id = this.redemptionIdCounter++;
    const now = new Date();
    
    // Check if user has enough points
    const user = await this.getUser(redemption.userId);
    const reward = await this.getReward(redemption.rewardId);
    
    if (!user || !reward || user.points < redemption.pointsSpent) {
      throw new Error("Invalid redemption request");
    }
    
    // Deduct points from user
    await this.updateUserPoints(user.id, -redemption.pointsSpent);
    
    const newRedemption: Redemption = {
      ...redemption,
      id,
      redeemedAt: now,
      isApproved: false
    };
    
    this.redemptions.set(id, newRedemption);
    return newRedemption;
  }
  
  async getRedemptionsByUserId(userId: number): Promise<Redemption[]> {
    return Array.from(this.redemptions.values()).filter(
      (redemption) => redemption.userId === userId
    );
  }
  
  async approveRedemption(id: number): Promise<Redemption | undefined> {
    const redemption = this.redemptions.get(id);
    if (!redemption) return undefined;
    
    const updatedRedemption: Redemption = {
      ...redemption,
      isApproved: true
    };
    
    this.redemptions.set(id, updatedRedemption);
    return updatedRedemption;
  }
  
  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]> {
    const userAchievementEntries = Array.from(this.userAchievements.values()).filter(
      (ua) => ua.userId === userId
    );
    
    return userAchievementEntries.map(ua => {
      const achievement = this.achievements.get(ua.achievementId);
      if (!achievement) throw new Error(`Achievement not found: ${ua.achievementId}`);
      
      return {
        ...achievement,
        earnedAt: ua.earnedAt
      };
    });
  }
  
  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    // Check if user already has this achievement
    const existing = Array.from(this.userAchievements.values()).find(
      ua => ua.userId === userAchievement.userId && ua.achievementId === userAchievement.achievementId
    );
    
    if (existing) return existing;
    
    const id = this.userAchievementIdCounter++;
    const now = new Date();
    
    const newUserAchievement: UserAchievement = {
      ...userAchievement,
      id,
      earnedAt: now
    };
    
    this.userAchievements.set(id, newUserAchievement);
    return newUserAchievement;
  }
}

// Export an instance of the storage
export const storage = new MemStorage();
