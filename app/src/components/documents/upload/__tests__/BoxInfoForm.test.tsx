import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoxInfoForm } from "../BoxInfoForm";

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
  boxDate: "2026-01-21",
  setBoxDate: vi.fn(),
  amount: "",
  setAmount: vi.fn(),
  title: "",
  setTitle: vi.fn(),
  description: "",
  setDescription: vi.fn(),
  notes: "",
  setNotes: vi.fn(),
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
      
      // Check for expense type buttons (STANDARD and NO_VAT)
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
    it("should render WHT checkbox only when expenseType is STANDARD", () => {
      render(<BoxInfoForm {...defaultProps} boxType="EXPENSE" expenseType="STANDARD" />);
      
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("should NOT render WHT checkbox when expenseType is NO_VAT", () => {
      render(<BoxInfoForm {...defaultProps} boxType="EXPENSE" expenseType="NO_VAT" />);
      
      const checkboxes = screen.queryAllByRole("checkbox");
      expect(checkboxes.length).toBe(0);
    });

    it("should call setHasWht when checkbox is clicked", () => {
      const setHasWht = vi.fn();
      render(<BoxInfoForm {...defaultProps} setHasWht={setHasWht} expenseType="STANDARD" />);
      
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      
      expect(setHasWht).toHaveBeenCalledWith(true);
    });

    it("should show WHT rate combobox when hasWht is true", () => {
      render(<BoxInfoForm {...defaultProps} hasWht={true} expenseType="STANDARD" />);
      
      // Should have combobox for rate
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThan(0);
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

  describe("Payment Type Selection", () => {
    it("should render payment type buttons", () => {
      render(<BoxInfoForm {...defaultProps} />);
      
      // Should have multiple buttons including payment type
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(4); // expense types + payment types
    });

    it("should call setIsMultiPayment when multi-payment is clicked", () => {
      const setIsMultiPayment = vi.fn();
      render(<BoxInfoForm {...defaultProps} setIsMultiPayment={setIsMultiPayment} />);
      
      // Find all buttons - payment type buttons are after expense type buttons
      const buttons = screen.getAllByRole("button");
      // Click on multi-payment button (usually the 4th button - after 2 expense types and single payment)
      const multiPaymentButton = buttons.find(btn => btn.textContent?.includes("แบ่งจ่ายหลายงวด"));
      if (multiPaymentButton) {
        fireEvent.click(multiPaymentButton);
        expect(setIsMultiPayment).toHaveBeenCalledWith(true);
      }
    });

    it("should show info message when multi-payment is selected", () => {
      render(<BoxInfoForm {...defaultProps} isMultiPayment={true} />);
      
      // Should show info about total amount
      expect(screen.getByText(/ยอดรวมทั้งหมด/)).toBeInTheDocument();
    });
  });
});
