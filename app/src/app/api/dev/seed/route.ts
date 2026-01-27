import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { 
  MemberRole, 
  FirmRole, 
  BoxStatus, 
  BoxType,
  ExpenseType, 
  ContactType, 
  ContactRole, 
  RelationStatus, 
  InviterType, 
  VatDocStatus,
  WhtDocStatus,
  PaymentStatus,
  ReimbursementStatus,
  PrismaClient 
} from ".prisma/client";

// Lazy import prisma to avoid initialization issues with Turbopack
async function getPrisma(): Promise<PrismaClient> {
  const { default: prisma } = await import("@/lib/prisma");
  return prisma;
}

// Only allow in development
const isDev = process.env.NODE_ENV === "development";

// ==================== TEST ACCOUNTS ====================

const TEST_ACCOUNTS = [
  // SME - Main Business
  { email: "owner@business.com", name: "สมชาย เจ้าของธุรกิจ", orgRole: MemberRole.OWNER },
  { email: "admin@business.com", name: "อดิศร ผู้ดูแล", orgRole: MemberRole.ADMIN },
  { email: "accounting@business.com", name: "บัญชา นักบัญชี", orgRole: MemberRole.ACCOUNTING },
  { email: "staff@business.com", name: "พนักงาน ทั่วไป", orgRole: MemberRole.STAFF },
  
  // SME - Second Business
  { email: "owner2@company.com", name: "สมหญิง เจ้าของบริษัท", orgRole: MemberRole.OWNER, isSecondOrg: true },
  
  // Accounting Firm
  { email: "firm@accounting.com", name: "วิชัย สำนักบัญชี", firmRole: FirmRole.OWNER },
  { email: "staff@accounting.com", name: "นักบัญชี สำนักงาน", firmRole: FirmRole.ACCOUNTANT },
];

// ==================== TEST CONTACTS ====================

