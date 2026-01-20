# 02 - Data Model

## 📊 ER Diagram

```
Organization (บริษัท)
    │
    ├── User (ผู้ใช้)
    ├── Contact (คู่ค้า/ลูกค้า)
    ├── Category (หมวดค่าใช้จ่าย)
    ├── CostCenter (ศูนย์ต้นทุน)
    │
    └── Box (กล่องเอกสาร) ← หลัก
            │
            ├── Document (เอกสารในกล่อง)
            │       └── DocumentFile (ไฟล์)
            │
            ├── Payment (การจ่ายเงิน)
            │
            └── WhtTracking (ติดตาม WHT)
```

---

## 🗃️ Prisma Schema

### Box (กล่องเอกสาร)

```prisma
model Box {
  id              String   @id @default(cuid())
  organizationId  String
  
  // === Basic Info ===
  boxNumber       String   // BOX-YYYYMM-XXXX
  title           String   // "ค่าบริการ IT ม.ค."
  boxType         BoxType  // expense, income, adjustment
  expenseType     ExpenseType? // standard, no_vat, cash, etc.
  
  // === Amount ===
  totalAmount     Decimal  @default(0)
  vatAmount       Decimal  @default(0)
  whtAmount       Decimal  @default(0)
  paidAmount      Decimal  @default(0) // ยอดจ่ายแล้ว
  
  // === Status ===
  status          BoxStatus    @default(draft)
  docStatus       DocStatus    @default(incomplete) // เอกสารครบยัง
  paymentStatus   PaymentStatus @default(unpaid)
  
  // === Flags ===
  hasVat          Boolean  @default(true)  // คาดว่ามี VAT
  hasWht          Boolean  @default(false) // คาดว่ามี WHT
  noReceiptReason String?  // ถ้าไม่มีเอกสาร
  
  // === Foreign Currency ===
  foreignCurrency String?  // USD, EUR
  foreignAmount   Decimal?
  exchangeRate    Decimal?
  
  // === Relations ===
  contactId       String?
  contact         Contact? @relation(fields: [contactId], references: [id])
  
  categoryId      String?
  category        Category? @relation(fields: [categoryId], references: [id])
  
  costCenterId    String?
  costCenter      CostCenter? @relation(fields: [costCenterId], references: [id])
  
  // === Children ===
  documents       Document[]
  payments        Payment[]
  whtTracking     WhtTracking[]
  comments        Comment[]
  
  // === Linked (for refund/adjustment) ===
  linkedBoxId     String?
  linkedBox       Box?     @relation("LinkedBoxes", fields: [linkedBoxId], references: [id])
  linkedFrom      Box[]    @relation("LinkedBoxes")
  
  // === Audit ===
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId])
  @@index([status])
  @@index([boxNumber])
}

enum BoxType {
  expense      // รายจ่าย
  income       // รายรับ
  adjustment   // ปรับปรุง (refund, CN, DN)
}

enum ExpenseType {
  standard     // จ่ายปกติ (มีใบกำกับ)
  no_vat       // ไม่มี VAT (ร้านไม่จด)
  cash         // จ่ายสด (Petty Cash)
  no_receipt   // ไม่มีหลักฐาน
  foreign      // ต่างประเทศ
  import       // นำเข้า
  recurring    // ประจำ
  utility      // ค่าน้ำ/ไฟ/เน็ต
  bank_fee     // ค่าธรรมเนียมธนาคาร
  reimbursement // เบิกคืนพนักงาน
  tax_payment  // จ่ายภาษี
  government   // ค่าธรรมเนียมราชการ
}

enum BoxStatus {
  draft           // แบบร่าง
  pending_review  // รอตรวจ
  need_info       // ขอข้อมูลเพิ่ม
  approved        // อนุมัติแล้ว
  exported        // Export แล้ว
  cancelled       // ยกเลิก
}

enum DocStatus {
  incomplete  // เอกสารไม่ครบ
  complete    // เอกสารครบ
  na          // ไม่ต้องมีเอกสาร
}

enum PaymentStatus {
  unpaid    // ยังไม่จ่าย
  partial   // จ่ายบางส่วน
  paid      // จ่ายครบ
  overpaid  // จ่ายเกิน
  refunded  // ได้คืนแล้ว
}
```

### Document (เอกสารในกล่อง)

