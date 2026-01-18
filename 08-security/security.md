# 🔒 สิทธิ์และความปลอดภัย

## 11.1 Role-Based Access Control (RBAC)

### Roles

| Role | Level | Description |
|------|-------|-------------|
| `staff` | 1 | พนักงานส่งเอกสาร |
| `accounting` | 2 | ฝ่ายบัญชี |
| `admin` | 3 | ผู้ดูแลระบบ |

### Permission Matrix

| Resource | Action | Staff | Accounting | Admin |
|----------|--------|-------|------------|-------|
| **Documents** | Create | ✅ | ✅ | ✅ |
| | View Own | ✅ | ✅ | ✅ |
| | View All | ❌ | ✅ | ✅ |
| | Edit Own (draft) | ✅ | ✅ | ✅ |
| | Edit All | ❌ | ✅ | ✅ |
| | Delete | ❌ | ❌ | ✅ |
| | Change Status | ❌ | ✅ | ✅ |
| | Void | ❌ | ❌ | ✅ |
| **Expense Groups** | Create | ✅ | ✅ | ✅ |
| | View | ✅ (own docs) | ✅ | ✅ |
| | Edit | ❌ | ✅ | ✅ |
| **Comments** | Add | ✅ | ✅ | ✅ |
| | Add Internal | ❌ | ✅ | ✅ |
| | View Internal | ❌ | ✅ | ✅ |
| **Export** | Export Own | ✅ | ✅ | ✅ |
| | Export All | ❌ | ✅ | ✅ |
| | PEAK Format | ❌ | ✅ | ✅ |
| **Settings** | View | ❌ | ⚠️ limited | ✅ |
| | Edit | ❌ | ❌ | ✅ |
| **Users** | View | ❌ | ❌ | ✅ |
| | Manage | ❌ | ❌ | ✅ |
| **Fiscal Periods** | View | ✅ | ✅ | ✅ |
| | Close/Reopen | ❌ | ✅ | ✅ |

---

## 11.2 Data Isolation

### Current (Single Tenant)
- ทุก user เห็นข้อมูลตาม role
- Staff เห็นเฉพาะเอกสารตัวเอง
- Accounting/Admin เห็นทั้งหมด

### Future (Multi-Tenant / SaaS)
```sql
-- Row-level security
CREATE POLICY company_isolation ON documents
  USING (company_id = current_user_company_id());
```

---

## 11.3 File Storage Security

