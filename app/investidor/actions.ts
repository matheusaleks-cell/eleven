"use server";

import { prisma } from "@/lib/prisma";

export async function getInvestorDashboardData(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        projects: {
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
    const activeProjectsCount = investor.projects.filter(p => p.status === "ACTIVE").length;
    
    // Gráfico de evolução de capital
    const chartData: any[] = [];
    // Mapeando dados formatados para a tela
    const formattedProjects = investor.projects.map(project => {
      let projectInvested = project.initialCapital || 0;
      let projectCurrent = projectInvested;
      
      project.cycles.forEach(cycle => {
        if (cycle.status === "COMPLETED") {
          projectCurrent += cycle.investorShare || 0;
          totalYield += cycle.investorShare || 0;
          
          // Add to chart
          const monthLabel = cycle.createdAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          chartData.push({
            month: monthLabel,
            capital: projectCurrent,
            growth: cycle.investorShare || 0,
            date: cycle.createdAt
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

    // Ordenar gráfico por data cronológica e deduplicar se necessário
    chartData.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      success: true,
      data: {
        totalPatrimony,
        totalYield,
        activeProjectsCount,
        chartData: chartData.length > 0 ? chartData : [{ month: "Hoje", capital: totalPatrimony, growth: 0 }],
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
        projects: {
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
    investor.projects.forEach(project => {
      statement.push({
        id: `AP-${project.id.substring(0,6)}`,
        dataStr: project.startDate ? project.startDate.toLocaleDateString("pt-BR") : project.createdAt.toLocaleDateString("pt-BR"),
        dateObj: project.startDate || project.createdAt,
        descricao: `Aporte de Capital - ${project.name}`,
        tipo: "ENTRADA", // Para o dashboard, aporte é a base do patrimônio
        valor: project.initialCapital || 0
      });
    });

    // Rendimentos dos Ciclos
    investor.projects.forEach(project => {
      project.cycles.forEach(cycle => {
        if (cycle.status === "COMPLETED") {
          if (cycle.investorShare > 0) {
            statement.push({
              id: `YC-${cycle.id.substring(0,6)}`,
              dataStr: cycle.updatedAt.toLocaleDateString("pt-BR"),
              dateObj: cycle.updatedAt,
              descricao: `Distribuição de Lucro - ${project.name} (${cycle.cycleName})`,
              tipo: "ENTRADA",
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
        projects: {
          include: {
            cycles: true
          }
        }
      }
    });

    if (!investor) return { success: false, projects: [] };

    const mapped = investor.projects.map(p => {
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
