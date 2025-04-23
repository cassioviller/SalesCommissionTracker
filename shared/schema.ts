import { pgTable, text, serial, numeric, integer, json, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  proposalIds: json("proposal_ids").$type<number[]>().default([]),
});

export const insertPartnerSchema = z.object({
  name: z.string().min(1, { message: "O nome é obrigatório" }),
  username: z.string().min(1, { message: "O usuário é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  proposalIds: z.array(z.number()).optional(),
});

export const updatePartnerSchema = z.object({
  name: z.string().min(1, { message: "O nome é obrigatório" }).optional(),
  username: z.string().min(1, { message: "O usuário é obrigatório" }).optional(),
  email: z.string().email({ message: "Email inválido" }).optional(),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }).optional(),
  proposalIds: z.array(z.number()).optional(),
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

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type UpdatePartner = z.infer<typeof updatePartnerSchema>;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type SalesProposal = typeof salesProposals.$inferSelect;
export type UpdateProposal = z.infer<typeof updateProposalSchema>;

// Extended proposal type with calculated fields for frontend use
// Histórico de pagamentos de proposta (parcelas pagas pelo cliente)
export const pagamentoPropostas = pgTable("pagamento_propostas", {
  id: serial("id").primaryKey(),
  propostaId: integer("proposta_id").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  dataPagamento: date("data_pagamento").notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Histórico de pagamentos de comissão (pagamentos ao parceiro)
export const pagamentoComissoes = pgTable("pagamento_comissoes", {
  id: serial("id").primaryKey(),
  propostaId: integer("proposta_id").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  dataPagamento: date("data_pagamento").notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Esquemas de inserção/atualização
export const insertPagamentoPropostaSchema = z.object({
  propostaId: z.number(),
  valor: z.number().nonnegative(),
  dataPagamento: z.string(),
  observacao: z.string().optional(),
});

export const insertPagamentoComissaoSchema = z.object({
  propostaId: z.number(),
  valor: z.number().nonnegative(),
  dataPagamento: z.string(),
  observacao: z.string().optional(),
});

// Tipos
export type InsertPagamentoProposta = z.infer<typeof insertPagamentoPropostaSchema>;
export type PagamentoProposta = typeof pagamentoPropostas.$inferSelect;

export type InsertPagamentoComissao = z.infer<typeof insertPagamentoComissaoSchema>;
export type PagamentoComissao = typeof pagamentoComissoes.$inferSelect;

export interface ProposalWithCalculations extends SalesProposal {
  saldoAberto: number;
  valorComissaoTotal: number;
  valorComissaoEmAberto: number;
  percentComissaoPaga: number;
  pagamentosProposta?: PagamentoProposta[];
  pagamentosComissao?: PagamentoComissao[];
}