const TEST_CONTACTS = [
  // Vendors
  { name: "บริษัท ซัพพลายเออร์ A จำกัด", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105561234567", whtRate: 3 },
  { name: "ร้านค้าส่ง B", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105567891234", whtRate: 3 },
  { name: "นายสมศักดิ์ รับจ้าง", type: ContactType.INDIVIDUAL, role: ContactRole.VENDOR, whtRate: 3 },
  { name: "บริษัท IT Solutions จำกัด", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105599887766", whtRate: 3 },
  { name: "หจก. ขนส่งด่วน", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0103598765432", whtRate: 1 },
  
  // Customers
  { name: "บริษัท ลูกค้า X จำกัด", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0105598765432" },
  { name: "หจก. ลูกค้า Y", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0103512345678" },
  { name: "บริษัท ABC Corporation", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0105511223344" },
  { name: "นางสาวมาลี ลูกค้า", type: ContactType.INDIVIDUAL, role: ContactRole.CUSTOMER },
];

// ==================== TEST CATEGORIES ====================

const TEST_CATEGORIES = [
  // Expense categories
  { code: "OFC", name: "ค่าใช้จ่ายสำนักงาน", type: "EXPENSE" },
  { code: "TRV", name: "ค่าเดินทาง", type: "EXPENSE" },
  { code: "MTG", name: "ค่าประชุม/สัมมนา", type: "EXPENSE" },
  { code: "UTL", name: "ค่าสาธารณูปโภค", type: "EXPENSE" },
  { code: "MKT", name: "ค่าการตลาด/โฆษณา", type: "EXPENSE" },
  { code: "EQP", name: "ค่าอุปกรณ์", type: "EXPENSE" },
  { code: "SVC", name: "ค่าบริการ", type: "EXPENSE" },
  { code: "RNT", name: "ค่าเช่า", type: "EXPENSE" },
  
  // Income categories
  { code: "SAL", name: "รายได้จากการขาย", type: "INCOME" },
  { code: "SVCI", name: "รายได้จากบริการ", type: "INCOME" },
  { code: "INT", name: "ดอกเบี้ยรับ", type: "INCOME" },
  { code: "OTH", name: "รายได้อื่น", type: "INCOME" },
];

// ==================== TEST BOXES ====================

// Comprehensive test boxes covering all scenarios
const BOX_TEMPLATES = [
  // ============ EXPENSE - Standard ============
  {
    title: "ค่าเช่าออฟฟิศ ม.ค.",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.COMPLETED,
    amount: 35000,
    hasVat: true,
    hasWht: true,
    whtRate: 5,
    vatDocStatus: VatDocStatus.RECEIVED,
    whtDocStatus: WhtDocStatus.RECEIVED,
    paymentStatus: PaymentStatus.PAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าน้ำมันรถ",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.SUBMITTED,
    amount: 2500,
    hasVat: true,
    hasWht: false,
    vatDocStatus: VatDocStatus.MISSING,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.PAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าจ้างออกแบบโลโก้",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.NEED_DOCS,
    amount: 15000,
    hasVat: true,
    hasWht: true,
    whtRate: 3,
    vatDocStatus: VatDocStatus.MISSING,
    whtDocStatus: WhtDocStatus.REQUEST_SENT,
    paymentStatus: PaymentStatus.PAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าที่ปรึกษากฎหมาย",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.SUBMITTED,
    amount: 50000,
    hasVat: true,
    hasWht: true,
    whtRate: 3,
    vatDocStatus: VatDocStatus.MISSING,
    whtDocStatus: WhtDocStatus.MISSING,
    paymentStatus: PaymentStatus.UNPAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าโฆษณา Facebook",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.COMPLETED,
    amount: 8500,
    hasVat: false,
    hasWht: false,
    vatDocStatus: VatDocStatus.NA,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.PAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าอุปกรณ์คอมพิวเตอร์",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.DRAFT,
    amount: 25000,
    hasVat: true,
    hasWht: false,
    vatDocStatus: VatDocStatus.MISSING,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.UNPAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าบริการ AWS",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.SUBMITTED,
    amount: 3200,
    hasVat: false,
    hasWht: false,
    vatDocStatus: VatDocStatus.NA,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.PAID,
    contactType: "VENDOR",
  },
  {
    title: "ค่าขนส่งสินค้า",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.COMPLETED,
    amount: 4500,
    hasVat: true,
    hasWht: true,
    whtRate: 1,
    vatDocStatus: VatDocStatus.RECEIVED,
    whtDocStatus: WhtDocStatus.RECEIVED,
    paymentStatus: PaymentStatus.PAID,
    contactType: "VENDOR",
  },

  // ============ EXPENSE - Reimbursement (uses reimbursementStatus) ============
  {
    title: "เบิกค่าเดินทางไปพบลูกค้า",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.SUBMITTED,
    amount: 1850,
    hasVat: true,
    hasWht: false,
    vatDocStatus: VatDocStatus.RECEIVED,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.UNPAID,
    reimbursementStatus: ReimbursementStatus.PENDING,
    contactType: null,
  },
  {
    title: "เบิกค่าอาหารประชุมทีม",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.COMPLETED,
    amount: 2400,
    hasVat: true,
    hasWht: false,
    vatDocStatus: VatDocStatus.RECEIVED,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.PAID,
    reimbursementStatus: ReimbursementStatus.REIMBURSED,
    contactType: null,
  },
  {
    title: "เบิกค่าที่จอดรถ",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.NO_VAT,
    status: BoxStatus.DRAFT,
    amount: 300,
    hasVat: false,
    hasWht: false,
    vatDocStatus: VatDocStatus.NA,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.UNPAID,
    reimbursementStatus: ReimbursementStatus.PENDING,
    contactType: null,
  },
  {
    title: "เบิกค่าของขวัญลูกค้า",
    boxType: BoxType.EXPENSE,
    expenseType: ExpenseType.STANDARD,
    status: BoxStatus.NEED_DOCS,
    amount: 1500,
    hasVat: true,
    hasWht: false,
    vatDocStatus: VatDocStatus.MISSING,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.UNPAID,
    reimbursementStatus: ReimbursementStatus.PENDING,
    contactType: null,
  },

  // ============ INCOME ============
  {
    title: "รายได้จากขายสินค้า - ลูกค้า X",
    boxType: BoxType.INCOME,
    expenseType: null,
    status: BoxStatus.COMPLETED,
    amount: 150000,
    hasVat: true,
    hasWht: true,
    whtRate: 3,
    vatDocStatus: VatDocStatus.RECEIVED, // เราออก VAT Invoice แล้ว
    whtDocStatus: WhtDocStatus.RECEIVED, // ลูกค้าส่ง WHT มาให้แล้ว
    paymentStatus: PaymentStatus.PAID,
    contactType: "CUSTOMER",
  },
  {
    title: "รายได้จากบริการ - ลูกค้า Y",
    boxType: BoxType.INCOME,
    expenseType: null,
    status: BoxStatus.SUBMITTED,
    amount: 85000,
    hasVat: true,
    hasWht: true,
    whtRate: 3,
    vatDocStatus: VatDocStatus.RECEIVED, // ออก Invoice แล้ว
    whtDocStatus: WhtDocStatus.MISSING, // รอลูกค้าส่ง WHT
    paymentStatus: PaymentStatus.UNPAID,
    contactType: "CUSTOMER",
  },
  {
    title: "รายได้จากขายสินค้า - ABC Corp",
    boxType: BoxType.INCOME,
    expenseType: null,
    status: BoxStatus.COMPLETED,
    amount: 220000,
    hasVat: true,
    hasWht: false,
    vatDocStatus: VatDocStatus.RECEIVED,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.PAID,
    contactType: "CUSTOMER",
  },
  {
    title: "รายได้จากบริการ - มาลี",
    boxType: BoxType.INCOME,
    expenseType: null,
    status: BoxStatus.DRAFT,
    amount: 12000,
    hasVat: false,
    hasWht: false,
    vatDocStatus: VatDocStatus.NA,
    whtDocStatus: WhtDocStatus.NA,
    paymentStatus: PaymentStatus.UNPAID,
    contactType: "CUSTOMER",
  },
  {
    title: "รายได้จากบริการ - ลูกค้า X (งวด 2)",
    boxType: BoxType.INCOME,
    expenseType: null,
    status: BoxStatus.SUBMITTED,
    amount: 75000,
    hasVat: true,
    hasWht: true,
    whtRate: 3,
    vatDocStatus: VatDocStatus.MISSING, // ยังไม่ออก Invoice
    whtDocStatus: WhtDocStatus.MISSING,
    paymentStatus: PaymentStatus.PARTIAL,
    contactType: "CUSTOMER",
  },

];

// ==================== HELPER FUNCTIONS ====================

async function createSupabaseUser(prisma: PrismaClient, email: string, name: string): Promise<string | null> {
  console.log("[Seed] Creating Supabase user:", email);
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[Seed] SUPABASE_SERVICE_ROLE_KEY not set, using signUp fallback");
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
      console.error(`[Seed] SignUp error ${email}:`, error);
      return null;
    }
    return data.user?.id || null;
  }
  
  try {
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("duplicate key")) {
        console.log("[Seed] User already exists:", email);
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser?.supabaseId) return existingUser.supabaseId;
        
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingSupabaseUser = listData?.users?.find(u => u.email === email);
        return existingSupabaseUser?.id || null;
      }
      console.error(`[Seed] Error creating user ${email}:`, error);
      return null;
    }

    console.log("[Seed] Created Supabase user:", data.user?.id);
    return data.user?.id || null;
  } catch (error) {
    console.error(`[Seed] Exception creating user ${email}:`, error);
    return null;
  }
}

// ==================== SEED FUNCTIONS ====================

async function seedAccounts(prisma: PrismaClient) {
  const results: string[] = [];

  // Create main organization
  let mainOrg = await prisma.organization.findFirst({ where: { slug: "abc-company" } });
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
    results.push(`✅ Created organization: ${mainOrg.name}`);
  }

  // Create second organization
  let secondOrg = await prisma.organization.findFirst({ where: { slug: "xyz-cafe" } });
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
    results.push(`✅ Created organization: ${secondOrg.name}`);
  }

  // Create accounting firm
  let firm = await prisma.accountingFirm.findFirst({ where: { slug: "wichai-accounting" } });
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
    results.push(`✅ Created accounting firm: ${firm.name}`);
  }

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
        results.push(`✅ Created user: ${account.name}`);
      }
    }

    if (user) {
      // Create organization membership
      if (account.orgRole) {
        const targetOrg = account.isSecondOrg ? secondOrg : mainOrg;
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
          results.push(`  → Added to ${targetOrg.name} as ${account.orgRole}`);
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
          results.push(`  → Added to ${firm.name} as ${account.firmRole}`);
        }
      }
    }
  }

  // Create Firm-Client Relations
  const ownerUser = await prisma.user.findUnique({ where: { email: "owner@business.com" } });
  const owner2User = await prisma.user.findUnique({ where: { email: "owner2@company.com" } });

  if (firm && ownerUser) {
    const existingRelation = await prisma.firmClientRelation.findUnique({
      where: { firmId_organizationId: { firmId: firm.id, organizationId: mainOrg.id } },
    });

    if (!existingRelation) {
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
      results.push(`✅ Firm-Client: ${mainOrg.name} → ${firm.name} (ACTIVE)`);
    }
  }

  if (firm && owner2User) {
    const existingRelation = await prisma.firmClientRelation.findUnique({
      where: { firmId_organizationId: { firmId: firm.id, organizationId: secondOrg.id } },
    });

    if (!existingRelation) {
      await prisma.firmClientRelation.create({
        data: {
          firmId: firm.id,
          organizationId: secondOrg.id,
          status: RelationStatus.PENDING,
          invitedByUserId: owner2User.id,
          invitedByType: InviterType.BUSINESS,
        },
      });
      results.push(`✅ Firm-Client: ${secondOrg.name} → ${firm.name} (PENDING)`);
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
          defaultWhtRate: contact.whtRate || null,
        },
      });
      results.push(`✅ Contact: ${contact.name} (${contact.role})`);
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
      results.push(`✅ Category: ${cat.name}`);
    }
  }

  return results;
}

