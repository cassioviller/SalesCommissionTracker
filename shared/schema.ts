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
  comissaoHabilitada: text("comissao_habilitada").default("true").notNull(),
  
  // Novos campos para proposta detalhada
  nomeCliente: text("nome_cliente"),
  tipoCliente: text("tipo_cliente"), // "Arquiteto", "Construtor", "Cliente Final"
  tiposServico: json("tipos_servico").$type<string[]>().default([]), // Array de serviços
  detalhesServicos: json("detalhes_servicos").$type<ServicoDetalhe[]>().default([]), // Detalhes dos serviços
  dataProposta: date("data_proposta"),
  tipoProjeto: text("tipo_projeto"), // "PE", "PE + PC", "Nenhum"
  tipoContrato: text("tipo_contrato"), // "MP", "MO", "MP + MO"
  pesoEstrutura: numeric("peso_estrutura", { precision: 10, scale: 2 }),
  valorPorQuilo: numeric("valor_por_quilo", { precision: 10, scale: 2 }),
  valorTotalMaterial: numeric("valor_total_material", { precision: 10, scale: 2 }),
  recomendacaoDireta: text("recomendacao_direta").default("nao"), // sim/nao
  faturamentoDireto: text("faturamento_direto").default("nao"), // sim/nao
  tempoNegociacao: integer("tempo_negociacao"), // em dias
  clienteRecompra: text("cliente_recompra").default("nao"), // sim/nao
});

// Constantes para opções selecionáveis
export const TIPOS_CLIENTE = ["Arquiteto", "Construtor", "Cliente Final", "Trafego Pago/Redes Sociais", "BNI", "POLO"] as const;
// Definido como 'let' para permitir adicionar novos serviços dinamicamente
export let TIPOS_SERVICO = ["Estrutura", "Telha", "Manta PVC", "Manta Termo Plástica", "Cobertura Metálica", 
                              "Cobertura Policarbonato", "Escada Metálica", "Pergolado", "Beiral", 
                              "Escada Helicoidal", "Mezanino", "Reforço Metálico", "Laje"];
export const TIPOS_UNIDADE = ["kg", "m²", "m", "uni", "vb", "pç"] as const;
export const TIPOS_PROJETO = ["PE", "PE + PC", "Nenhum"] as const;
export const TIPOS_CONTRATO = ["MP", "MO", "MP + MO"] as const;

// Tabela de correspondência padrão para as unidades de medida
export const UNIDADES_MEDIDA_PADRÃO: Record<string, typeof TIPOS_UNIDADE[number]> = {
  "Estrutura": "kg",
  "Escada Metálica": "kg",
  "Pergolado": "kg",
  "Manta Termo Plástica": "m²",
  "Escada Helicoidal": "kg",
  "Laje": "m²",
  "Telha": "m²",
  "Cobertura Metálica": "m²",
  "Manta PVC": "m²",
  "Cobertura Policarbonato": "m²",
  "Beiral": "m²",
  "Reforço Metálico": "kg",
  "Mezanino": "kg"
};

// Interface para detalhes do serviço
export interface ServicoDetalhe {
  tipo: string; // Tipo do serviço
  quantidade: number; // Quantidade
  unidade: string; // Unidade de medida - mais flexível para aceitar valores dinâmicos
  precoUnitario: number; // Preço unitário
  subtotal: number; // Subtotal calculado
}

// Array de serviços detalhados
export type ServicosDetalhados = ServicoDetalhe[];

// For frontend use: we still accept strings for the form input
export const insertProposalSchema = z.object({
  proposta: z.string(),
  valorTotal: z.string(),
  valorPago: z.string(),
  percentComissao: z.string(),
  valorComissaoPaga: z.string(),
  comissaoHabilitada: z.enum(["true", "false"]).default("true"),
  
  // Campos opcionais para proposta detalhada
  nomeCliente: z.string().optional(),
  tipoCliente: z.enum(TIPOS_CLIENTE).optional(),
  tiposServico: z.array(z.string()).optional(),
  detalhesServicos: z.array(
    z.object({
      tipo: z.string(),
      quantidade: z.number(),
      unidade: z.enum(TIPOS_UNIDADE),
      precoUnitario: z.number(),
      subtotal: z.number()
    })
  ).optional(),
  dataProposta: z.string().optional(), // data em formato string
  tipoProjeto: z.enum(TIPOS_PROJETO).nullable().optional(),
  tipoContrato: z.enum(TIPOS_CONTRATO).nullable().optional(),
  pesoEstrutura: z.string().optional(), // número em formato string
  valorPorQuilo: z.string().optional(), // número em formato string
  valorTotalMaterial: z.string().optional(), // número em formato string
  recomendacaoDireta: z.enum(["sim", "nao"]).optional(),
  faturamentoDireto: z.enum(["sim", "nao"]).optional(),
  tempoNegociacao: z.string().optional(), // número em formato string
  clienteRecompra: z.enum(["sim", "nao"]).optional(),
});

// Create a custom validation schema for updates - using numbers as database expects them
export const updateProposalSchema = z.object({
  proposta: z.string().optional(),
  valorTotal: z.number().nonnegative().optional(),
  valorPago: z.number().nonnegative().optional(),
  percentComissao: z.number().min(0).max(100).optional(),
  valorComissaoPaga: z.number().nonnegative().optional(),
  comissaoHabilitada: z.enum(["true", "false"]).optional(),
  
  // Campos opcionais para proposta detalhada
  nomeCliente: z.string().optional(),
  tipoCliente: z.enum(TIPOS_CLIENTE).optional(),
  tiposServico: z.array(z.string()).optional(),
  detalhesServicos: z.array(
    z.object({
      tipo: z.string(),
      quantidade: z.number(),
      unidade: z.enum(TIPOS_UNIDADE),
      precoUnitario: z.number(),
      subtotal: z.number()
    })
  ).optional(),
  dataProposta: z.string().optional(), // data em formato string
  tipoProjeto: z.enum(TIPOS_PROJETO).nullable().optional(),
  tipoContrato: z.enum(TIPOS_CONTRATO).nullable().optional(),
  pesoEstrutura: z.number().nonnegative().nullable().optional(),
  valorPorQuilo: z.number().nonnegative().optional(),
  valorTotalMaterial: z.number().nonnegative().optional(),
  recomendacaoDireta: z.enum(["sim", "nao"]).optional(),
  faturamentoDireto: z.enum(["sim", "nao"]).optional(),
  tempoNegociacao: z.number().nonnegative().optional(),
  clienteRecompra: z.enum(["sim", "nao"]).optional(),
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

export interface ProposalWithCalculations extends Omit<SalesProposal, 'detalhesServicos'> {
  saldoAberto: number;
  valorComissaoTotal: number;
  valorComissaoEmAberto: number;
  percentComissaoPaga: number;
  pagamentosProposta?: PagamentoProposta[];
  pagamentosComissao?: PagamentoComissao[];
  detalhesServicos?: ServicoDetalhe[] | null;
}
