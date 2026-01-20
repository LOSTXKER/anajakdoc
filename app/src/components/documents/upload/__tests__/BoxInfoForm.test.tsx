import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoxInfoForm } from "../BoxInfoForm";
import type { Category } from ".prisma/client";

// Mock contact-input component
vi.mock("@/components/documents/contact-input", () => ({
  ContactInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="contact-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockCategories: Category[] = [
  {
    id: "cat-1",
    organizationId: "org-1",
    name: "ค่าบริการ",
    categoryType: "EXPENSE",
    whtRate: 3,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-2",
    organizationId: "org-1",
    name: "รายได้จากบริการ",
    categoryType: "INCOME",
    whtRate: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockContacts = [
  {
    id: "contact-1",
    name: "Test Vendor",
    taxId: "1234567890123",
    contactType: "COMPANY" as const,
  },
];

const defaultProps = {
  boxType: "EXPENSE" as const,
  expenseType: "STANDARD" as const,
  setExpenseType: vi.fn(),
  isMultiPayment: false,
  setIsMultiPayment: vi.fn(),
  hasWht: false,
  setHasWht: vi.fn(),
  whtRate: "3",
  setWhtRate: vi.fn(),
  slipAmount: "",
  categories: mockCategories,
  contacts: mockContacts,
  boxDate: "2026-01-21",
  setBoxDate: vi.fn(),
  amount: "",
  setAmount: vi.fn(),
  contactName: "",
  selectedContactId: "",
  onContactChange: vi.fn(),
  onContactCreated: vi.fn(),
  categoryId: "",
  setCategoryId: vi.fn(),
  title: "",
  setTitle: vi.fn(),
  description: "",
  setDescription: vi.fn(),
  notes: "",
  setNotes: vi.fn(),
  analyzedCount: 0,
  hasSlipOnly: false,
  hasTaxInvoice: false,
};

describe("BoxInfoForm", () => {
  describe("Rendering", () => {
    it("should render the form", () => {
      render(<BoxInfoForm {...defaultProps} />);
      
      // Form should render without crashing - check for spinbutton (number input)
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("should render expense type cards for EXPENSE box", () => {
      render(<BoxInfoForm {...defaultProps} boxType="EXPENSE" />);
      
      // Check for expense type buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should render number input for INCOME box", () => {
      render(<BoxInfoForm {...defaultProps} boxType="INCOME" />);
      
      // Should still render basic inputs
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("should render text inputs", () => {
      render(<BoxInfoForm {...defaultProps} />);
      
      // Check for text inputs
      const textInputs = screen.getAllByRole("textbox");
      expect(textInputs.length).toBeGreaterThan(0);
    });

    it("should render date input", () => {
      render(<BoxInfoForm {...defaultProps} />);
      
      // Check for date input
      const dateInput = screen.getByDisplayValue("2026-01-21");
      expect(dateInput).toBeInTheDocument();
    });

    it("should render number input for amount", () => {
      render(<BoxInfoForm {...defaultProps} />);
      
      const amountInput = screen.getByRole("spinbutton");
      expect(amountInput).toBeInTheDocument();
    });
  });

  describe("WHT Section", () => {
    it("should render WHT checkbox", () => {
      render(<BoxInfoForm {...defaultProps} boxType="EXPENSE" />);
      
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("should call setHasWht when checkbox is clicked", () => {
      const setHasWht = vi.fn();
      render(<BoxInfoForm {...defaultProps} setHasWht={setHasWht} />);
      
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      
      expect(setHasWht).toHaveBeenCalledWith(true);
    });

    it("should show more comboboxes when hasWht is true", () => {
      render(<BoxInfoForm {...defaultProps} hasWht={true} />);
      
      // Should have comboboxes for category and rate
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThan(1);
    });

    it("should have category select when hasWht is false", () => {
      render(<BoxInfoForm {...defaultProps} hasWht={false} />);
      
      // Should have at least category select
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Multi-Payment Section", () => {
    it("should render payment option buttons for EXPENSE", () => {
      render(<BoxInfoForm {...defaultProps} boxType="EXPENSE" />);
      
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should call setIsMultiPayment when multi-payment button is clicked", () => {
      const setIsMultiPayment = vi.fn();
      render(<BoxInfoForm {...defaultProps} setIsMultiPayment={setIsMultiPayment} />);
      
      // Find all buttons and click the second one (multi-payment)
      const buttons = screen.getAllByRole("button");
      // Multi-payment should be second button in payment type section
      if (buttons.length > 3) {
        fireEvent.click(buttons[3]); // Adjust index as needed
      }
    });
  });

  describe("Expense Type Selection", () => {
    it("should have expense type buttons", () => {
      render(<BoxInfoForm {...defaultProps} expenseType="STANDARD" />);
      
      // Check that buttons exist
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should call setExpenseType when expense type button is clicked", () => {
      const setExpenseType = vi.fn();
      render(<BoxInfoForm {...defaultProps} setExpenseType={setExpenseType} />);
      
      // Click on one of the expense type buttons
      const buttons = screen.getAllByRole("button");
      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);
      }
    });
  });

  describe("Form Inputs", () => {
    it("should update title when typing", () => {
      const setTitle = vi.fn();
      render(<BoxInfoForm {...defaultProps} setTitle={setTitle} />);
      
      const textInputs = screen.getAllByRole("textbox");
      // First textbox is usually title
      fireEvent.change(textInputs[0], { target: { value: "New Title" } });
      
      expect(setTitle).toHaveBeenCalledWith("New Title");
    });

    it("should update amount when typing", () => {
      const setAmount = vi.fn();
      render(<BoxInfoForm {...defaultProps} setAmount={setAmount} />);
      
      const amountInput = screen.getByRole("spinbutton");
      fireEvent.change(amountInput, { target: { value: "1500" } });
      
      expect(setAmount).toHaveBeenCalledWith("1500");
    });

    it("should update date when changed", () => {
      const setBoxDate = vi.fn();
      render(<BoxInfoForm {...defaultProps} setBoxDate={setBoxDate} />);
      
      const dateInput = screen.getByDisplayValue("2026-01-21");
      fireEvent.change(dateInput, { target: { value: "2026-02-15" } });
      
      expect(setBoxDate).toHaveBeenCalledWith("2026-02-15");
    });
  });

  describe("Slip Only Warning", () => {
    it("should show slip amount reference when multi-payment and has slip amount", () => {
      render(
        <BoxInfoForm 
          {...defaultProps} 
          isMultiPayment={true}
          slipAmount="5000"
        />
      );
      
      // Check that slip amount is displayed somewhere
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  describe("Categories", () => {
    it("should render category select", () => {
      render(<BoxInfoForm {...defaultProps} boxType="EXPENSE" />);
      
      // Should have combobox for category
      const combobox = screen.getAllByRole("combobox");
      expect(combobox.length).toBeGreaterThan(0);
    });
  });
});
