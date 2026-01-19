"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Plus, Building2, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { createQuickContact } from "@/server/actions/settings";
import { toast } from "sonner";

export interface ContactOption {
  id: string;
  name: string;
  taxId?: string | null;
  contactType?: "COMPANY" | "INDIVIDUAL";
}

interface ContactInputProps {
  value: string;
  onChange: (value: string, contactId?: string) => void;
  contacts: ContactOption[];
  placeholder?: string;
  defaultRole?: "VENDOR" | "CUSTOMER" | "BOTH";
  disabled?: boolean;
  onContactCreated?: (contact: ContactOption) => void;
}

export function ContactInput({
  value,
  onChange,
  contacts,
  placeholder = "พิมพ์ชื่อผู้ติดต่อ...",
  defaultRole = "VENDOR",
  disabled = false,
  onContactCreated,
}: ContactInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasJustSelected = useRef(false);

  // Sync external value changes
  useEffect(() => {
    if (!wasJustSelected.current) {
      setInputValue(value);
    }
    wasJustSelected.current = false;
  }, [value]);

  // Filter contacts based on input
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Check if exact match exists
  const exactMatch = contacts.find(
    (c) => c.name.toLowerCase() === inputValue.toLowerCase()
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Check for exact match and update parent
    const match = contacts.find(
      (c) => c.name.toLowerCase() === newValue.toLowerCase()
    );
    onChange(newValue, match?.id);
    
    // Open dropdown when typing
    if (newValue && !open) {
      setOpen(true);
    }
  };

  // Handle contact selection
  const handleSelect = useCallback((contact: ContactOption) => {
    wasJustSelected.current = true;
    setInputValue(contact.name);
    onChange(contact.name, contact.id);
    setOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle create new contact
  const handleCreateNew = async () => {
    if (!inputValue.trim()) return;
    
    setIsCreating(true);
    try {
      const result = await createQuickContact(inputValue.trim(), defaultRole);
      
      if (result.success && result.data) {
        const newContact: ContactOption = {
          id: result.data.id,
          name: result.data.name,
          taxId: result.data.taxId,
          contactType: result.data.contactType,
        };
        
        // Notify parent
        onContactCreated?.(newContact);
        
        // Select the new contact
        wasJustSelected.current = true;
        onChange(newContact.name, newContact.id);
        toast.success(`เพิ่ม "${inputValue}" เรียบร้อย`);
        setOpen(false);
      } else {
        toast.error(result.error || "ไม่สามารถเพิ่มผู้ติดต่อได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle blur - check for fuzzy match
  const handleBlur = () => {
    // Small delay to allow click events to fire first
    setTimeout(() => {
      if (!inputValue.trim()) {
        onChange("", undefined);
        return;
      }

      // If no exact match, find closest match
      if (!exactMatch) {
        const fuzzyMatch = contacts.find((c) =>
          c.name.toLowerCase().startsWith(inputValue.toLowerCase())
        );
        
        if (fuzzyMatch) {
          // Auto-complete to the closest match
          wasJustSelected.current = true;
          setInputValue(fuzzyMatch.name);
          onChange(fuzzyMatch.name, fuzzyMatch.id);
        }
      }
    }, 200);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue && setOpen(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pr-10",
              exactMatch && "border-green-500 focus-visible:ring-green-500"
            )}
          />
          {exactMatch && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandList>
            {filteredContacts.length === 0 && !inputValue && (
              <CommandEmpty>ยังไม่มีรายชื่อ</CommandEmpty>
            )}
            
            {filteredContacts.length > 0 && (
              <CommandGroup heading="รายชื่อที่บันทึกไว้">
                {filteredContacts.slice(0, 10).map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.name}
                    onSelect={() => handleSelect(contact)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {contact.contactType === "COMPANY" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        {contact.taxId && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {contact.taxId}
                          </p>
                        )}
                      </div>
                    </div>
                    {contact.name.toLowerCase() === inputValue.toLowerCase() && (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {inputValue && !exactMatch && (
              <>
                {filteredContacts.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNew}
                    disabled={isCreating}
                    className="cursor-pointer"
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    <span>
                      บันทึก &ldquo;<span className="font-medium">{inputValue}</span>&rdquo; เป็นผู้ติดต่อใหม่
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
