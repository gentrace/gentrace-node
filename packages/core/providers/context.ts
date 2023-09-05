export type Context = {
  userId?: string;
};

export type SimpleContext = Pick<Context, "userId">;

export type AdvancedContext = Omit<Context, "userId">;
