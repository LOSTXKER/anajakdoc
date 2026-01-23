# Navigation Quick Reference Guide
## Role-Based Navigation Recommendations

---

## 🎯 Quick Wins (Implement First)

### 1. Make Settings Collapsible
**Current**: All settings items always visible  
**Change**: Collapse settings section by default, expand on click

```tsx
// Add collapsible state
const [settingsExpanded, setSettingsExpanded] = useState(false);

// Wrap settings in collapsible component
<Collapsible open={settingsExpanded} onOpenChange={setSettingsExpanded}>
  <CollapsibleTrigger>⚙️ ตั้งค่า</CollapsibleTrigger>
  <CollapsibleContent>
    {/* Settings items */}
  </CollapsibleContent>
</Collapsible>
```

### 2. Role-Specific Default Views
**Current**: All users see same document list  
**Change**: Filter by default based on role

- **STAFF**: Show only "My Documents" by default
- **ACCOUNTING**: Show "Pending Review" by default  
- **OWNER**: Show "All Documents" with dashboard metrics
- **FIRM**: Show "All Clients" overview

### 3. Dashboard as Landing Page
**Current**: Documents page is likely default  
**Change**: Redirect to `/dashboard` after login, show role-appropriate content

---

## 📋 Navigation Structure by Role

### STAFF (Regular Employees)
```
✅ Show:
  - Documents (filtered to "My Documents")
  - Dashboard (simplified)
  - Create Box button (prominent)

❌ Hide:
  - Accounting tools section
  - Settings section (except profile)
  - Firm tools

💡 Progressive Disclosure:
  - Advanced filters collapsed
  - Export options hidden until needed
```

### OWNER (Business Owners)
```
✅ Show:
  - Documents (all)
  - Dashboard (with KPIs)
  - Reports (high-level)
  - Settings (organization-level)

❌ Hide:
  - Detailed accounting tools (WHT, export workflows)
  - Firm tools (unless also firm member)

💡 Progressive Disclosure:
  - Detailed accounting in "More" menu
  - Advanced settings collapsible
```

### ACCOUNTING (Internal Accountants)
```
✅ Show:
  - Documents (with review filters)
  - Dashboard (accounting-focused)
  - All accounting tools (WHT, Export, Reports)
  - Settings (accounting-related)

❌ Hide:
  - Firm tools (unless firm member)
  - Organization admin settings

💡 Progressive Disclosure:
  - Bulk operations in toolbar
  - Advanced export profiles in dropdown
```

### FIRM MEMBER (Accounting Firms)
```
✅ Show:
  - Firm dashboard (client overview)
  - Client switcher (prominent)
  - Multi-client tools
  - Firm settings

❌ Hide:
  - Individual org settings (unless in client context)

💡 Progressive Disclosure:
  - Client tools via client context
  - Bulk operations across clients
```

---

## 🔧 Implementation Checklist

### Phase 1: Core Improvements
- [ ] Add collapsible Settings section
- [ ] Implement role-based default document filters
- [ ] Set Dashboard as default landing page
- [ ] Add role-specific empty states
- [ ] Enhance organization switcher with role badges

### Phase 2: Enhanced UX
- [ ] Add "More" menu for advanced features
- [ ] Implement user preferences for navigation
- [ ] Add keyboard shortcuts (Cmd+K command palette)
- [ ] Improve mobile navigation (bottom nav bar)

### Phase 3: Advanced Features
- [ ] App launcher (waffle menu) for quick access
- [ ] Customizable dashboard widgets
- [ ] User onboarding flows per role
- [ ] Analytics for navigation usage

---

## 🎨 Visual Hierarchy Recommendations

### Priority Levels
1. **Primary Actions** (Always visible, prominent)
   - Create Box button
   - Documents
   - Dashboard

2. **Secondary Actions** (Role-based, visible when relevant)
   - Accounting tools
   - Reports
   - Settings

3. **Tertiary Actions** (Progressive disclosure)
   - Advanced filters
   - Export profiles
   - Integrations

### Color Coding (Current Implementation)
- **Primary nav**: Blue/Primary color
- **Accounting tools**: Emerald/Green
- **Firm tools**: Violet/Purple
- **Settings**: Gray/Neutral

**Recommendation**: Keep this color coding, it helps users understand context.

---

## 📱 Mobile Considerations

### Current
- Hamburger menu in header
- Sidebar hidden on mobile

### Recommended
- **Bottom navigation bar** for primary actions
- **Floating Action Button (FAB)** for "Create Box"
- **Swipe gestures** for quick access
- **Contextual sheets** for secondary actions

---

## 🔍 Search & Discovery

### Current
- Search likely exists but may not be role-aware

### Recommended
- **Role-filtered search** (STAFF sees only their docs)
- **Quick filters** based on common tasks
- **Recent items** section
- **Keyboard shortcuts** (Cmd+K for command palette)

---

## 📊 Metrics to Track

After implementation:
1. **Navigation click rates** by role
2. **Time to first action** (how quickly users find features)
3. **Feature discovery** (are advanced features being found?)
4. **User satisfaction** (navigation clarity surveys)

---

## 🚀 Quick Implementation Example

```tsx
// Enhanced sidebar with collapsible sections
const AppSidebar = ({ user }: AppSidebarProps) => {
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
  const userRole = user.currentOrganization?.role;
  const isStaff = userRole === 'STAFF';
  const isOwner = userRole === 'OWNER';
  const isAccounting = ['ACCOUNTING', 'ADMIN', 'OWNER'].includes(userRole || '');
  
  return (
    <aside>
      {/* Organization Switcher */}
      
      {/* Create Button - Always visible */}
      
      {/* Main Nav - Always visible */}
      <MainNav items={mainNavItems} />
      
      {/* Accounting Tools - Conditional, visible */}
      {isAccounting && !isStaff && (
        <NavSection title="งานบัญชี" items={accountingItems} />
      )}
      
      {/* Firm Tools - Conditional */}
      {(isFirmMember || isOwner) && (
        <NavSection title="สำนักงานบัญชี" items={firmNavItems} />
      )}
      
      {/* Settings - Collapsible */}
      {isAdmin && (
        <CollapsibleSection
          title="ตั้งค่า"
          expanded={settingsExpanded}
          onToggle={setSettingsExpanded}
          items={settingsNavItems}
        />
      )}
    </aside>
  );
};
```

---

## 📚 Key Principles from Google Workspace

1. **Show what's needed, hide what's not**
2. **Progressive disclosure** - reveal complexity gradually
3. **Context-aware** - adapt to user role and current task
4. **Customizable** - allow users to personalize their workspace
5. **Consistent** - maintain patterns across all user types

---

## 🎯 Success Criteria

Navigation improvements are successful when:
- ✅ STAFF users can upload documents in < 30 seconds
- ✅ OWNER users can see business overview at a glance
- ✅ ACCOUNTING users can access all tools without confusion
- ✅ FIRM members can switch between clients seamlessly
- ✅ All users report navigation feels "intuitive"
