import { 
  salesProposals, 
  type SalesProposal, 
  type InsertProposal, 
  type UpdateProposal, 
  type User, 
  type InsertUser, 
  users,
  partners,
  type Partner,
  type InsertPartner,
  type UpdatePartner,
  pagamentoPropostas,
  pagamentoComissoes,
  type PagamentoProposta,
  type PagamentoComissao,
  type InsertPagamentoProposta,
  type InsertPagamentoComissao
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Partner Methods
  getAllPartners(): Promise<Partner[]>;
  getPartner(id: number): Promise<Partner | undefined>;
  getPartnerByUsername(username: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: number, partner: Partial<UpdatePartner>): Promise<Partner | undefined>;
  deletePartner(id: number): Promise<boolean>;
  
  // Sales Proposals Methods
  getAllProposals(): Promise<SalesProposal[]>;
  getProposal(id: number): Promise<SalesProposal | undefined>;
  createProposal(proposal: InsertProposal): Promise<SalesProposal>;
  updateProposal(id: number, proposal: Partial<UpdateProposal>): Promise<SalesProposal | undefined>;
  deleteProposal(id: number): Promise<boolean>;
  
  // Pagamentos de Propostas (Parcelas pagas pelo cliente)
  getPagamentosPropostaByPropostaId(propostaId: number): Promise<PagamentoProposta[]>;
  addPagamentoProposta(pagamento: InsertPagamentoProposta): Promise<PagamentoProposta>;
  deletePagamentoProposta(id: number): Promise<boolean>;
  
  // Pagamentos de Comissão (pagamentos ao parceiro)
  getPagamentosComissaoByPropostaId(propostaId: number): Promise<PagamentoComissao[]>;
  addPagamentoComissao(pagamento: InsertPagamentoComissao): Promise<PagamentoComissao>;
  deletePagamentoComissao(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Partner methods implementation
  async getAllPartners(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async getPartner(id: number): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner || undefined;
  }

  async getPartnerByUsername(username: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.username, username));
    return partner || undefined;
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const [partner] = await db
      .insert(partners)
      .values({
        ...insertPartner,
        proposalIds: insertPartner.proposalIds || []
      })
      .returning();
    return partner;
  }

  async updatePartner(id: number, updateData: Partial<UpdatePartner>): Promise<Partner | undefined> {
    const [updatedPartner] = await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();
    
    return updatedPartner;
  }

  async deletePartner(id: number): Promise<boolean> {
    const result = await db
      .delete(partners)
      .where(eq(partners.id, id))
      .returning({ id: partners.id });
    
    return result.length > 0;
  }

  async getAllProposals(): Promise<SalesProposal[]> {
    return await db.select().from(salesProposals);
  }

  async getProposal(id: number): Promise<SalesProposal | undefined> {
    const [proposal] = await db.select().from(salesProposals).where(eq(salesProposals.id, id));
    return proposal || undefined;
  }

  async createProposal(insertProposal: InsertProposal): Promise<SalesProposal> {
    // Convert from string to numeric for database storage
    const dbProposal = {
      proposta: insertProposal.proposta,
      valorTotal: insertProposal.valorTotal,
      valorPago: insertProposal.valorPago,
      percentComissao: insertProposal.percentComissao,
      valorComissaoPaga: insertProposal.valorComissaoPaga
    };

    const [proposal] = await db
      .insert(salesProposals)
      .values(dbProposal)
      .returning();
    
    return proposal;
  }

  async updateProposal(id: number, updateData: Partial<UpdateProposal>): Promise<SalesProposal | undefined> {
    // Convert numeric values to strings for database compatibility
    const dbUpdateData: Record<string, any> = {};
    
    // Campos de texto básicos
    const textFields = ['proposta', 'nomeCliente', 'tipoCliente', 'dataProposta', 
                        'tipoProjeto', 'tipoContrato', 'recomendacaoDireta', 
                        'faturamentoDireto', 'clienteRecompra'];
                        
    textFields.forEach(field => {
      if (field in updateData) {
        dbUpdateData[field] = updateData[field];
      }
    });
    
    // Campos numéricos que precisam ser convertidos para string
    const numericFields = ['valorTotal', 'valorPago', 'percentComissao', 'valorComissaoPaga',
                          'pesoEstrutura', 'valorPorQuilo', 'valorTotalMaterial', 
                          'tempoNegociacao'];
                          
    numericFields.forEach(field => {
      if (field in updateData && updateData[field] !== undefined) {
        dbUpdateData[field] = updateData[field].toString();
      }
    });
    
    // Array de tipos de serviço
    if ('tiposServico' in updateData) {
      dbUpdateData.tiposServico = updateData.tiposServico;
    }
    
    // console.log('Atualizando proposta:', id, 'com dados:', dbUpdateData);
    
    const [updatedProposal] = await db
      .update(salesProposals)
      .set(dbUpdateData)
      .where(eq(salesProposals.id, id))
      .returning();
    
    return updatedProposal;
  }

  async deleteProposal(id: number): Promise<boolean> {
    const result = await db
      .delete(salesProposals)
      .where(eq(salesProposals.id, id))
      .returning({ id: salesProposals.id });
    
    return result.length > 0;
  }
  
  // Métodos para Pagamentos de Propostas (parcelas pagas pelo cliente)
  async getPagamentosPropostaByPropostaId(propostaId: number): Promise<PagamentoProposta[]> {
    return await db
      .select()
      .from(pagamentoPropostas)
      .where(eq(pagamentoPropostas.propostaId, propostaId))
      .orderBy(pagamentoPropostas.dataPagamento);
  }
  
  async addPagamentoProposta(pagamento: InsertPagamentoProposta): Promise<PagamentoProposta> {
    const [result] = await db
      .insert(pagamentoPropostas)
      .values({
        propostaId: pagamento.propostaId,
        valor: pagamento.valor.toString(),
        dataPagamento: pagamento.dataPagamento,
        observacao: pagamento.observacao
      })
      .returning();
    
    // Atualiza o valor pago total na proposta
    const pagamentos = await this.getPagamentosPropostaByPropostaId(pagamento.propostaId);
    const valorPagoTotal = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
    
    await this.updateProposal(pagamento.propostaId, {
      valorPago: valorPagoTotal
    });
    
    return result;
  }
  
  async deletePagamentoProposta(id: number): Promise<boolean> {
    // Primeiro, obtemos o pagamento para saber qual proposta atualizar depois
    const [pagamento] = await db
      .select()
      .from(pagamentoPropostas)
      .where(eq(pagamentoPropostas.id, id));
    
    if (!pagamento) {
      return false;
    }
    
    // Excluímos o pagamento
    const result = await db
      .delete(pagamentoPropostas)
      .where(eq(pagamentoPropostas.id, id))
      .returning({ id: pagamentoPropostas.id });
    
    if (result.length > 0) {
      // Atualizamos o valor pago total na proposta
      const pagamentos = await this.getPagamentosPropostaByPropostaId(pagamento.propostaId);
      const valorPagoTotal = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
      
      await this.updateProposal(pagamento.propostaId, {
        valorPago: valorPagoTotal
      });
      
      return true;
    }
    
    return false;
  }
  
  // Métodos para Pagamentos de Comissões (pagamentos ao parceiro)
  async getPagamentosComissaoByPropostaId(propostaId: number): Promise<PagamentoComissao[]> {
    return await db
      .select()
      .from(pagamentoComissoes)
      .where(eq(pagamentoComissoes.propostaId, propostaId))
      .orderBy(pagamentoComissoes.dataPagamento);
  }
  
  async addPagamentoComissao(pagamento: InsertPagamentoComissao): Promise<PagamentoComissao> {
    const [result] = await db
      .insert(pagamentoComissoes)
      .values({
        propostaId: pagamento.propostaId,
        valor: pagamento.valor.toString(),
        dataPagamento: pagamento.dataPagamento,
        observacao: pagamento.observacao
      })
      .returning();
    
    // Atualiza o valor de comissão paga total na proposta
    const pagamentos = await this.getPagamentosComissaoByPropostaId(pagamento.propostaId);
    const valorComissaoPagoTotal = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
    
    await this.updateProposal(pagamento.propostaId, {
      valorComissaoPaga: valorComissaoPagoTotal
    });
    
    return result;
  }
  
  async deletePagamentoComissao(id: number): Promise<boolean> {
    // Primeiro, obtemos o pagamento para saber qual proposta atualizar depois
    const [pagamento] = await db
      .select()
      .from(pagamentoComissoes)
      .where(eq(pagamentoComissoes.id, id));
    
    if (!pagamento) {
      return false;
    }
    
    // Excluímos o pagamento
    const result = await db
      .delete(pagamentoComissoes)
      .where(eq(pagamentoComissoes.id, id))
      .returning({ id: pagamentoComissoes.id });
    
    if (result.length > 0) {
      // Atualizamos o valor de comissão paga total na proposta
      const pagamentos = await this.getPagamentosComissaoByPropostaId(pagamento.propostaId);
      const valorComissaoPagoTotal = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
      
      await this.updateProposal(pagamento.propostaId, {
        valorComissaoPaga: valorComissaoPagoTotal
      });
      
      return true;
    }
    
    return false;
  }

  // Helper method to seed the database with initial data if needed
  async seedInitialData(): Promise<void> {
    // Verificar e criar propostas de exemplo
    const proposalResult = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(salesProposals);
    
    if (proposalResult[0].count === 0) {
      const sampleProposals = [
        {
          proposta: "264.24 – Orlando",
          valorTotal: "24500",
          valorPago: "12250",
          percentComissao: "10",
          valorComissaoPaga: "1225"
        },
        {
          proposta: "192.18 – Maria Alice",
          valorTotal: "18750",
          valorPago: "18750",
          percentComissao: "12",
          valorComissaoPaga: "2250"
        },
        {
          proposta: "305.32 – Pedro Souza",
          valorTotal: "42800",
          valorPago: "21400",
          percentComissao: "15",
          valorComissaoPaga: "3210"
        },
        {
          proposta: "178.09 – Alexandre Lima",
          valorTotal: "15300",
          valorPago: "0",
          percentComissao: "8",
          valorComissaoPaga: "0"
        }
      ];

      await db.insert(salesProposals).values(sampleProposals);
    }
    
    // Verificar e criar parceiros de exemplo
    try {
      const partnerResult = await db.select({ 
        count: sql<number>`COUNT(*)` 
      }).from(partners);
      
      if (partnerResult[0].count === 0) {
        console.log("Seeding initial partners...");
        const samplePartners = [
          {
            name: "Parceiro 1",
            username: "parceiro1",
            email: "parceiro1@exemplo.com",
            password: "senha123",
            proposalIds: [1, 2]
          },
          {
            name: "Parceiro 2",
            username: "parceiro2",
            email: "parceiro2@exemplo.com",
            password: "senha123",
            proposalIds: [3]
          }
        ];
  
        await db.insert(partners).values(samplePartners);
        console.log("Initial partners created successfully");
      }
    } catch (error) {
      console.error("Error seeding partner data:", error);
      // Se houver erro ao verificar a tabela, tentamos criá-la
      try {
        // Este comando vai depender do driver que estamos usando
        // Esta é uma alternativa caso o schema do Drizzle não esteja funcionando
        console.log("Attempting to create partners table if it doesn't exist");
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS partners (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            proposal_ids JSONB DEFAULT '[]'
          )
        `);
        console.log("Partners table created successfully");
        
        // Agora tentamos inserir os parceiros de exemplo
        const samplePartners = [
          {
            name: "Admin Estruturas Vale",
            username: "estruturasdv",
            email: "admin@estruturasdovale.com",
            password: "Opala1979",
            proposal_ids: JSON.stringify([])
          },
          {
            name: "Parceiro 1",
            username: "parceiro1",
            email: "parceiro1@exemplo.com",
            password: "senha123",
            proposal_ids: JSON.stringify([1, 2])
          },
          {
            name: "Parceiro 2",
            username: "parceiro2",
            email: "parceiro2@exemplo.com",
            password: "senha123",
            proposal_ids: JSON.stringify([3])
          }
        ];

        // Usando SQL bruto para garantir que funcione
        for (const partner of samplePartners) {
          await db.execute(sql`
            INSERT INTO partners (name, username, email, password, proposal_ids)
            VALUES (${partner.name}, ${partner.username}, ${partner.email}, ${partner.password}, ${partner.proposal_ids}::jsonb)
            ON CONFLICT (username) DO NOTHING
          `);
        }
        console.log("Initial partner data seeded successfully");
      } catch (tableError) {
        console.error("Error creating partners table:", tableError);
      }
    }
  }
}

export const storage = new DatabaseStorage();
