import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MemberRole, FirmRole, BoxStatus, ExpenseType, ContactType, ContactRole, RelationStatus, InviterType, PrismaClient } from ".prisma/client";

// Lazy import prisma to avoid initialization issues with Turbopack
async function getPrisma(): Promise<PrismaClient> {
  const { default: prisma } = await import("@/lib/prisma");
  return prisma;
}

// Only allow in development
const isDev = process.env.NODE_ENV === "development";

// Test accounts configuration
const TEST_ACCOUNTS = [
  { email: "owner@business.com", name: "สมชาย เจ้าของธุรกิจ", orgRole: MemberRole.OWNER },
  { email: "owner2@company.com", name: "สมหญิง เจ้าของบริษัท", orgRole: MemberRole.OWNER },
  { email: "admin@business.com", name: "อดิศร ผู้ดูแล", orgRole: MemberRole.ADMIN },
  { email: "accounting@business.com", name: "บัญชา นักบัญชี", orgRole: MemberRole.ACCOUNTING },
  { email: "staff@business.com", name: "พนักงาน ทั่วไป", orgRole: MemberRole.STAFF },
  { email: "firm@accounting.com", name: "วิชัย สำนักบัญชี", firmRole: FirmRole.OWNER },
  { email: "staff@accounting.com", name: "นักบัญชี สำนักงาน", firmRole: FirmRole.ACCOUNTANT },
];

const TEST_CONTACTS = [
  { name: "บริษัท ซัพพลายเออร์ A จำกัด", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105561234567" },
  { name: "ร้านค้าส่ง B", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105567891234" },
  { name: "นายสมศักดิ์ รับจ้าง", type: ContactType.INDIVIDUAL, role: ContactRole.VENDOR },
  { name: "บริษัท ลูกค้า X จำกัด", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0105598765432" },
  { name: "หจก. ลูกค้า Y", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0103512345678" },
];

const TEST_CATEGORIES = [
  { code: "OFC", name: "ค่าใช้จ่ายสำนักงาน", type: "EXPENSE" },
  { code: "TRV", name: "ค่าเดินทาง", type: "EXPENSE" },
  { code: "MTG", name: "ค่าประชุม/สัมมนา", type: "EXPENSE" },
  { code: "UTL", name: "ค่าสาธารณูปโภค", type: "EXPENSE" },
  { code: "MKT", name: "ค่าการตลาด/โฆษณา", type: "EXPENSE" },
  { code: "EQP", name: "ค่าอุปกรณ์", type: "EXPENSE" },
  { code: "SAL", name: "รายได้จากการขาย", type: "INCOME" },
  { code: "SVC", name: "รายได้จากบริการ", type: "INCOME" },
];

// Using new 4-status system: DRAFT, PENDING, NEED_DOCS, COMPLETED
const BOX_TEMPLATES = [
  { title: "ค่าเช่าออฟฟิศ ม.ค.", status: BoxStatus.COMPLETED, amount: 35000, hasVat: true, hasWht: true, whtRate: 5 },
  { title: "ค่าน้ำมันรถ", status: BoxStatus.PENDING, amount: 2500, hasVat: true, hasWht: false },
  { title: "ค่าอินเทอร์เน็ต", status: BoxStatus.PENDING, amount: 1200, hasVat: true, hasWht: false },
  { title: "ค่าจ้างออกแบบ", status: BoxStatus.NEED_DOCS, amount: 15000, hasVat: true, hasWht: true, whtRate: 3 },
  { title: "ค่าที่ปรึกษา", status: BoxStatus.PENDING, amount: 50000, hasVat: true, hasWht: true, whtRate: 3 },
  { title: "ค่าโฆษณา Facebook", status: BoxStatus.PENDING, amount: 8500, hasVat: false, hasWht: false },
  { title: "ค่าอุปกรณ์คอมพิวเตอร์", status: BoxStatus.COMPLETED, amount: 25000, hasVat: true, hasWht: false },
  { title: "ค่าบริการ AWS", status: BoxStatus.PENDING, amount: 3200, hasVat: false, hasWht: false },
  { title: "ค่าทำความสะอาด", status: BoxStatus.PENDING, amount: 4500, hasVat: true, hasWht: true, whtRate: 1 },
  { title: "ค่าซ่อมแอร์", status: BoxStatus.PENDING, amount: 6800, hasVat: true, hasWht: true, whtRate: 3 },
];

async function createSupabaseUser(prisma: PrismaClient, email: string, name: string): Promise<string | null> {
  console.log("[Seed API] Creating Supabase user:", email);
  
  // Check if service role key is available
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[Seed API] SUPABASE_SERVICE_ROLE_KEY not set, using signUp fallback");
    // Fallback to regular signUp
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: "password123",
      options: { data: { name } },
    });
    
    if (error) {
      if (error.message.includes("already registered")) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        return existingUser?.supabaseId || null;
      }
      console.error(`[Seed API] SignUp error ${email}:`, error);
      return null;
    }
    return data.user?.id || null;
  }
  
  try {
    // Use admin client to create users
    const supabaseAdmin = createAdminClient();
    
    // Try to create the user with admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true, // Auto-confirm email
      user_metadata: { name },
    });

    if (error) {
      // If user already exists, try to get their ID
      if (error.message.includes("already been registered") || error.message.includes("duplicate key")) {
        console.log("[Seed API] User already exists, looking up:", email);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser?.supabaseId) {
          return existingUser.supabaseId;
        }
        
        // Try to find in Supabase by email
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingSupabaseUser = listData?.users?.find(u => u.email === email);
        return existingSupabaseUser?.id || null;
      }
      console.error(`[Seed API] Error creating Supabase user ${email}:`, error);
      return null;
    }

    console.log("[Seed API] Created Supabase user:", data.user?.id);
    return data.user?.id || null;
  } catch (error) {
    console.error(`[Seed API] Exception creating user ${email}:`, error);
    return null;
  }
}

