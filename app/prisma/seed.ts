/**
 * Prisma Seed Script
 * 
 * Run with: npx prisma db seed
 * 
 * This script creates test data for development including:
 * - Test users with different roles
 * - Organizations
 * - Accounting firms
 * - Contacts, Categories, Boxes
 */

import { PrismaClient, MemberRole, FirmRole, BoxStatus, ExpenseType, ContactType, ContactRole } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Create Prisma client with PG adapter (same as app)
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/document_hub";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Supabase client for creating auth users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key for admin operations
);

const TEST_PASSWORD = "password123";

// Test accounts configuration
const TEST_ACCOUNTS = [
  { email: "owner@business.com", name: "สมชาย เจ้าของธุรกิจ", orgRole: MemberRole.OWNER, org: "abc" },
  { email: "owner2@company.com", name: "สมหญิง เจ้าของบริษัท", orgRole: MemberRole.OWNER, org: "xyz" },
  { email: "admin@business.com", name: "อดิศร ผู้ดูแล", orgRole: MemberRole.ADMIN, org: "abc" },
  { email: "accounting@business.com", name: "บัญชา นักบัญชี", orgRole: MemberRole.ACCOUNTING, org: "abc" },
  { email: "staff@business.com", name: "พนักงาน ทั่วไป", orgRole: MemberRole.STAFF, org: "abc" },
  { email: "firm@accounting.com", name: "วิชัย สำนักบัญชี", firmRole: FirmRole.OWNER },
  { email: "staff@accounting.com", name: "นักบัญชี สำนักงาน", firmRole: FirmRole.ACCOUNTANT },
];

const TEST_CONTACTS = [
  { name: "บริษัท ซัพพลายเออร์ A จำกัด", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105561234567" },
  { name: "ร้านค้าส่ง B", type: ContactType.COMPANY, role: ContactRole.VENDOR, taxId: "0105567891234" },
  { name: "นายสมศักดิ์ รับจ้าง", type: ContactType.INDIVIDUAL, role: ContactRole.VENDOR },
  { name: "บริษัท ลูกค้า X จำกัด", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0105598765432" },
  { name: "หจก. ลูกค้า Y", type: ContactType.COMPANY, role: ContactRole.CUSTOMER, taxId: "0103512345678" },
  { name: "บริษัท พาร์ทเนอร์ Z จำกัด", type: ContactType.COMPANY, role: ContactRole.BOTH, taxId: "0105512121212" },
];

const TEST_CATEGORIES = [
  { code: "OFC", name: "ค่าใช้จ่ายสำนักงาน", type: "EXPENSE" as const },
  { code: "TRV", name: "ค่าเดินทาง", type: "EXPENSE" as const },
  { code: "MTG", name: "ค่าประชุม/สัมมนา", type: "EXPENSE" as const },
  { code: "UTL", name: "ค่าสาธารณูปโภค", type: "EXPENSE" as const },
  { code: "MKT", name: "ค่าการตลาด/โฆษณา", type: "EXPENSE" as const },
  { code: "EQP", name: "ค่าอุปกรณ์", type: "EXPENSE" as const },
  { code: "HR", name: "ค่าใช้จ่ายพนักงาน", type: "EXPENSE" as const },
  { code: "SAL", name: "รายได้จากการขาย", type: "INCOME" as const },
  { code: "SVC", name: "รายได้จากบริการ", type: "INCOME" as const },
];

// Using new 5-status system: DRAFT, PREPARING, SUBMITTED, NEED_DOCS, COMPLETED
const BOX_TEMPLATES = [
  { title: "ค่าเช่าออฟฟิศ เดือนมกราคม", status: BoxStatus.COMPLETED, amount: 35000, hasVat: true, hasWht: true, whtRate: 5, days: 25 },
  { title: "ค่าน้ำมันรถ", status: BoxStatus.SUBMITTED, amount: 2500, hasVat: true, hasWht: false, days: 3 },
  { title: "ค่าอินเทอร์เน็ต TRUE", status: BoxStatus.SUBMITTED, amount: 1200, hasVat: true, hasWht: false, days: 5 },
  { title: "ค่าจ้างออกแบบโลโก้", status: BoxStatus.NEED_DOCS, amount: 15000, hasVat: true, hasWht: true, whtRate: 3, days: 7 },
  { title: "ค่าที่ปรึกษาการตลาด", status: BoxStatus.SUBMITTED, amount: 50000, hasVat: true, hasWht: true, whtRate: 3, days: 2 },
  { title: "ค่าโฆษณา Facebook Ads", status: BoxStatus.PREPARING, amount: 8500, hasVat: false, hasWht: false, days: 4 },
  { title: "ค่าอุปกรณ์คอมพิวเตอร์ Dell", status: BoxStatus.COMPLETED, amount: 25000, hasVat: true, hasWht: false, days: 15 },
  { title: "ค่าบริการ AWS Cloud", status: BoxStatus.PREPARING, amount: 3200, hasVat: false, hasWht: false, days: 1 },
  { title: "ค่าทำความสะอาด", status: BoxStatus.SUBMITTED, amount: 4500, hasVat: true, hasWht: true, whtRate: 1, days: 6 },
  { title: "ค่าซ่อมแอร์ Daikin", status: BoxStatus.SUBMITTED, amount: 6800, hasVat: true, hasWht: true, whtRate: 3, days: 8 },
  { title: "ค่าจัดส่งสินค้า Kerry", status: BoxStatus.SUBMITTED, amount: 1500, hasVat: true, hasWht: false, days: 2 },
  { title: "ค่าไฟฟ้า MEA", status: BoxStatus.COMPLETED, amount: 8900, hasVat: true, hasWht: false, days: 20 },
  { title: "ค่าน้ำประปา MWA", status: BoxStatus.COMPLETED, amount: 1200, hasVat: true, hasWht: false, days: 18 },
  { title: "ค่าโทรศัพท์ AIS", status: BoxStatus.SUBMITTED, amount: 3500, hasVat: true, hasWht: false, days: 3 },
  { title: "ค่าจ้างพัฒนาเว็บไซต์", status: BoxStatus.NEED_DOCS, amount: 45000, hasVat: true, hasWht: true, whtRate: 3, days: 10 },
];

async function createSupabaseUser(email: string, name: string): Promise<string | null> {
  console.log(`Creating Supabase user: ${email}`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true, // Auto-confirm email
    user_metadata: { name },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === email);
      if (existingUser) {
        console.log(`  User already exists: ${existingUser.id}`);
        return existingUser.id;
      }
    }
    console.error(`  Error: ${error.message}`);
    return null;
  }

  console.log(`  Created: ${data.user.id}`);
  return data.user.id;
}

