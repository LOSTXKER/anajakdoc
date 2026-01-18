# 📁 File Management

## 6.1 Supported Formats

### Images
| Format | Extension | Notes |
|--------|-----------|-------|
| JPEG | .jpg, .jpeg | ถ่ายจากมือถือ |
| PNG | .png | Screenshot |
| HEIC | .heic | iPhone default |
| WebP | .webp | Modern format |

### Documents
| Format | Extension | Notes |
|--------|-----------|-------|
| PDF | .pdf | สแกน, e-invoice |

---

## 6.2 File Limits

| Limit | Value |
|-------|-------|
| Max file size | 10 MB per file |
| Max files per document | 20 ไฟล์ต่อกล่อง |
| Auto compress threshold | > 2 MB |
| Compression target | 70-80% quality |

### Multi-file Support (กล่องเอกสาร) ⭐
- 1 กล่องเอกสาร = หลายไฟล์ได้ (เช่น ใบเสร็จหน้า 1, 2, 3)
- ลากเรียงลำดับไฟล์ได้ (page_order)
- ตั้งไฟล์หลักสำหรับ thumbnail (is_primary)
- เก็บ checksum ต่อไฟล์สำหรับ duplicate detection

### Auto Compression
- รูปที่ใหญ่กว่า 2 MB จะถูก compress อัตโนมัติ
- ใช้ client-side compression ก่อน upload
- เก็บ original metadata (EXIF date, etc.)

---

## 6.3 Storage

### Cloud Storage
- **Provider**: S3-compatible (AWS S3 / Cloudflare R2 / MinIO)
- **Bucket Structure** (รองรับหลายไฟล์ต่อกล่อง):
```
accounting-docs/
├── uploads/
│   ├── 2026/
│   │   ├── 01/
│   │   │   ├── {doc_id}/                    ← โฟลเดอร์ของกล่องเอกสาร
│   │   │   │   ├── {file_id}_01.jpg         ← ไฟล์ที่ 1 (หน้า 1)
│   │   │   │   ├── {file_id}_02.jpg         ← ไฟล์ที่ 2 (หน้า 2)
│   │   │   │   └── {file_id}_03.pdf         ← ไฟล์ที่ 3
│   │   │   └── ...
│   │   └── 02/
│   └── 2025/
├── exports/
│   ├── 2026/
│   │   ├── {export_id}_excel.xlsx
│   │   └── {export_id}_docs.zip
│   └── ...
└── temp/
    └── (processing files)
```

### Access Control
- **Signed URL**: สำหรับ access (expire 1 ชั่วโมง)
- **No public access**: ทุกไฟล์ต้องผ่าน signed URL

### Retention Policy
| Type | Retention |
|------|-----------|
| Documents | เก็บถาวร (ไม่ลบอัตโนมัติ) |
| Exports | 7 วัน (แล้วลบ) |
| Temp files | 24 ชั่วโมง |

---

## 6.4 File Naming Convention

### Document Files
```
{doc_number}_{YYYY-MM-DD}_{vendor}_{amount}.{ext}

ตัวอย่าง:
DOC-202601-0001_2026-01-12_7eleven_150.jpg
DOC-202601-0002_2026-01-12_grab_350.pdf
```

### Export Files
```
{export_type}_{YYYY-MM-DD}_{HHmm}_{count}docs.{ext}

ตัวอย่าง:
PEAK_2026-01-12_1430_25docs.xlsx
ZIP_2026-01-12_1430_10docs.zip
```

---

## 6.5 Duplicate Detection

### Exact Match (Checksum)
```javascript
// MD5 hash ของไฟล์
file_checksum = MD5(file_content)

// ตรวจสอบ
SELECT * FROM documents 
WHERE file_checksum = :new_checksum
```

### Soft Match
```javascript
// ตรวจ: ยอด + คู่ค้า + วันที่ ใกล้เคียงกัน
SELECT * FROM documents 
WHERE contact_name ILIKE :contact
  AND total_amount BETWEEN :amount - 10 AND :amount + 10
  AND doc_date BETWEEN :date - 3 days AND :date + 3 days
  AND status NOT IN ('void', 'rejected')
```

### Response Actions
| Match Type | Action |
|------------|--------|
| Exact (checksum) | Block upload + show original |
| Soft match | Warning + allow override |

---

## 6.6 Image Processing

### On Upload
1. **Validate**: ตรวจ format + size
2. **Compress**: ถ้า > 2 MB
3. **Generate checksum**: MD5 hash
4. **Extract metadata**: EXIF date, dimensions
5. **Upload to storage**

### OCR Pipeline (Phase 2)
```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Upload  │────▶│ Queue   │────▶│ OCR     │────▶│ Extract │
│         │     │         │     │ Service │     │ Fields  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │ Update doc  │
                                              │ extracted_  │
                                              │ json field  │
                                              └─────────────┘
```

### Extracted Fields
```json
{
  "contact_name": "7-Eleven",
  "doc_date": "2026-01-12",
  "total_amount": 150.00,
  "vat_amount": null,
  "items": [
    {"description": "กาแฟ", "amount": 45},
    {"description": "ขนมปัง", "amount": 35}
  ],
  "confidence": 0.85
}
```

---

## 6.7 Export Formats

### Generic Excel
```
| เลขที่เอกสาร | วันที่ | ประเภท | ร้าน | ยอดก่อน VAT | VAT | ยอดรวม | หมวด | ศูนย์ต้นทุน | สถานะ |
```

### PEAK ImportExpense
```
| วันที่ | เลขที่เอกสาร | ผู้ติดต่อ | รายละเอียด | จำนวน | หน่วยละ | รหัสบัญชี | ภาษี |
```

### ZIP Package
```
export_2026-01-12.zip
├── documents/
│   ├── DOC-202601-0001_7eleven_150.jpg
│   ├── DOC-202601-0002_grab_350.pdf
│   └── ...
├── summary.xlsx
└── manifest.json
```

---

## 6.8 Backup Strategy

### Daily Backup
- Database: Automated daily backup
- Files: Sync to secondary storage

### Disaster Recovery
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours

### Data Export (User-initiated)
- Export ข้อมูลทั้งหมดเป็น JSON/CSV
- รวมไฟล์เอกสารทั้งหมดเป็น ZIP
