import { pgTable, text, serial, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const salesProposals = pgTable("sales_proposals", {
  id: serial("id").primaryKey(),
  proposta: text("proposta").notNull(),
  valorTotal: numeric("valor_total", { precision: 10, scale: 2 }).notNull(),
  valorPago: numeric("valor_pago", { precision: 10, scale: 2 }).notNull(),
  percentComissao: numeric("percent_comissao", { precision: 5, scale: 2 }).notNull(),
  valorComissaoPaga: numeric("valor_comissao_paga", { precision: 10, scale: 2 }).notNull(),
});

// For frontend use: we still accept strings for the form input
export const insertProposalSchema = z.object({
  proposta: z.string(),
  valorTotal: z.string(),
  valorPago: z.string(),
  percentComissao: z.string(),
  valorComissaoPaga: z.string(),
});

// Create a custom validation schema for updates - using numbers as database expects them
export const updateProposalSchema = z.object({
  proposta: z.string().optional(),
  valorTotal: z.number().nonnegative().optional(),
  valorPago: z.number().nonnegative().optional(),
  percentComissao: z.number().min(0).max(100).optional(),
  valorComissaoPaga: z.number().nonnegative().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type SalesProposal = typeof salesProposals.$inferSelect;
export type UpdateProposal = z.infer<typeof updateProposalSchema>;

// Extended proposal type with calculated fields for frontend use
export interface ProposalWithCalculations extends SalesProposal {
  saldoAberto: number;
  valorComissaoTotal: number;
  valorComissaoEmAberto: number;
  percentComissaoPaga: number;
}