async function seedBoxes(prisma: PrismaClient, organizationId: string, userId: string) {
  const results: string[] = [];

  // Get contacts and categories
  const vendors = await prisma.contact.findMany({
    where: { organizationId, contactRole: ContactRole.VENDOR },
  });
  const customers = await prisma.contact.findMany({
    where: { organizationId, contactRole: ContactRole.CUSTOMER },
  });
  const expenseCategories = await prisma.category.findMany({
    where: { organizationId, categoryType: "EXPENSE" },
  });
  const incomeCategories = await prisma.category.findMany({
    where: { organizationId, categoryType: "INCOME" },
  });

  let vendorIndex = 0;
  let customerIndex = 0;
  let expenseCatIndex = 0;
  let incomeCatIndex = 0;

  for (let i = 0; i < BOX_TEMPLATES.length; i++) {
    const template = BOX_TEMPLATES[i];
    const boxNumber = `BOX-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    
    const existing = await prisma.box.findFirst({
      where: { organizationId, boxNumber },
    });

    if (!existing) {
      // Select contact based on type
      let contactId: string | null = null;
      if (template.contactType === "VENDOR" && vendors.length > 0) {
        contactId = vendors[vendorIndex % vendors.length].id;
        vendorIndex++;
      } else if (template.contactType === "CUSTOMER" && customers.length > 0) {
        contactId = customers[customerIndex % customers.length].id;
        customerIndex++;
      }

      // Select category
      let categoryId: string | null = null;
      if (template.boxType === BoxType.EXPENSE && expenseCategories.length > 0) {
        categoryId = expenseCategories[expenseCatIndex % expenseCategories.length].id;
        expenseCatIndex++;
      } else if (template.boxType === BoxType.INCOME && incomeCategories.length > 0) {
        categoryId = incomeCategories[incomeCatIndex % incomeCategories.length].id;
        incomeCatIndex++;
      }

      // Calculate VAT and WHT
      const amount = Math.abs(template.amount);
      const vatAmount = template.hasVat ? Math.round(amount * 7 / 107) : 0;
      const baseForWht = amount - vatAmount;
      const whtAmount = template.hasWht && template.whtRate
        ? Math.round(baseForWht * (template.whtRate / 100))
        : 0;

      // Random date in last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const boxDate = new Date();
      boxDate.setDate(boxDate.getDate() - daysAgo);

      await prisma.box.create({
        data: {
          organizationId,
          createdById: userId,
          boxNumber,
          title: template.title,
          description: `รายละเอียด: ${template.title}`,
          boxDate,
          boxType: template.boxType,
          status: template.status,
          expenseType: template.expenseType,
          totalAmount: template.amount,
          hasVat: template.hasVat,
          vatAmount,
          vatDocStatus: template.vatDocStatus,
          hasWht: template.hasWht,
          whtRate: template.whtRate || 0,
          whtAmount,
          whtDocStatus: template.whtDocStatus,
          paymentStatus: template.paymentStatus,
          reimbursementStatus: template.reimbursementStatus || ReimbursementStatus.NONE,
          contactId,
          categoryId,
        },
      });

      const isReimbursement = !!template.reimbursementStatus;
      const typeLabel = template.boxType === BoxType.INCOME ? "📈" : 
                       isReimbursement ? "💰" : "📤";
      results.push(`${typeLabel} Box: ${template.title} [${template.status}]`);
    }
  }

  return results;
}

// ==================== MAIN API HANDLER ====================

export async function POST(request: NextRequest) {
  console.log("[Seed] Request received, isDev:", isDev);
  
  if (!isDev) {
    return NextResponse.json({ success: false, error: "Not allowed in production" }, { status: 403 });
  }

  try {
    console.log("[Seed] Getting prisma client...");
    const prisma = await getPrisma();
    
    if (!prisma) {
      return NextResponse.json({ success: false, error: "Prisma client not initialized" }, { status: 500 });
    }

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[Seed] Database connection OK");
    } catch (dbError) {
      console.error("[Seed] Database connection failed:", dbError);
      return NextResponse.json({ 
        success: false, 
        error: "Database connection failed. Check DATABASE_URL" 
      }, { status: 500 });
    }

    const body = await request.json();
    const { type } = body;
    console.log("[Seed] Seeding type:", type);
    const results: string[] = [];

    // Always seed accounts first
    if (type === "all" || type === "accounts") {
      const accountResults = await seedAccounts(prisma);
      results.push("=== Accounts ===", ...accountResults);
    }

    // Get current organization
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    let organizationId: string | null = null;
    let userId: string | null = null;

    if (supabaseUser) {
      const user = await prisma.user.findUnique({
        where: { supabaseId: supabaseUser.id },
        include: {
          memberships: { where: { isActive: true }, take: 1 },
        },
      });
      
      if (user) {
        userId = user.id;
        organizationId = user.memberships[0]?.organizationId || null;
      }
    }

    // Fallback to main org
    if (!organizationId) {
      const mainOrg = await prisma.organization.findFirst({ where: { slug: "abc-company" } });
      organizationId = mainOrg?.id || null;
    }

    if (!userId) {
      const ownerUser = await prisma.user.findUnique({ where: { email: "owner@business.com" } });
      userId = ownerUser?.id || null;
    }

    if (organizationId) {
      if (type === "all" || type === "contacts") {
        const contactResults = await seedContacts(prisma, organizationId);
        results.push("=== Contacts ===", ...contactResults);
      }

      if (type === "all" || type === "categories") {
        const categoryResults = await seedCategories(prisma, organizationId);
        results.push("=== Categories ===", ...categoryResults);
      }

      if ((type === "all" || type === "boxes") && userId) {
        const boxResults = await seedBoxes(prisma, organizationId, userId);
        results.push("=== Boxes ===", ...boxResults);
      }
    }

    console.log("[Seed] Success, results:", results.length);
    return NextResponse.json({
      success: true,
      message: `Seeded: ${results.filter(r => r.startsWith("✅") || r.startsWith("📈") || r.startsWith("📤") || r.startsWith("💰") || r.startsWith("🔄")).length} items`,
      details: results,
    });
  } catch (error) {
    console.error("[Seed] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
