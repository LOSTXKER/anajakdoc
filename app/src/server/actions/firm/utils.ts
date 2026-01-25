import prisma from "@/lib/prisma";

/**
 * Generate URL-friendly slug from firm name
 */
export function generateFirmSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  
  if (!slug || slug.length < 2) {
    return `firm-${Date.now().toString(36)}`;
  }
  
  return slug;
}

/**
 * Generate unique firm slug by checking database
 */
export async function generateUniqueFirmSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.accountingFirm.findUnique({
      where: { slug },
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