async function main() {
  console.log("🌱 Starting seed...\n");

  // ========================================
  // 1. Create Organizations
  // ========================================
  console.log("📦 Creating organizations...");

  const orgs: Record<string, string> = {};

  const mainOrg = await prisma.organization.upsert({
    where: { slug: "abc-company" },
    update: {},
    create: {
      name: "บริษัท ABC จำกัด",
      slug: "abc-company",
      taxId: "0105512345678",
      address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
      phone: "02-123-4567",
      email: "contact@abc-company.com",
    },
  });
  orgs["abc"] = mainOrg.id;
  console.log(`  ✓ ${mainOrg.name}`);

  const secondOrg = await prisma.organization.upsert({
    where: { slug: "xyz-cafe" },
    update: {},
    create: {
      name: "ร้านกาแฟ XYZ",
      slug: "xyz-cafe",
      taxId: "0105598765432",
      address: "456 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
      phone: "02-987-6543",
      email: "contact@xyz-cafe.com",
    },
  });
  orgs["xyz"] = secondOrg.id;
  console.log(`  ✓ ${secondOrg.name}`);

  // ========================================
  // 2. Create Accounting Firm
  // ========================================
  console.log("\n🧾 Creating accounting firm...");

  const firm = await prisma.accountingFirm.upsert({
    where: { slug: "wichai-accounting" },
    update: {},
    create: {
      name: "สำนักงานบัญชี วิชัย",
      slug: "wichai-accounting",
      taxId: "0105567890123",
      address: "789 ถนนรัชดา แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
      phone: "02-567-8901",
      email: "contact@wichai-accounting.com",
    },
  });
  console.log(`  ✓ ${firm.name}`);

  // Link organizations to firm
  await prisma.organization.update({
    where: { id: mainOrg.id },
    data: { firmId: firm.id },
  });
  await prisma.organization.update({
    where: { id: secondOrg.id },
    data: { firmId: firm.id },
  });
  console.log(`  ✓ Linked organizations to firm`);

  // ========================================
  // 3. Create Users & Memberships
  // ========================================
  console.log("\n👥 Creating users...");

  const users: Record<string, string> = {};

  for (const account of TEST_ACCOUNTS) {
    const supabaseId = await createSupabaseUser(account.email, account.name);
    
    if (!supabaseId) {
      console.error(`  ✗ Failed to create ${account.email}`);
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { supabaseId },
      create: {
        email: account.email,
        name: account.name,
        supabaseId,
      },
    });
    users[account.email] = user.id;
    console.log(`  ✓ ${account.name} (${account.email})`);

    // Create organization membership
    if (account.orgRole && account.org) {
      const orgId = orgs[account.org];
      if (orgId) {
        await prisma.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: orgId,
              userId: user.id,
            },
          },
          update: { role: account.orgRole },
          create: {
            organizationId: orgId,
            userId: user.id,
            role: account.orgRole,
            joinedAt: new Date(),
          },
        });
        console.log(`    → Member of ${account.org === "abc" ? mainOrg.name : secondOrg.name} as ${account.orgRole}`);
      }
    }

    // Create firm membership
    if (account.firmRole) {
      await prisma.firmMember.upsert({
        where: {
          firmId_userId: {
            firmId: firm.id,
            userId: user.id,
          },
        },
        update: { role: account.firmRole },
        create: {
          firmId: firm.id,
          userId: user.id,
          role: account.firmRole,
        },
      });
      console.log(`    → Member of ${firm.name} as ${account.firmRole}`);
    }
  }

  // ========================================
  // 4. Create Contacts (for main org)
  // ========================================
  console.log("\n📇 Creating contacts...");

  for (const contact of TEST_CONTACTS) {
    await prisma.contact.upsert({
      where: {
        id: `seed-contact-${contact.taxId || contact.name.substring(0, 10)}`,
      },
      update: {},
      create: {
        id: `seed-contact-${contact.taxId || contact.name.substring(0, 10)}`,
        organizationId: mainOrg.id,
        name: contact.name,
        contactType: contact.type,
        contactRole: contact.role,
        taxId: contact.taxId,
        whtApplicable: contact.role === ContactRole.VENDOR || contact.role === ContactRole.BOTH,
        defaultWhtRate: contact.role === ContactRole.VENDOR || contact.role === ContactRole.BOTH ? 3 : null,
      },
    });
    console.log(`  ✓ ${contact.name}`);
  }

  // ========================================
  // 5. Create Categories (for main org)
  // ========================================
  console.log("\n🏷️ Creating categories...");

  for (const cat of TEST_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        organizationId_code: {
          organizationId: mainOrg.id,
          code: cat.code,
        },
      },
      update: {},
      create: {
        organizationId: mainOrg.id,
        code: cat.code,
        name: cat.name,
        categoryType: cat.type,
      },
    });
    console.log(`  ✓ ${cat.code}: ${cat.name}`);
  }

  // Create categories for second org too
  for (const cat of TEST_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        organizationId_code: {
          organizationId: secondOrg.id,
          code: cat.code,
        },
      },
      update: {},
      create: {
        organizationId: secondOrg.id,
        code: cat.code,
        name: cat.name,
        categoryType: cat.type,
      },
    });
  }

  // ========================================
  // 6. Create Cost Centers
  // ========================================
  console.log("\n🏢 Creating cost centers...");

  await prisma.costCenter.upsert({
    where: {
      organizationId_code: {
        organizationId: mainOrg.id,
        code: "HQ",
      },
    },
    update: {},
    create: {
      organizationId: mainOrg.id,
      code: "HQ",
      name: "สำนักงานใหญ่",
    },
  });
  console.log(`  ✓ HQ: สำนักงานใหญ่`);

  await prisma.costCenter.upsert({
    where: {
      organizationId_code: {
        organizationId: mainOrg.id,
        code: "SALES",
      },
    },
    update: {},
    create: {
      organizationId: mainOrg.id,
      code: "SALES",
      name: "ฝ่ายขาย",
    },
  });
  console.log(`  ✓ SALES: ฝ่ายขาย`);

  // ========================================
  // 7. Create Boxes
  // ========================================
  console.log("\n📦 Creating boxes...");

  const ownerId = users["owner@business.com"];
  const contacts = await prisma.contact.findMany({
    where: { organizationId: mainOrg.id, contactRole: ContactRole.VENDOR },
  });
  const categories = await prisma.category.findMany({
    where: { organizationId: mainOrg.id, categoryType: "EXPENSE" },
  });

  for (let i = 0; i < BOX_TEMPLATES.length; i++) {
    const template = BOX_TEMPLATES[i];
    const boxNumber = `BOX-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    const contact = contacts[i % contacts.length];
    const category = categories[i % categories.length];
    
    const boxDate = new Date();
    boxDate.setDate(boxDate.getDate() - template.days);

    const vatAmount = template.hasVat ? Math.round(template.amount * 7 / 107) : 0;
    const baseForWht = template.amount - vatAmount;
    const whtAmount = template.hasWht && template.whtRate
      ? Math.round(baseForWht * (template.whtRate / 100))
      : 0;

    await prisma.box.upsert({
      where: {
        organizationId_boxNumber: {
          organizationId: mainOrg.id,
          boxNumber,
        },
      },
      update: {},
      create: {
        organization: { connect: { id: mainOrg.id } },
        createdBy: { connect: { id: ownerId } },
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
        contact: contact?.id ? { connect: { id: contact.id } } : undefined,
        category: category?.id ? { connect: { id: category.id } } : undefined,
      },
    });
    console.log(`  ✓ ${boxNumber}: ${template.title}`);
  }

  // ========================================
  // Done
  // ========================================
  console.log("\n✅ Seed completed successfully!\n");
  console.log("📝 Test Accounts:");
  console.log("   Password for all accounts: password123\n");
  
  for (const account of TEST_ACCOUNTS) {
    const roleInfo = account.orgRole 
      ? `${account.orgRole} @ ${account.org === "abc" ? "บริษัท ABC" : "ร้านกาแฟ XYZ"}`
      : `${account.firmRole} @ สำนักงานบัญชี วิชัย`;
    console.log(`   ${account.email} - ${account.name} (${roleInfo})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
