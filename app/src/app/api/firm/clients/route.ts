import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.firmMembership) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 401 }
      );
    }

    // Only OWNER and ADMIN can create clients
    const role = session.firmMembership.role;
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์สร้าง Client" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { firmId, name, taxId, address, phone, email } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อธุรกิจ" },
        { status: 400 }
      );
    }

    // Verify firm ownership
    if (firmId !== session.firmMembership.firmId) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์สร้าง Client ให้สำนักงานนี้" },
        { status: 403 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = await prisma.organization.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await prisma.organization.findUnique({ where: { slug } });
      counter++;
    }

    // Create the organization
    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        taxId: taxId?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        firmId, // Link to accounting firm
        plan: "FREE",
        settings: {},
      },
    });

    // Create default categories for the new organization
    const defaultCategories = [
      { code: "EXP", name: "ค่าใช้จ่าย", color: "#ef4444" },
      { code: "REV", name: "รายรับ", color: "#22c55e" },
      { code: "TAX", name: "ภาษี", color: "#f59e0b" },
      { code: "PAY", name: "เงินเดือน", color: "#3b82f6" },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        organizationId: organization.id,
      })),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการสร้าง Client" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.firmMembership) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 401 }
      );
    }

    const firmId = session.firmMembership.firmId;
    const role = session.firmMembership.role;

    // For OWNER/ADMIN - get all clients
    // For ACCOUNTANT/STAFF - get only assigned clients
    let clients;

    if (role === "OWNER" || role === "ADMIN") {
      clients = await prisma.organization.findMany({
        where: { firmId },
        select: {
          id: true,
          name: true,
          slug: true,
          taxId: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: {
            select: { boxes: true },
          },
          boxes: {
            where: {
              status: { in: ["DRAFT", "PREPARING", "SUBMITTED", "NEED_DOCS"] },
            },
            select: { id: true },
          },
        },
        orderBy: { name: "asc" },
      });
    } else {
      // Get firm member ID for the current user
      const firmMember = await prisma.firmMember.findFirst({
        where: {
          firmId,
          userId: session.id,
        },
      });

      if (!firmMember) {
        return NextResponse.json({ success: true, data: [] });
      }

      // Get assigned clients
      const assignments = await prisma.firmClientAssignment.findMany({
        where: { firmMemberId: firmMember.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              taxId: true,
              email: true,
              phone: true,
              createdAt: true,
              _count: {
                select: { boxes: true },
              },
              boxes: {
                where: {
                  status: { in: ["DRAFT", "PREPARING", "SUBMITTED", "NEED_DOCS"] },
                },
                select: { id: true },
              },
            },
          },
        },
      });

      clients = assignments.map((a) => a.organization).filter((org): org is NonNullable<typeof org> => org !== null);
    }

    // Transform data
    const data = clients.map((client) => ({
      id: client.id,
      name: client.name,
      slug: client.slug,
      taxId: client.taxId,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdAt,
      totalDocs: client._count.boxes,
      pendingDocs: client.boxes.length,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}
