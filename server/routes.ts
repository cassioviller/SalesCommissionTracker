import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProposalSchema, 
  updateProposalSchema, 
  insertPartnerSchema, 
  updatePartnerSchema,
  insertPagamentoPropostaSchema,
  insertPagamentoComissaoSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { DatabaseStorage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with sample data if needed
  if (storage instanceof DatabaseStorage) {
    await storage.seedInitialData();
    console.log("Database initialized with sample data if needed");
  }
  
  // Get all proposals
  app.get("/api/proposals", async (_req, res) => {
    try {
      const proposals = await storage.getAllProposals();
      
      // Calcular campos adicionais para cada proposta
      const proposalsWithCalculations = proposals.map(proposal => {
        const valorTotal = Number(proposal.valorTotal);
        const valorPago = Number(proposal.valorPago);
        const percentComissao = Number(proposal.percentComissao);
        const valorComissaoPaga = Number(proposal.valorComissaoPaga);
        
        // Calcular saldo em aberto
        const saldoAberto = valorTotal - valorPago;
        
        // Calcular valor total da comissão
        const valorComissaoTotal = valorTotal * (percentComissao / 100);
        
        // Calcular comissão em aberto
        const valorComissaoEmAberto = valorComissaoTotal - valorComissaoPaga;
        
        // Calcular percentual de comissão paga
        const percentComissaoPaga = valorComissaoTotal > 0 
          ? (valorComissaoPaga / valorComissaoTotal) * 100 
          : 0;
          
        return {
          ...proposal,
          saldoAberto,
          valorComissaoTotal,
          valorComissaoEmAberto,
          percentComissaoPaga
        };
      });
      
      res.json(proposalsWithCalculations);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  // Get a specific proposal
  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const proposal = await storage.getProposal(id);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      res.json(proposal);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  // Create a new proposal
  app.post("/api/proposals", async (req, res) => {
    try {
      const validatedData = insertProposalSchema.parse(req.body);
      const newProposal = await storage.createProposal(validatedData);
      res.status(201).json(newProposal);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid proposal data", 
          errors: error.errors 
        });
      }
      console.error('Error creating proposal:', error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  // Update an existing proposal
  app.patch("/api/proposals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Use the custom update schema that handles numbers properly
      const validatedData = updateProposalSchema.parse(req.body);
      const updatedProposal = await storage.updateProposal(id, validatedData);
      
      if (!updatedProposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      res.json(updatedProposal);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ 
          message: "Invalid proposal data", 
          errors: error.errors 
        });
      }
      console.error('Update error:', error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  // Delete a proposal
  app.delete("/api/proposals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteProposal(id);
      if (!success) {
        return res.status(404).json({ message: "Proposal not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      res.status(500).json({ message: "Failed to delete proposal" });
    }
  });

  // PARTNER ROUTES
  // Get all partners
  app.get("/api/partners", async (_req, res) => {
    try {
      const partnersList = await storage.getAllPartners();
      res.json(partnersList);
    } catch (error) {
      console.error('Error fetching partners:', error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  // Get a specific partner
  app.get("/api/partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const partner = await storage.getPartner(id);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      res.json(partner);
    } catch (error) {
      console.error('Error fetching partner:', error);
      res.status(500).json({ message: "Failed to fetch partner" });
    }
  });

  // Create a new partner
  app.post("/api/partners", async (req, res) => {
    try {
      const validatedData = insertPartnerSchema.parse(req.body);
      const newPartner = await storage.createPartner(validatedData);
      res.status(201).json(newPartner);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid partner data", 
          errors: error.errors 
        });
      }
      console.error('Error creating partner:', error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  // Update an existing partner
  app.patch("/api/partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Validate the update data
      const validatedData = updatePartnerSchema.parse(req.body);
      const updatedPartner = await storage.updatePartner(id, validatedData);
      
      if (!updatedPartner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      res.json(updatedPartner);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid partner data", 
          errors: error.errors 
        });
      }
      console.error('Error updating partner:', error);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  // Delete a partner
  app.delete("/api/partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deletePartner(id);
      if (!success) {
        return res.status(404).json({ message: "Partner not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting partner:', error);
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
