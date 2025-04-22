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
  type UpdatePartner
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
    
    if (updateData.proposta !== undefined) {
      dbUpdateData.proposta = updateData.proposta;
    }
    
    if (updateData.valorTotal !== undefined) {
      dbUpdateData.valorTotal = updateData.valorTotal.toString();
    }
    
    if (updateData.valorPago !== undefined) {
      dbUpdateData.valorPago = updateData.valorPago.toString();
    }
    
    if (updateData.percentComissao !== undefined) {
      dbUpdateData.percentComissao = updateData.percentComissao.toString();
    }
    
    if (updateData.valorComissaoPaga !== undefined) {
      dbUpdateData.valorComissaoPaga = updateData.valorComissaoPaga.toString();
    }
    
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

  // Helper method to seed the database with initial data if needed
  async seedInitialData(): Promise<void> {
    const result = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(salesProposals);
    
    if (result[0].count === 0) {
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
  }
}

export const storage = new DatabaseStorage();
