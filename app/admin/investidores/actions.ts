"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getInvestors() {
  try {
    const investors = await prisma.user.findMany({
      where: { role: "INVESTOR" },
      include: {
        projects: {
          include: {
            cycles: true
          }
        }
      },
      orderBy: { name: "asc" },
    });

    return investors.map(i => {
      const totalInvested = i.projects.reduce((acc, p) => acc + (p.initialCapital || 0), 0);
      
      let totalReceived = 0;
      i.projects.forEach(p => {
        p.cycles.forEach(c => {
          totalReceived += c.investorShare || 0;
        });
      });

      return {
        id: i.id,
        name: i.name,
        email: i.email,
        phone: i.phone || "—",
        projectsCount: i.projects.length,
        totalInvested,
        totalReceived,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar investidores:", error);
    return [];
  }
}

export async function createInvestor(data: any) {
  try {
    const investor = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password, // Em prod, usar bcrypt
        role: "INVESTOR",
      },
    });
    revalidatePath("/admin/investidores");
    return investor;
  } catch (error) {
    console.error("Erro ao criar investidor:", error);
    throw new Error("E-mail já cadastrado ou erro no banco.");
  }
}

export async function getInvestorDetails(id: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            cycles: {
              orderBy: { cycleNumber: "asc" }
            }
          }
        }
      }
    });

    if (!investor) return null;

    let totalInvested = 0;
    let totalReceived = 0;
    let totalCicles = 0;

    const mappedProjects = investor.projects.map(p => {
      totalInvested += p.initialCapital;
      
      let projectReceived = 0;
      p.cycles.forEach(c => {
        if (c.status === "COMPLETED") {
          totalReceived += c.investorShare;
          projectReceived += c.investorShare;
          totalCicles++;
        }
      });

      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles,
        currentCapital: p.initialCapital + projectReceived,
        status: p.status,
      };
    });

    return {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      phone: investor.phone || "—",
      createdAt: investor.createdAt.toISOString(),
      stats: {
        totalInvested,
        totalReceived,
        roi: totalInvested > 0 ? (totalReceived / totalInvested) * 100 : 0,
        activeProjects: investor.projects.length,
        totalCycles: totalCicles
      },
      projects: mappedProjects
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do investidor:", error);
    return null;
  }
}
