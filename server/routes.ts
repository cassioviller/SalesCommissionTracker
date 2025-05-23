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
  
  // Rotas para gerenciamento de serviços
  app.get("/api/servicos", async (_req, res) => {
    try {
      const servicos = await storage.getServicos();
      res.json(servicos);
    } catch (error) {
      console.error("Erro ao obter serviços:", error);
      res.status(500).json({ message: "Erro ao obter lista de serviços" });
    }
  });
  
  app.post("/api/servicos", async (req, res) => {
    try {
      const { nome } = req.body;
      
      if (!nome || typeof nome !== "string" || nome.trim() === "") {
        return res.status(400).json({ message: "Nome do serviço é obrigatório" });
      }
      
      const servicos = await storage.addServico(nome.trim());
      res.status(201).json(servicos);
    } catch (error) {
      console.error("Erro ao adicionar serviço:", error);
      res.status(500).json({ message: "Erro ao adicionar serviço" });
    }
  });
  
  app.delete("/api/servicos/:nome", async (req, res) => {
    try {
      const { nome } = req.params;
      
      if (!nome || nome.trim() === "") {
        return res.status(400).json({ message: "Nome do serviço é obrigatório" });
      }
      
      const servicos = await storage.removeServico(nome);
      res.json(servicos);
    } catch (error) {
      console.error("Erro ao remover serviço:", error);
      res.status(500).json({ message: "Erro ao remover serviço" });
    }
  });
  
  // Get all proposals
  app.get("/api/proposals", async (_req, res) => {
    try {
      const proposals = await storage.getAllProposals();
      
      // Calcular campos adicionais para cada proposta com pagamentos
      const proposalsWithCalculations = await Promise.all(proposals.map(async (proposal) => {
        // Obter histórico de pagamentos para cada proposta
        const pagamentosProposta = await storage.getPagamentosPropostaByPropostaId(proposal.id);
        const pagamentosComissao = await storage.getPagamentosComissaoByPropostaId(proposal.id);
        
        // Calcular valor pago a partir do histórico de pagamentos
        const valorPagoCalculado = pagamentosProposta.reduce(
          (total, pagamento) => total + Number(pagamento.valor), 
          0
        );
        
        // Calcular valor de comissão paga a partir do histórico
        const valorComissaoPagaCalculado = pagamentosComissao.reduce(
          (total, pagamento) => total + Number(pagamento.valor), 
          0
        );
        
        const valorTotal = Number(proposal.valorTotal);
        const percentComissao = Number(proposal.percentComissao);
        
        // Calcular saldo em aberto
        const saldoAberto = valorTotal - valorPagoCalculado;
        
        // Calcular valor total da comissão
        const valorComissaoTotal = valorTotal * (percentComissao / 100);
        
        // Calcular comissão em aberto
        const valorComissaoEmAberto = valorComissaoTotal - valorComissaoPagaCalculado;
        
        // Calcular percentual de comissão paga
        const percentComissaoPaga = valorComissaoTotal > 0 
          ? (valorComissaoPagaCalculado / valorComissaoTotal) * 100 
          : 0;
          
        return {
          ...proposal,
          valorPago: valorPagoCalculado.toString(),
          valorComissaoPaga: valorComissaoPagaCalculado.toString(),
          saldoAberto,
          valorComissaoTotal,
          valorComissaoEmAberto,
          percentComissaoPaga
        };
      }));
      
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

      // Obter histórico de pagamentos (parcelas)
      const pagamentosProposta = await storage.getPagamentosPropostaByPropostaId(id);
      
      // Obter histórico de pagamentos de comissões
      const pagamentosComissao = await storage.getPagamentosComissaoByPropostaId(id);
      
      // Calcular valor pago a partir do histórico de pagamentos
      const valorPagoCalculado = pagamentosProposta.reduce(
        (total, pagamento) => total + Number(pagamento.valor), 
        0
      );
      
      // Calcular valor de comissão paga a partir do histórico
      const valorComissaoPagaCalculado = pagamentosComissao.reduce(
        (total, pagamento) => total + Number(pagamento.valor), 
        0
      );
      
      // Calcular campos adicionais
      const valorTotal = Number(proposal.valorTotal);
      const percentComissao = Number(proposal.percentComissao);
      
      // Calcular saldo em aberto
      const saldoAberto = valorTotal - valorPagoCalculado;
      
      // Calcular valor total da comissão
      const valorComissaoTotal = valorTotal * (percentComissao / 100);
      
      // Calcular comissão em aberto
      const valorComissaoEmAberto = valorComissaoTotal - valorComissaoPagaCalculado;
      
      // Calcular percentual de comissão paga
      const percentComissaoPaga = valorComissaoTotal > 0 
        ? (valorComissaoPagaCalculado / valorComissaoTotal) * 100 
        : 0;
      
      // Usar os detalhes de serviço existentes ou criar novos se necessário
      let detalhesServicos = proposal.detalhesServicos || [];
      
      // Se não temos detalhes de serviço mas temos tipos de serviço,
      // criar detalhes iniciais para os serviços que faltam
      if (proposal.tiposServico && Array.isArray(proposal.tiposServico) && proposal.tiposServico.length > 0) {
        const UNIDADES_PADRAO = {
          "Estrutura": "kg",
          "Escada Metálica": "kg", 
          "Pergolado": "kg",
          "Manta Termo Plástica": "m²",
          "Escada Helicoidal": "kg",
          "Laje": "m²",
          "Telha": "m²",
          "Cobertura Metálica": "kg",
          "Manta PVC": "m²",
          "Cobertura Policarbonato": "m²",
          "Beiral": "m",
          "Reforço Metálico": "kg",
          "Mezanino": "m²"
        };
        
        // Se não há detalhes de serviço, criá-los do zero
        if (!detalhesServicos || !Array.isArray(detalhesServicos) || detalhesServicos.length === 0) {
          detalhesServicos = proposal.tiposServico.map(servico => {
            // Verificação segura do tipo para evitar erro de TypeScript
      let unidadePadrao = "kg"; // valor padrão
      if (UNIDADES_PADRAO.hasOwnProperty(servico)) {
        unidadePadrao = UNIDADES_PADRAO[servico as keyof typeof UNIDADES_PADRAO];
      }
            const valorInicial = unidadePadrao === "kg" ? 15 : 100;
            
            return {
              tipo: servico,
              quantidade: 10,
              unidade: unidadePadrao,
              precoUnitario: valorInicial,
              subtotal: 10 * valorInicial
            };
          });
        }
      }
      
      const proposalWithDetails = {
        ...proposal,
        valorPago: valorPagoCalculado.toString(), // Substituir pelos valores calculados
        valorComissaoPaga: valorComissaoPagaCalculado.toString(),
        saldoAberto,
        valorComissaoTotal,
        valorComissaoEmAberto,
        percentComissaoPaga,
        pagamentosProposta,
        pagamentosComissao,
        detalhesServicos
      };

      res.json(proposalWithDetails);
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

      // Converter boolean para string se necessário
      const proposalData = { ...req.body };
      
      // Garantir que comissaoHabilitada é sempre string "true" ou "false"
      if (proposalData.comissaoHabilitada !== undefined) {
        if (typeof proposalData.comissaoHabilitada === 'boolean') {
          proposalData.comissaoHabilitada = proposalData.comissaoHabilitada ? "true" : "false";
        }
      }

      // Use the custom update schema that handles numbers properly
      const validatedData = updateProposalSchema.parse(proposalData);
      
      // Preservar detalhes de serviços existentes se não forem enviados
      if (validatedData.detalhesServicos === undefined) {
        const existingProposal = await storage.getProposal(id);
        if (existingProposal && existingProposal.detalhesServicos) {
          validatedData.detalhesServicos = existingProposal.detalhesServicos;
        }
      }
      
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

  // PAGAMENTOS DE PROPOSTA ROUTES
  // Get pagamentos for a proposal
  app.get("/api/propostas/:id/pagamentos", async (req, res) => {
    try {
      const propostaId = parseInt(req.params.id);
      if (isNaN(propostaId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const pagamentos = await storage.getPagamentosPropostaByPropostaId(propostaId);
      res.json(pagamentos);
    } catch (error) {
      console.error('Error fetching pagamentos:', error);
      res.status(500).json({ message: "Failed to fetch pagamentos" });
    }
  });

  // Add pagamento for a proposal
  app.post("/api/propostas/:id/pagamentos", async (req, res) => {
    try {
      const propostaId = parseInt(req.params.id);
      if (isNaN(propostaId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const data = insertPagamentoPropostaSchema.parse({
        ...req.body,
        propostaId
      });

      const novoPagamento = await storage.addPagamentoProposta({
        ...data,
        propostaId,
        valor: Number(data.valor),
      });

      // Atualizar o valor total pago na proposta
      const pagamentosProposta = await storage.getPagamentosPropostaByPropostaId(propostaId);
      const valorPagoTotal = pagamentosProposta.reduce(
        (total, pagamento) => total + Number(pagamento.valor),
        0
      );

      // Buscar proposta atual
      const proposta = await storage.getProposal(propostaId);
      if (proposta) {
        // Atualizar o valor pago na proposta
        await storage.updateProposal(propostaId, {
          valorPago: valorPagoTotal
        });
      }

      res.status(201).json(novoPagamento);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid pagamento data", 
          errors: error.errors 
        });
      }
      console.error('Error creating pagamento:', error);
      res.status(500).json({ message: "Failed to create pagamento" });
    }
  });

  // Delete pagamento
  app.delete("/api/propostas/pagamentos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Excluir o pagamento - o método deletePagamentoProposta já obtém o propostaId internamente
      // e atualiza automaticamente o valor total da proposta
      const success = await storage.deletePagamentoProposta(id);
      if (!success) {
        return res.status(404).json({ message: "Pagamento not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting pagamento:', error);
      res.status(500).json({ message: "Failed to delete pagamento" });
    }
  });

  // PAGAMENTOS DE COMISSÃO ROUTES
  // Get pagamentos de comissão for a proposal
  app.get("/api/propostas/:id/comissoes", async (req, res) => {
    try {
      const propostaId = parseInt(req.params.id);
      if (isNaN(propostaId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const pagamentos = await storage.getPagamentosComissaoByPropostaId(propostaId);
      res.json(pagamentos);
    } catch (error) {
      console.error('Error fetching pagamentos de comissão:', error);
      res.status(500).json({ message: "Failed to fetch pagamentos de comissão" });
    }
  });

  // Add pagamento de comissão for a proposal
  app.post("/api/propostas/:id/comissoes", async (req, res) => {
    try {
      const propostaId = parseInt(req.params.id);
      if (isNaN(propostaId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const data = insertPagamentoComissaoSchema.parse({
        ...req.body,
        propostaId
      });

      const novoPagamento = await storage.addPagamentoComissao({
        ...data,
        propostaId,
        valor: Number(data.valor),
      });

      // Atualizar o valor total de comissão paga na proposta
      const pagamentosComissao = await storage.getPagamentosComissaoByPropostaId(propostaId);
      const valorComissaoPagoTotal = pagamentosComissao.reduce(
        (total, pagamento) => total + Number(pagamento.valor),
        0
      );

      // Buscar proposta atual
      const proposta = await storage.getProposal(propostaId);
      if (proposta) {
        // Atualizar o valor de comissão paga na proposta
        await storage.updateProposal(propostaId, {
          valorComissaoPaga: valorComissaoPagoTotal
        });
      }

      res.status(201).json(novoPagamento);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid pagamento de comissão data", 
          errors: error.errors 
        });
      }
      console.error('Error creating pagamento de comissão:', error);
      res.status(500).json({ message: "Failed to create pagamento de comissão" });
    }
  });

  // Delete pagamento de comissão
  app.delete("/api/propostas/comissoes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Excluir o pagamento - o método deletePagamentoComissao já obtém o propostaId internamente
      // e atualiza automaticamente o valor total de comissão da proposta
      const success = await storage.deletePagamentoComissao(id);
      if (!success) {
        return res.status(404).json({ message: "Pagamento de comissão not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting pagamento de comissão:', error);
      res.status(500).json({ message: "Failed to delete pagamento de comissão" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
