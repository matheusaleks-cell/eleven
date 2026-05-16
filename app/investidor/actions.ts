"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getInvestorDashboardData(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        investedProjects: {
          include: {
            cycles: {
              orderBy: { cycleNumber: 'asc' }
            }
          }
        }
      }
    });

    if (!investor) throw new Error("Investidor não encontrado");

    let totalPatrimony = 0;
    let totalYield = 0;
    const activeProjectsCount = investor.investedProjects.filter(p => p.status === "ACTIVE").length;
    
    // Gráfico: sempre começa com o aporte inicial de cada projeto
    const chartData: any[] = [];

    const formattedProjects = investor.investedProjects.map(project => {
      let projectInvested = project.initialCapital || 0;
      let projectCurrent = projectInvested;

      // Ponto de partida: data de início do projeto (aporte)
      const startLabel = (project.startDate || project.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      chartData.push({
        name: startLabel,
        capital: projectInvested,
        growth: 0,
        date: project.startDate || project.createdAt
      });
      
      project.cycles.forEach(cycle => {
        if (cycle.status === "COMPLETED") {
          projectCurrent += cycle.investorShare || 0;
          totalYield += cycle.investorShare || 0;
          
          const monthLabel = cycle.updatedAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          chartData.push({
            name: monthLabel,
            capital: projectCurrent,
            growth: cycle.investorShare || 0,
            date: cycle.updatedAt
          });
        }
      });

      totalPatrimony += projectCurrent;

      const yieldPercentage = projectInvested > 0 ? ((projectCurrent - projectInvested) / projectInvested) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        invested: projectInvested,
        current: projectCurrent,
        yield: yieldPercentage.toFixed(1),
        cycle: project.cycles.length
      };
    });

    // Ordenar cronologicamente e remover duplicatas de mesmo label
    chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
    const uniqueChartData = chartData.filter((item, idx, arr) => 
      idx === 0 || item.name !== arr[idx - 1].name
    );

    return {
      success: true,
      data: {
        totalPatrimony,
        totalYield,
        activeProjectsCount,
        chartData: uniqueChartData.length > 0 ? uniqueChartData : [{ name: "Aporte Inicial", capital: totalPatrimony, growth: 0 }],
        projects: formattedProjects
      }
    };
  } catch (error) {
    console.error("Erro ao buscar dados do investidor:", error);
    return { success: false, error: "Falha ao buscar dados" };
  }
}

export async function getInvestorStatement(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        investedProjects: {
          include: {
            cycles: true
          }
        }
      }
    });

    if (!investor) throw new Error("Investidor não encontrado");

    const statement: any[] = [];
    let currentBalance = 0;

    // Aportes Iniciais (Saída do saldo imaginário / Investimento)
    investor.investedProjects.forEach(project => {
      statement.push({
        id: `AP-${project.id.substring(0,6)}`,
        dataStr: project.startDate ? project.startDate.toLocaleDateString("pt-BR") : project.createdAt.toLocaleDateString("pt-BR"),
        dateObj: project.startDate || project.createdAt,
        descricao: `Aporte de Capital - ${project.name}`,
        tipo: "APORTE",
        valor: project.initialCapital || 0
      });
    });

    // Rendimentos dos Ciclos
    investor.investedProjects.forEach(project => {
      project.cycles.forEach(cycle => {
        if (cycle.status === "COMPLETED") {
          if (cycle.investorShare > 0) {
            statement.push({
              id: `YC-${cycle.id.substring(0,6)}`,
              dataStr: cycle.updatedAt.toLocaleDateString("pt-BR"),
              dateObj: cycle.updatedAt,
              descricao: `Distribuição de Lucro - ${project.name} (${cycle.cycleName})`,
              tipo: "RENDIMENTO",
              valor: cycle.investorShare
            });
          }
          if (cycle.reinvestmentShare > 0) {
             statement.push({
              id: `RV-${cycle.id.substring(0,6)}`,
              dataStr: cycle.updatedAt.toLocaleDateString("pt-BR"),
              dateObj: cycle.updatedAt,
              descricao: `Reinvestimento Automático - ${project.name}`,
              tipo: "REINVEST",
              valor: cycle.reinvestmentShare
            });
          }
        }
      });
    });

    // Ordenar cronologicamente para calcular o saldo evolutivo
    statement.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let balance = 0;
    const finalStatement = statement.map(item => {
       balance += item.valor; // Se fosse saque seria "-", mas só temos entradas e reinvestimentos no modelo atual
       return {
         ...item,
         saldo: balance
       };
    });

    // Retorna ordenado do mais recente para o mais antigo para visualização
    return {
      success: true,
      statement: finalStatement.reverse()
    };
  } catch (error) {
    console.error("Erro ao buscar extrato do investidor:", error);
    return { success: false, statement: [] };
  }
}