async function seedAccounts(prisma: PrismaClient) {
  const results: string[] = [];

  // Create main organization
  let mainOrg = await prisma.organization.findFirst({
    where: { slug: "abc-company" },
  });

  if (!mainOrg) {
    mainOrg = await prisma.organization.create({
      data: {
        name: "บริษัท ABC จำกัด",
        slug: "abc-company",
        taxId: "0105512345678",
        address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
        phone: "02-123-4567",
        email: "contact@abc-company.com",
      },
    });
    results.push(`Created organization: ${mainOrg.name}`);
  }

  // Create second organization
  let secondOrg = await prisma.organization.findFirst({
    where: { slug: "xyz-cafe" },
  });

  if (!secondOrg) {
    secondOrg = await prisma.organization.create({
      data: {
        name: "ร้านกาแฟ XYZ",
        slug: "xyz-cafe",
        taxId: "0105598765432",
        address: "456 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
        phone: "02-987-6543",
        email: "contact@xyz-cafe.com",
      },
    });
    results.push(`Created organization: ${secondOrg.name}`);
  }

  // Create accounting firm
  let firm = await prisma.accountingFirm.findFirst({
    where: { slug: "wichai-accounting" },
  });

  if (!firm) {
    firm = await prisma.accountingFirm.create({
      data: {
        name: "สำนักงานบัญชี วิชัย",
        slug: "wichai-accounting",
        taxId: "0105567890123",
        address: "789 ถนนรัชดา แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
        phone: "02-567-8901",
        email: "contact@wichai-accounting.com",
      },
    });
    results.push(`Created accounting firm: ${firm.name}`);
  }

  // Get owner user for creating relations (will be set after user creation loop)
  let ownerUser = await prisma.user.findUnique({ where: { email: "owner@business.com" } });
  let owner2User = await prisma.user.findUnique({ where: { email: "owner2@company.com" } });

  // Create users and memberships
  for (const account of TEST_ACCOUNTS) {
    let user = await prisma.user.findUnique({ where: { email: account.email } });

    if (!user) {
      const supabaseId = await createSupabaseUser(prisma, account.email, account.name);
      
      if (supabaseId) {
        user = await prisma.user.create({
          data: {
            email: account.email,
            name: account.name,
            supabaseId,
          },
        });
        results.push(`Created user: ${account.name}`);
      }
    }

    if (user) {
      // Create organization membership
      if (account.orgRole) {
        const targetOrg = account.email === "owner2@company.com" ? secondOrg : mainOrg;
        const existingMembership = await prisma.organizationMember.findFirst({
          where: { userId: user.id, organizationId: targetOrg.id },
        });

        if (!existingMembership) {
          await prisma.organizationMember.create({
            data: {
              userId: user.id,
              organizationId: targetOrg.id,
              role: account.orgRole,
              joinedAt: new Date(),
            },
          });
          results.push(`Added ${account.name} to ${targetOrg.name} as ${account.orgRole}`);
        }
      }

      // Create firm membership
      if (account.firmRole && firm) {
        const existingFirmMembership = await prisma.firmMember.findFirst({
          where: { userId: user.id, firmId: firm.id },
        });

        if (!existingFirmMembership) {
          await prisma.firmMember.create({
            data: {
              userId: user.id,
              firmId: firm.id,
              role: account.firmRole,
            },
          });
          results.push(`Added ${account.name} to ${firm.name} as ${account.firmRole}`);
        }
      }
    }
  }

  // Re-fetch owner users after creation loop
  ownerUser = await prisma.user.findUnique({ where: { email: "owner@business.com" } });
  owner2User = await prisma.user.findUnique({ where: { email: "owner2@company.com" } });

  // Create Firm-Client Relations (Business-to-Firm Invitation Model)
  // SME invites Firm to manage their accounts
  if (firm && ownerUser) {
    // Main org invites firm
    const existingRelation1 = await prisma.firmClientRelation.findUnique({
      where: { firmId_organizationId: { firmId: firm.id, organizationId: mainOrg.id } },
    });

    if (!existingRelation1) {
      await prisma.firmClientRelation.create({
        data: {
          firmId: firm.id,
          organizationId: mainOrg.id,
          status: RelationStatus.ACTIVE,
          invitedByUserId: ownerUser.id,
          invitedByType: InviterType.BUSINESS,
          respondedAt: new Date(),
        },
      });
      results.push(`Created firm-client relation: ${mainOrg.name} → ${firm.name} (ACTIVE)`);
    }
  }

  if (firm && owner2User) {
    // Second org invites firm (PENDING - waiting for firm to accept)
    const existingRelation2 = await prisma.firmClientRelation.findUnique({
      where: { firmId_organizationId: { firmId: firm.id, organizationId: secondOrg.id } },
    });

    if (!existingRelation2) {
      await prisma.firmClientRelation.create({
        data: {
          firmId: firm.id,
          organizationId: secondOrg.id,
          status: RelationStatus.PENDING,
          invitedByUserId: owner2User.id,
          invitedByType: InviterType.BUSINESS,
        },
      });
      results.push(`Created firm-client relation: ${secondOrg.name} → ${firm.name} (PENDING)`);
    }
  }

  return results;
}

