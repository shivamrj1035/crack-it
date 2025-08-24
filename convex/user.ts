import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createNewUser =mutation({
    args: { name: v.string(), imageUrl: v.string(), email: v.string() },
    handler: async (ctx, args) => {
        // If user already exists, return early
        const existingUser = await ctx.db.query("userTable").filter((q) => q.eq(q.field("email"), args.email)).collect();
        // Create a new user in the userTable
        if (existingUser.length == 0) {
            const data = {
                name:args.name,
                imageUrl: args.imageUrl,
                email: args.email,
            }
            const result = await ctx.db.insert("userTable", {...data} );

            console.log(result)
            return {
                ...data,
                result
            };
        }

        return existingUser[0]; // Return existing user if found

    }
})