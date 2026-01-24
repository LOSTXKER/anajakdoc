"use client";

import { Building2, User, Sparkles, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Contact with vendor defaults for Smart Guess feature (Section 9)
 */
export interface ContactWithDefaults {
  id: string;
  name: string;
  taxId?: string | null;
  contactType?: "COMPANY" | "INDIVIDUAL";
  whtApplicable?: boolean;
  defaultWhtRate?: number | null;
  defaultVatRequired?: boolean;
}

interface ContactSelectorProps {
  /** Current selected contact ID */
  value?: string;
  /** Callback when contact changes */
  onChange: (contactId: string) => void;
  /** List of contacts to choose from */
  contacts: ContactWithDefaults[];
  /** Whether contacts are loading */
  loading?: boolean;
  /** Label to display above the selector */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow "none" selection */
  allowNone?: boolean;
  /** Whether selector is disabled */
  disabled?: boolean;
  /** Show smart guess badge when contact has defaults */
  showSmartGuessBadge?: boolean;
  /** Show smart guess info panel below selector */
  showSmartGuessInfo?: boolean;
  /** The selected contact object (derived from value) */
  selectedContact?: ContactWithDefaults | null;
  /** Helper text to display below selector */
  helperText?: string;
  /** Variant of selector */
  variant?: "default" | "compact";
}

/**
 * Contact selector component with Smart Guess feature support.
 * 
 * @example
 * // Basic usage
 * <ContactSelector
 *   value={contactId}
 *   onChange={(id) => {
 *     setContactId(id);
 *     const contact = contacts.find(c => c.id === id);
 *     // Handle smart guess
 *     if (contact?.defaultVatRequired) setHasVat(true);
 *     if (contact?.whtApplicable) setHasWht(true);
 *   }}
 *   contacts={contacts}
 *   loading={contactsLoading}
 *   label="ผู้ขาย/ร้านค้า"
 * />
 * 
 * @example
 * // With smart guess info panel
 * <ContactSelector
 *   value={contactId}
 *   onChange={handleContactChange}
 *   contacts={contacts}
 *   selectedContact={contacts.find(c => c.id === contactId)}
 *   showSmartGuessInfo
 * />
 */
export function ContactSelector({
  value,
  onChange,
  contacts,
  loading = false,
  label = "ผู้ติดต่อ",
  placeholder = "เลือกผู้ติดต่อ...",
  allowNone = false,
  disabled = false,
  showSmartGuessBadge = true,
  showSmartGuessInfo = false,
  selectedContact,
  helperText,
  variant = "default",
}: ContactSelectorProps) {
  // Determine if selected contact has defaults for smart guess
  const hasDefaults = selectedContact?.defaultVatRequired || selectedContact?.whtApplicable;

  // Handle value for select (convert undefined/null to special value for "none")
  const selectValue = value || (allowNone ? "__none__" : "");
  const handleChange = (newValue: string) => {
    onChange(newValue === "__none__" ? "" : newValue);
  };

  return (
    <div className="space-y-2">
      {/* Label with Smart Guess badge */}
      {(label || (showSmartGuessBadge && hasDefaults)) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label className={variant === "compact" ? "text-sm" : "text-base font-medium"}>
              {label}
            </Label>
          )}
          {showSmartGuessBadge && hasDefaults && (
            <Badge 
              variant="secondary" 
              className="text-xs gap-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            >
              <Sparkles className="h-3 w-3" />
              Smart Guess
            </Badge>
          )}
        </div>
      )}

      {/* Select dropdown */}
      <Select 
        value={selectValue} 
        onValueChange={handleChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={variant === "compact" ? "h-9" : "h-11"}>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังโหลด...
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {allowNone && (
            <SelectItem value="__none__">ไม่ระบุ</SelectItem>
          )}
          {contacts.map((contact) => (
            <SelectItem key={contact.id} value={contact.id}>
              <div className="flex items-center gap-2">
                {contact.contactType === "COMPANY" ? (
                  <Building2 className="h-4 w-4 text-blue-500" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{contact.name}</span>
                {(contact.defaultVatRequired || contact.whtApplicable) && (
                  <Sparkles className="h-3 w-3 text-amber-500" />
                )}
              </div>
            </SelectItem>
          ))}
          {contacts.length === 0 && !loading && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              ยังไม่มีรายชื่อ
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Helper text */}
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {/* Smart Guess info panel */}
      {showSmartGuessInfo && hasDefaults && selectedContact && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-400">
            <p className="font-medium">ตั้งค่าอัตโนมัติจากประวัติ:</p>
            <ul className="mt-1 space-y-0.5">
              {selectedContact.defaultVatRequired && (
                <li>• ใบกำกับภาษี (VAT)</li>
              )}
              {selectedContact.whtApplicable && (
                <li>• หัก ณ ที่จ่าย {selectedContact.defaultWhtRate}%</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
