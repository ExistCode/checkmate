import { v } from "convex/values";
import { internalQuery, query, mutation } from "./_generated/server";

// Public mutation to create user records after Cognito sign-in
export const createUser = mutation({
  args: {
    cognitoId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_cognito_id", (q) => q.eq("cognitoId", args.cognitoId))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      cognitoId: args.cognitoId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      username: args.username,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal query to get user by Cognito subject (used by Convex auth helpers)
export const getUser = internalQuery({
  args: { subject: v.string() },
  async handler(ctx, args) {
    return ctx.db
      .query("users")
      .withIndex("by_cognito_id", (q) => q.eq("cognitoId", args.subject))
      .unique();
  },
});

// Internal query to get user by Cognito ID
export const getUserByCognitoId = internalQuery({
  args: { cognitoId: v.string() },
  async handler(ctx, { cognitoId }) {
    return await ctx.db
      .query("users")
      .withIndex("by_cognito_id", (q) => q.eq("cognitoId", cognitoId))
      .unique();
  },
});

// Public query to get current user profile
export const getCurrentUser = query({
  args: {},
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_cognito_id", (q) => q.eq("cognitoId", identity.subject))
      .unique();
  },
});

// Public query to get all users (for admin purposes)
export const getAllUsers = query({
  args: {},
  async handler(ctx) {
    return await ctx.db
      .query("users")
      .collect()
      .then((users) =>
        users.map((user) => ({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
        }))
      );
  },
});

// Public query to get creator comments
export const getCreatorComments = query({
  args: {
    creatorId: v.string(),
    platform: v.string(),
  },
  async handler(ctx, { creatorId, platform }) {
    const comments = await ctx.db
      .query("creatorComments")
      .withIndex("by_creator_platform", (q) =>
        q.eq("creatorId", creatorId).eq("platform", platform)
      )
      .order("desc")
      .collect();

    const commentsWithUserInfo = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          _id: comment._id,
          comment: comment.content,
          userName: user?.firstName || user?.username || "Anonymous",
          createdAt: comment.createdAt,
        };
      })
    );

    return commentsWithUserInfo;
  },
});

// Public mutation to add creator comment
export const addCreatorComment = mutation({
  args: {
    creatorId: v.string(),
    platform: v.string(),
    comment: v.string(),
    userId: v.string(), // Cognito user sub
    userName: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_cognito_id", (q) => q.eq("cognitoId", args.userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    return await ctx.db.insert("creatorComments", {
      creatorId: args.creatorId,
      platform: args.platform,
      userId: user._id,
      content: args.comment,
      createdAt: now,
      updatedAt: now,
    });
  },
});
