import { nanoid } from "nanoid";
import session from "express-session";
import {
  User, InsertUser,
  Family, InsertFamily,
  Chore, InsertChore,
  Reward, InsertReward,
  Redemption, InsertRedemption,
  Achievement, InsertAchievement,
  UserAchievement, InsertUserAchievement
} from "@shared/schema";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  // Session store
  sessionStore: any; // Express session store

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

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();