export async function getInvestorProjects(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        investedProjects: {
          include: {
            cycles: true
          }
        }
      }
    });

    if (!investor) return { success: false, projects: [] };

    const mapped = investor.investedProjects.map(p => {
      let totalReceived = 0;
      p.cycles.forEach(c => {
        if (c.status === "COMPLETED") totalReceived += c.investorShare;
      });

      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        status: p.status,
        initial_capital: p.initialCapital,
        currentCapital: p.initialCapital + totalReceived,
        totalInvestorShare: totalReceived,
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles
      };
    });

    return { success: true, projects: mapped };
  } catch (error) {
    console.error(error);
    return { success: false, projects: [] };
  }
}

export async function getInvestorProjectDetails(id: string, email: string) {
  try {
    const project = await prisma.investmentProject.findFirst({
      where: { id, investor: { email } },
      include: {
        cycles: {
          orderBy: { cycleNumber: "desc" }
        }
      }
    });

    if (!project) return { success: false, project: null };

    let totalReceived = 0;
    const mappedCycles = project.cycles.map(c => {
      if (c.status === "COMPLETED") totalReceived += c.investorShare;
      return {
        id: c.id,
        cycleName: c.cycleName,
        quantity: c.quantity,
        startDate: c.createdAt.toLocaleDateString("pt-BR"),
        investor_profit_share: c.status === "COMPLETED" ? c.investorShare : 0,
        total_investment: c.totalInvestment,
        gross_revenue: c.status === "COMPLETED" ? c.grossRevenue : 0,
        next_cycle_capital: c.status === "COMPLETED" ? c.reinvestmentShare : 0,
        status: c.status
      };
    });

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        product_name: project.productName,
        status: project.status,
        initial_capital: project.initialCapital,
        currentCapital: project.initialCapital + totalReceived,
        totalInvestorShare: totalReceived,
        currentCycle: project.cycles.length,
        max_cycles: project.maxCycles,
        cycles: mappedCycles
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, project: null };
  }
}

export async function getCycleSales(cycleId: string, email: string) {
  try {
    const cycle = await prisma.cycle.findFirst({
      where: { id: cycleId, project: { investor: { email } } },
      include: {
        importLot: {
          include: {
            weapons: {
              where: { currentStatus: "VENDIDA" },
              include: {
                product: true,
                customer: true,
                salesOrder: true
              }
            }
          }
        }
      }
    });

    if (!cycle || !cycle.importLot) return { success: false, sales: [] };

    const sales = cycle.importLot.weapons.map(w => ({
      id: w.id,
      productName: w.product.commercialName,
      serialNumber: w.serialNumber,
      saleDate: w.saleDate?.toLocaleDateString("pt-BR"),
      saleValue: w.saleValue || 0,
      customerName: w.customer?.name || "Cliente Final",
    }));

    const totalSoldValue = sales.reduce((acc, s) => acc + s.saleValue, 0);

    return { success: true, sales, totalSoldValue };
  } catch (error) {
    console.error(error);
    return { success: false, sales: [] };
  }
}

export async function getInvestorProfile(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpfCnpj: true,
        rg: true,
        profession: true,
        address: true,
        bankDetails: true,
        bankReferences: true,
        commercialRefs: true,
        createdAt: true,
      }
    });

    if (!investor) throw new Error("Investidor não encontrado");

    return { success: true, data: investor };
  } catch (error) {
    console.error("Erro ao buscar perfil do investidor:", error);
    return { success: false, error: "Falha ao buscar dados" };
  }
}

export async function updateMyPassword(email: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar própria senha:", error);
    return { success: false, error: "Falha ao atualizar senha." };
  }
}