async function seedContacts(prisma: PrismaClient, organizationId: string) {
  const results: string[] = [];

  for (const contact of TEST_CONTACTS) {
    const existing = await prisma.contact.findFirst({
      where: { organizationId, name: contact.name },
    });

    if (!existing) {
      await prisma.contact.create({
        data: {
          organizationId,
          name: contact.name,
          contactType: contact.type,
          contactRole: contact.role,
          taxId: contact.taxId,
          whtApplicable: contact.role === ContactRole.VENDOR,
          defaultWhtRate: contact.role === ContactRole.VENDOR ? 3 : null,
        },
      });
      results.push(`Created contact: ${contact.name}`);
    }
  }

  return results;
}

async function seedCategories(prisma: PrismaClient, organizationId: string) {
  const results: string[] = [];

  for (const cat of TEST_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { organizationId, code: cat.code },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          organizationId,
          code: cat.code,
          name: cat.name,
          categoryType: cat.type as "EXPENSE" | "INCOME",
        },
      });
      results.push(`Created category: ${cat.name}`);
    }
  }

  return results;
}

async function seedBoxes(prisma: PrismaClient, organizationId: string, userId: string) {
  const results: string[] = [];

  // Get contacts and categories
  const contacts = await prisma.contact.findMany({
    where: { organizationId, contactRole: ContactRole.VENDOR },
  });
  const categories = await prisma.category.findMany({
    where: { organizationId, categoryType: "EXPENSE" },
  });

  for (let i = 0; i < BOX_TEMPLATES.length; i++) {
    const template = BOX_TEMPLATES[i];
    const boxNumber = `BOX-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    
    const existing = await prisma.box.findFirst({
      where: { organizationId, boxNumber },
    });

    if (!existing) {
      const contact = contacts[i % contacts.length];
      const category = categories[i % categories.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const boxDate = new Date();
      boxDate.setDate(boxDate.getDate() - daysAgo);

      const vatAmount = template.hasVat ? Math.round(template.amount * 7 / 107) : 0;
      const baseForWht = template.amount - vatAmount;
      const whtAmount = template.hasWht && template.whtRate
        ? Math.round(baseForWht * (template.whtRate / 100))
        : 0;

      await prisma.box.create({
        data: {
          organizationId,
          createdById: userId,
          boxNumber,
          title: template.title,
          description: `รายละเอียด ${template.title}`,
          boxDate,
          status: template.status,
          expenseType: ExpenseType.STANDARD,
          totalAmount: template.amount,
          hasVat: template.hasVat,
          vatAmount,
          hasWht: template.hasWht,
          whtRate: template.whtRate || 0,
          whtAmount,
          contactId: contact?.id,
          categoryId: category?.id,
        },
      });
      results.push(`Created box: ${template.title}`);
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  console.log("[Seed API] Request received, isDev:", isDev);
  
  if (!isDev) {
    return NextResponse.json({ success: false, error: "Not allowed in production" }, { status: 403 });
  }

  try {
    // Get prisma instance using lazy import
    console.log("[Seed API] Getting prisma client...");
    const prisma = await getPrisma();
    
    if (!prisma) {
      console.error("[Seed API] Prisma client is undefined");
      return NextResponse.json({ 
        success: false, 
        error: "Prisma client not initialized" 
      }, { status: 500 });
    }
    console.log("[Seed API] Prisma client obtained");

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[Seed API] Database connection OK");
    } catch (dbError) {
      console.error("[Seed API] Database connection failed:", dbError);
      return NextResponse.json({ 
        success: false, 
        error: "Database connection failed. Check DATABASE_URL in .env" 
      }, { status: 500 });
    }

    const body = await request.json();
    const { type } = body;
    console.log("[Seed API] Seeding type:", type);
    const results: string[] = [];

    // Always seed accounts first for any operation
    if (type === "all" || type === "accounts") {
      const accountResults = await seedAccounts(prisma);
      results.push(...accountResults);
    }

    // Get current organization for seeding
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    let organizationId: string | null = null;
    let userId: string | null = null;

    if (supabaseUser) {
      const user = await prisma.user.findUnique({
        where: { supabaseId: supabaseUser.id },
        include: {
          memberships: {
            where: { isActive: true },
            take: 1,
          },
        },
      });
      
      if (user) {
        userId = user.id;
        organizationId = user.memberships[0]?.organizationId || null;
      }
    }

    // Fallback to main org if not logged in
    if (!organizationId) {
      const mainOrg = await prisma.organization.findFirst({
        where: { slug: "abc-company" },
      });
      organizationId = mainOrg?.id || null;
    }

    if (!userId) {
      const ownerUser = await prisma.user.findUnique({
        where: { email: "owner@business.com" },
      });
      userId = ownerUser?.id || null;
    }

    if (organizationId) {
      if (type === "all" || type === "contacts") {
        const contactResults = await seedContacts(prisma, organizationId);
        results.push(...contactResults);
      }

      if (type === "all" || type === "categories") {
        const categoryResults = await seedCategories(prisma, organizationId);
        results.push(...categoryResults);
      }

      if ((type === "all" || type === "boxes") && userId) {
        const boxResults = await seedBoxes(prisma, organizationId, userId);
        results.push(...boxResults);
      }
    }

    console.log("[Seed API] Success, results:", results.length);
    return NextResponse.json({
      success: true,
      message: `Seeded: ${results.length} items`,
      details: results,
    });
  } catch (error) {
    console.error("[Seed API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