### Access Control
```
┌─────────────────────────────────────────────────────────────────┐
│                     File Access Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Request                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐                                               │
│  │ API Auth    │ ◀── Check JWT token                           │
│  └──────┬──────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                               │
│  │ Permission  │ ◀── Check role + document ownership           │
│  │ Check       │                                               │
│  └──────┬──────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                               │
│  │ Generate    │ ◀── Signed URL (expire 1 hour)                │
│  │ Signed URL  │                                               │
│  └──────┬──────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                               │
│  │ Client      │ ◀── Direct access to storage                  │
│  │ Downloads   │                                               │
│  └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Signed URL Settings
| Setting | Value |
|---------|-------|
| Expiration | 1 hour |
| Method | GET only |
| IP restriction | Optional |

### No Public Access
- ❌ No public bucket
- ❌ No direct URLs
- ✅ All access via signed URL
- ✅ URLs expire automatically

---

## 11.4 Audit Logging

### Events Logged
| Event | Data Captured |
|-------|---------------|
| Login | user_id, ip, timestamp, device |
| Document Created | user_id, doc_id, timestamp |
| Document Updated | user_id, doc_id, changes (before/after), timestamp |
| Status Changed | user_id, doc_id, old_status, new_status, timestamp |
| Document Exported | user_id, doc_ids[], export_type, timestamp |
| Document Deleted | user_id, doc_id, timestamp, reason |
| Settings Changed | user_id, setting, old_value, new_value, timestamp |
| Fiscal Period Closed | user_id, year, month, timestamp |
| Fiscal Period Reopened | user_id, year, month, reason, timestamp |

### Log Format
```json
{
  "id": "uuid",
  "timestamp": "2026-01-12T10:30:00Z",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "action": "document.status_changed",
  "resource_type": "document",
  "resource_id": "DOC-202601-0001",
  "details": {
    "old_status": "pending_review",
    "new_status": "ready_to_export"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

### Log Retention
| Log Type | Retention |
|----------|-----------|
| Access logs | 30 days |
| Audit logs | 7 years (legal requirement) |
| Error logs | 90 days |

---

## 11.5 Authentication

### Methods
| Method | Phase | Description |
|--------|-------|-------------|
| Email/Password | MVP | Basic authentication |
| Magic Link | MVP | Passwordless via email |
| Google OAuth | Phase 2 | Social login |
| Microsoft OAuth | Phase 2 | Enterprise SSO |

### Session Management
| Setting | Value |
|---------|-------|
| Session duration | 7 days |
| Remember me | 30 days |
| Concurrent sessions | Allowed |
| Session revocation | On password change |

### Password Policy
| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Number | At least 1 |
| Special character | Optional |
| Password history | Last 3 |
| Max age | 90 days (optional) |

---

## 11.6 API Security

### Authentication
```
Authorization: Bearer <JWT_TOKEN>
```

### Rate Limiting
| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 req/min |
| API (authenticated) | 100 req/min |
| File upload | 10 req/min |
| Export | 5 req/min |

### Input Validation
- ✅ Validate all input
- ✅ Sanitize file names
- ✅ Check file types (magic bytes, not just extension)
- ✅ Limit file size
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (output encoding)

---

## 11.7 Data Protection

### Encryption
| Data | At Rest | In Transit |
|------|---------|------------|
| Database | ✅ AES-256 | ✅ TLS 1.3 |
| Files | ✅ AES-256 | ✅ TLS 1.3 |
| Backups | ✅ AES-256 | ✅ TLS 1.3 |

### Sensitive Data Handling
| Data | Protection |
|------|------------|
| Passwords | bcrypt (cost 12) |
| API keys | Hashed, shown once |
| Tax IDs | Encrypted at rest |
| Bank accounts | Not stored |

### Data Deletion
| Request | Action |
|---------|--------|
| Delete document | Soft delete + archive |
| Delete user | Anonymize + keep audit logs |
| Delete company (SaaS) | Full deletion after 30 days |

---

## 11.8 Infrastructure Security

### Network
```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Cloudflare    │ WAF + DDoS protection
                    │   (CDN + WAF)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Load Balancer │ TLS termination
                    │                 │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  App 1   │  │  App 2   │  │  App 3   │
        └──────────┘  └──────────┘  └──────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
        ┌──────────────┐           ┌──────────────┐
        │   Database   │           │   Storage    │
        │  (Private)   │           │  (Private)   │
        └──────────────┘           └──────────────┘
```

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; ...
X-XSS-Protection: 1; mode=block
```

---

## 11.9 Compliance Considerations

### Data Residency
- Database: Thailand (if required)
- Storage: Singapore/Thailand
- Backups: Same region

### Legal Requirements
| Requirement | How We Comply |
|-------------|---------------|
| ข้อมูลส่วนบุคคล (PDPA) | Consent, access rights, deletion |
| เอกสารบัญชี (7 ปี) | Long-term retention |
| สรรพากร | Audit trail, export capability |

### Data Subject Rights (PDPA)
| Right | Implementation |
|-------|----------------|
| Access | Export personal data |
| Rectification | Edit profile |
| Erasure | Request deletion |
| Portability | Export in standard format |
| Object | Opt-out of non-essential processing |

---

## 11.10 Security Checklist

### Before Launch
- [ ] Security audit completed
- [ ] Penetration testing passed
- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak info
- [ ] Logging configured
- [ ] Backup & recovery tested

### Ongoing
- [ ] Dependency updates (weekly)
- [ ] Security patches (immediate)
- [ ] Log monitoring (daily)
- [ ] Access review (monthly)
- [ ] Backup verification (monthly)
- [ ] Incident response drill (quarterly)
