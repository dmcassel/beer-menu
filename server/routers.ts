import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, curatorProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getAvailableMenuCategories, getBeersByMenuCategory } from "./db_additions";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ?? null),
    googleCallback: publicProcedure
      .input(z.object({ credential: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { verifyGoogleToken } = await import("./auth/google");
        const googleUser = await verifyGoogleToken(input.credential);

        // Upsert user in database
        await db.upsertUser({
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          lastSignedIn: new Date(),
        });

        // Get user from database to get role and ID
        const user = await db.getUserByGoogleId(googleUser.googleId);
        if (!user) {
          throw new Error("Failed to create user");
        }

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(
          COOKIE_NAME,
          JSON.stringify({ userId: user.id }),
          cookieOptions
        );

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions });
      return {
        success: true,
      } as const;
    }),
  }),

  // Beer Catalog CRUD routers
  bjcpCategory: router({
    list: publicProcedure.query(() => db.getAllBJCPCategories()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getBJCPCategoryById(input.id)),
    create: curatorProcedure
      .input(z.object({ label: z.string(), name: z.string() }))
      .mutation(({ input }) => db.createBJCPCategory(input)),
    update: curatorProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().optional(),
          name: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.updateBJCPCategory(input.id, {
          label: input.label,
          name: input.name,
        })
      ),
    delete: curatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteBJCPCategory(input.id)),
  }),

  style: router({
    list: publicProcedure.query(() => db.getAllStyles()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getStyleById(input.id)),
    create: curatorProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          bjcpId: z.number().optional(),
          bjcpLink: z.string().optional(),
          menuCategoryId: z.number().optional(),
        })
      )
      .mutation(({ input }) => db.createStyle(input)),
    update: curatorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          bjcpId: z.number().optional(),
          bjcpLink: z.string().optional(),
          menuCategoryId: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateStyle(id, data);
      }),
    delete: curatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteStyle(input.id)),
  }),

  brewery: router({
    list: publicProcedure.query(() => db.getAllBreweries()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getBreweryById(input.id)),
    create: curatorProcedure
      .input(z.object({ name: z.string(), location: z.string().optional() }))
      .mutation(({ input }) => db.createBrewery(input)),
    update: curatorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          location: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.updateBrewery(input.id, {
          name: input.name,
          location: input.location,
        })
      ),
    delete: curatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteBrewery(input.id)),
  }),

  beer: router({
    list: publicProcedure.query(() => db.getAllBeers()),
    listAvailable: publicProcedure.query(() => db.getAllAvailableBeers()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getBeerById(input.id)),
    create: curatorProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          breweryId: z.number().optional(),
          styleId: z.number().optional(),
          abv: z.string().optional(),
          ibu: z.number().optional(),
          status: z.enum(["on_tap", "bottle_can", "out"]).optional(),
        })
      )
      .mutation(({ input }) => db.createBeer(input)),
    update: curatorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          breweryId: z.number().optional(),
          styleId: z.number().optional(),
          abv: z.string().optional(),
          ibu: z.number().optional(),
          status: z.enum(["on_tap", "bottle_can", "out"]).optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateBeer(id, data);
      }),
    delete: curatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteBeer(input.id)),
  }),

  menuCategory: router({
    list: publicProcedure.query(() => db.getAllMenuCategories()),
    listAvailable: publicProcedure.query(() => getAvailableMenuCategories()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getMenuCategoryById(input.id)),
    getBeersByCategory: publicProcedure
      .input(z.object({ menuCatId: z.number() }))
      .query(({ input }) => getBeersByMenuCategory(input.menuCatId)),
    create: curatorProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(({ input }) => db.createMenuCategory(input)),
    update: curatorProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.updateMenuCategory(input.id, {
          name: input.name,
          description: input.description,
        })
      ),
    delete: curatorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMenuCategory(input.id)),
  }),

  menuCategoryBeer: router({
    getBeersInCategory: publicProcedure
      .input(z.object({ menuCatId: z.number() }))
      .query(({ input }) => db.getBeersInMenuCategory(input.menuCatId)),
    addBeerToCategory: curatorProcedure
      .input(z.object({ menuCatId: z.number(), beerId: z.number() }))
      .mutation(({ input }) => db.addBeerToMenuCategory(input)),
    removeBeerFromCategory: curatorProcedure
      .input(z.object({ menuCatId: z.number(), beerId: z.number() }))
      .mutation(({ input }) =>
        db.removeBeerFromMenuCategory(input.menuCatId, input.beerId)
      ),
  }),
});

export type AppRouter = typeof appRouter;