```prisma
model Document {
  id          String   @id @default(cuid())
  boxId       String
  
  // === Type ===
  docType     DocType
  
  // === Details ===
  docNumber   String?  // เลขที่เอกสาร
  docDate     DateTime?
  amount      Decimal?
  vatAmount   Decimal?
  
  // === Foreign Currency ===
  foreignCurrency String?
  foreignAmount   Decimal?
  
  // === Notes ===
  notes       String?
  
  // === AI Extracted ===
  aiExtracted Json?    // ข้อมูลที่ AI อ่านได้
  aiConfidence Float?  // ความมั่นใจ 0-1
  
  // === Children ===
  files       DocumentFile[]
  
  // === Audit ===
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  box         Box      @relation(fields: [boxId], references: [id], onDelete: Cascade)
  
  @@index([boxId])
  @@index([docType])
}

enum DocType {
  // === หลักฐานจ่ายเงิน ===
  slip_transfer        // สลิปโอนเงิน
  slip_cheque          // สำเนาเช็ค
  bank_statement       // Statement ธนาคาร
  credit_card_statement // Statement บัตรเครดิต
  online_receipt       // Paypal/Stripe
  petty_cash_voucher   // ใบสำคัญจ่ายเงินสด
  
  // === หลักฐานรายจ่าย ===
  tax_invoice          // ใบกำกับภาษี
  tax_invoice_abb      // ใบกำกับภาษีอย่างย่อ
  receipt              // ใบเสร็จรับเงิน
  cash_receipt         // บิลเงินสด
  invoice              // ใบแจ้งหนี้
  foreign_invoice      // Invoice ต่างประเทศ
  customs_form         // ใบขนสินค้า
  delivery_note        // ใบส่งของ
  
  // === เอกสารปรับปรุง ===
  credit_note          // ใบลดหนี้
  debit_note           // ใบเพิ่มหนี้
  refund_receipt       // หลักฐานคืนเงิน
  
  // === WHT ===
  wht_sent             // WHT ที่เราส่งให้
  wht_received         // WHT ที่ได้รับกลับ (signed)
  wht_incoming         // WHT ที่เขาหักเรา
  
  // === ภาษี/ราชการ ===
  tax_payment_slip     // ใบนำส่งภาษี
  tax_receipt_govt     // ใบเสร็จจากสรรพากร
  sso_payment          // ประกันสังคม
  govt_receipt         // ใบเสร็จราชการอื่นๆ
  
  // === อื่นๆ ===
  contract             // สัญญา
  quotation            // ใบเสนอราคา
  purchase_order       // ใบสั่งซื้อ
  claim_form           // ใบเบิกเงิน
  other                // อื่นๆ
}
```

### DocumentFile (ไฟล์)

```prisma
model DocumentFile {
  id          String   @id @default(cuid())
  documentId  String
  
  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String
  checksum    String?  // MD5 สำหรับ duplicate detection
  pageOrder   Int      @default(1)
  
  createdAt   DateTime @default(now())
  
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@index([checksum])
}
```

### Payment (การจ่ายเงิน)

```prisma
model Payment {
  id          String   @id @default(cuid())
  boxId       String
  
  amount      Decimal
  paidDate    DateTime
  method      PaymentMethod
  reference   String?  // เลขอ้างอิง
  notes       String?
  
  // === Link to slip document ===
  documentId  String?  // เชื่อมกับ Document (slip)
  
  createdAt   DateTime @default(now())
  
  box         Box      @relation(fields: [boxId], references: [id], onDelete: Cascade)
  
  @@index([boxId])
}

enum PaymentMethod {
  transfer    // โอน
  cheque      // เช็ค
  cash        // เงินสด
  credit_card // บัตรเครดิต
  online      // Online (Paypal, etc.)
}
```

### WhtTracking (ติดตาม WHT)

```prisma
model WhtTracking {
  id          String   @id @default(cuid())
  boxId       String
  
  type        WhtType  // outgoing (เราหักเขา) | incoming (เขาหักเรา)
  amount      Decimal
  rate        Decimal? // 1%, 2%, 3%, 5%
  
  status      WhtStatus @default(pending)
  issuedDate  DateTime?
  sentDate    DateTime?
  receivedDate DateTime?
  
  // === Link to WHT document ===
  documentId  String?
  
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  box         Box      @relation(fields: [boxId], references: [id], onDelete: Cascade)
  
  @@index([boxId])
  @@index([status])
}

enum WhtType {
  outgoing  // เราหักเขา (ส่ง WHT ให้ vendor)
  incoming  // เขาหักเรา (รับ WHT จากลูกค้า)
}

enum WhtStatus {
  pending     // รอดำเนินการ
  issued      // ออกแล้ว
  sent        // ส่งแล้ว
  confirmed   // ยืนยันแล้ว
  received    // ได้รับแล้ว
}
```

---

## 🔗 ความสัมพันธ์

```
Organization
    │
    ├── Box (1:N)
    │     │
    │     ├── Document (1:N) ← สลิป, ใบกำกับ, WHT, etc.
    │     │     └── DocumentFile (1:N) ← ไฟล์รูป/PDF
    │     │
    │     ├── Payment (1:N) ← รองรับจ่ายหลายครั้ง
    │     │
    │     └── WhtTracking (1:N)
    │
    ├── Contact (1:N)
    ├── Category (1:N)
    └── CostCenter (1:N)
```

---

## 📊 Index Strategy

```prisma
// Box
@@index([organizationId])
@@index([status])
@@index([boxNumber])
@@index([createdAt])
@@index([contactId])

// Document
@@index([boxId])
@@index([docType])

// DocumentFile
@@index([documentId])
@@index([checksum]) // duplicate detection

// Payment
@@index([boxId])

// WhtTracking
@@index([boxId])
@@index([status])
```
