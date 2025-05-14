import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  roleType: text("role_type", { enum: ["parent", "child"] }).notNull(),
  familyId: integer("family_id").notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  avatarColor: text("avatar_color").notNull(),
});

// Relations will be defined after all tables are declared

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  points: true,
  level: true,
});

// Family Schema
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull().unique(),
});

export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
});

// Chore Schema
export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  points: integer("points").notNull(),
  icon: text("icon").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  assignedToId: integer("assigned_to_id").notNull(),
  familyId: integer("family_id").notNull(),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by"),
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
  isCompleted: true, 
  completedAt: true,
});

// Reward Schema
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  icon: text("icon").notNull(),
  familyId: integer("family_id").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  isAvailable: true,
});

// Redemption Schema
export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
  pointsSpent: integer("points_spent").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
});

export const insertRedemptionSchema = createInsertSchema(redemptions).omit({
  id: true,
  redeemedAt: true,
  isApproved: true,
});

// Achievement Schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  backgroundColor: text("background_color").notNull(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

// User Achievement Schema
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserAchievement: unique().on(table.userId, table.achievementId),
  }
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Define all relations
export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
  assignedChores: many(chores, { relationName: "assignedToUser" }),
  createdChores: many(chores, { relationName: "createdByUser" }),
  redemptions: many(redemptions),
  userAchievements: many(userAchievements),
}));

export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  chores: many(chores),
  rewards: many(rewards),
}));

export const choresRelations = relations(chores, ({ one }) => ({
  assignedTo: one(users, {
    fields: [chores.assignedToId],
    references: [users.id],
    relationName: "assignedToUser",
  }),
  createdBy: one(users, {
    fields: [chores.createdBy],
    references: [users.id],
    relationName: "createdByUser",
  }),
  family: one(families, {
    fields: [chores.familyId],
    references: [families.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  family: one(families, {
    fields: [rewards.familyId],
    references: [families.id],
  }),
  redemptions: many(redemptions),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(users, {
    fields: [redemptions.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [redemptions.rewardId],
    references: [rewards.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));
