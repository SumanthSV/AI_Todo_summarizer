import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

export const listTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getTodoStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const highPriority = todos.filter(todo => todo.priority === "high" && !todo.completed).length;

    return { total, completed, pending, highPriority };
  },
});

export const createTodo = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const todoId = await ctx.db.insert("todos", {
      userId,
      title: args.title,
      description: args.description,
      completed: false,
      priority: args.priority,
      category: args.category,
      dueDate: args.dueDate,
    });

    return todoId;
  },
});

export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== userId) {
      throw new Error("Todo not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      completed: !todo.completed,
    });
  },
});

export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== userId) {
      throw new Error("Todo not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const generateSummary = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const todos = await ctx.runQuery(api.todos.listTodos);
    const stats = await ctx.runQuery(api.todos.getTodoStats);

    if (todos.length === 0) {
      return "You don't have any todos yet. Start by adding some tasks to get personalized insights!";
    }

    const todoText: string = todos.map((todo: any) => 
      `${todo.completed ? '✅' : '⏳'} ${todo.title} (${todo.priority} priority)${todo.description ? ` - ${todo.description}` : ''}${todo.category ? ` [${todo.category}]` : ''}`
    ).join('\n');

    const prompt: string = `Analyze this todo list and provide a personalized summary with insights:

Todo List:
${todoText}

Stats:
- Total todos: ${stats.total}
- Completed: ${stats.completed}
- Pending: ${stats.pending}
- High priority pending: ${stats.highPriority}

Please provide:
1. A brief overview of their productivity
2. Key patterns or themes in their tasks
3. Suggestions for prioritization
4. Motivational insights
5. Areas for improvement

Keep it encouraging and actionable, around 150-200 words.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const summary: string = response.choices[0].message.content || "Unable to generate summary";

    // Save the summary
    await ctx.runMutation(internal.todos.saveSummary, {
      userId,
      content: summary,
      todoCount: stats.total,
      completedCount: stats.completed,
      pendingCount: stats.pending,
      insights: summary,
    });

    return summary;
  },
});

export const saveSummary = internalMutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    todoCount: v.number(),
    completedCount: v.number(),
    pendingCount: v.number(),
    insights: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete old summaries to keep only the latest
    const oldSummaries = await ctx.db
      .query("summaries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const summary of oldSummaries) {
      await ctx.db.delete(summary._id);
    }

    // Insert new summary
    await ctx.db.insert("summaries", args);
  },
});

export const getLatestSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const summary = await ctx.db
      .query("summaries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return summary;
  },
});
