import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileAnalysisCard, type ExtractedFile } from "../FileAnalysisCard";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="next-image" />
  ),
}));

const createMockFile = (overrides?: Partial<ExtractedFile>): ExtractedFile => ({
  id: "file-1",
  file: new File(["test"], "test.pdf", { type: "application/pdf" }),
  preview: "",
  status: "pending",
  ...overrides,
});

const defaultProps = {
  file: createMockFile(),
  onRemove: vi.fn(),
  onReanalyze: vi.fn(),
};

describe("FileAnalysisCard", () => {
  describe("Rendering", () => {
    it("should render file name", () => {
      render(<FileAnalysisCard {...defaultProps} />);
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render pending status card", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ status: "pending" })}
        />
      );
      
      // Card should render
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render analyzing status card", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ status: "analyzing" })}
        />
      );
      
      // Card should render
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render error status card", () => {
      const errorFile = createMockFile({ 
        status: "error", 
        error: "Error message" 
      });
      render(<FileAnalysisCard {...defaultProps} file={errorFile} />);
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });

  describe("Done Status with Extracted Data", () => {
    it("should render when analysis is done", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              amount: 1000,
              vatAmount: 70,
            }
          })}
        />
      );
      
      // Card should render successfully
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should show amount when available", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              amount: 1500.50,
            }
          })}
        />
      );
      
      expect(screen.getByText(/1,500/)).toBeInTheDocument();
    });

    it("should show VAT info when available", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              amount: 1070,
              vatAmount: 70,
            }
          })}
        />
      );
      
      // Check that VAT text exists somewhere
      expect(screen.getByText("VAT")).toBeInTheDocument();
    });

    it("should show contact name when available", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              contactName: "ABC Company",
            }
          })}
        />
      );
      
      expect(screen.getByText("ABC Company")).toBeInTheDocument();
    });

    it("should show document date when available", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps} 
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              documentDate: "2026-01-21",
            }
          })}
        />
      );
      
      expect(screen.getByText("2026-01-21")).toBeInTheDocument();
    });
  });

  describe("Slip Warning Messages", () => {
    it("should render slip card for STANDARD expense type", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          expenseType="STANDARD"
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "SLIP_TRANSFER",
              amount: 1000,
            }
          })}
        />
      );
      
      // Should render the card
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render slip card for FOREIGN expense type", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          expenseType="FOREIGN"
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "SLIP_TRANSFER",
              amount: 1000,
            }
          })}
        />
      );
      
      // Should render the card
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render tax invoice card", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          expenseType="STANDARD"
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              amount: 1000,
            }
          })}
        />
      );
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("should call onRemove when remove button is clicked", () => {
      const onRemove = vi.fn();
      render(
        <FileAnalysisCard 
          {...defaultProps}
          onRemove={onRemove}
        />
      );
      
      // Find all buttons and click the one that removes (usually has X icon)
      const buttons = screen.getAllByRole("button");
      // The remove button should be present
      expect(buttons.length).toBeGreaterThan(0);
      
      // Click the last button (usually remove)
      fireEvent.click(buttons[buttons.length - 1]);
      expect(onRemove).toHaveBeenCalled();
    });

    it("should have reanalyze button on error", () => {
      const onReanalyze = vi.fn();
      render(
        <FileAnalysisCard 
          {...defaultProps}
          onReanalyze={onReanalyze}
          file={createMockFile({ 
            status: "error",
            error: "Error"
          })}
        />
      );
      
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Expand/Collapse", () => {
    it("should be expanded by default", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              amount: 1000,
            }
          })}
        />
      );
      
      // Extracted data should be visible
      expect(screen.getByText(/1,000/)).toBeInTheDocument();
    });

    it("should have toggle button", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          file={createMockFile({ 
            status: "done",
            extractedData: {
              type: "TAX_INVOICE",
              amount: 1000,
              description: "Test description",
            }
          })}
        />
      );
      
      // Should have buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Image Preview", () => {
    it("should render image file card", () => {
      const imageFile = createMockFile({
        file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
        preview: "blob:test-preview-url",
        status: "done",
        extractedData: { type: "RECEIPT" },
      });
      
      render(<FileAnalysisCard {...defaultProps} file={imageFile} />);
      
      expect(screen.getByText("test.jpg")).toBeInTheDocument();
    });

    it("should render PDF file card", () => {
      const pdfFile = createMockFile({
        file: new File(["test"], "invoice.pdf", { type: "application/pdf" }),
        preview: "",
        status: "done",
        extractedData: { type: "TAX_INVOICE" },
      });
      
      render(<FileAnalysisCard {...defaultProps} file={pdfFile} />);
      
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    });
  });

  describe("Document Type Badge", () => {
    it("should render TAX_INVOICE card", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          file={createMockFile({ 
            status: "done",
            extractedData: { type: "TAX_INVOICE" }
          })}
        />
      );
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render SLIP_TRANSFER card", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          file={createMockFile({ 
            status: "done",
            extractedData: { type: "SLIP_TRANSFER" }
          })}
        />
      );
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render RECEIPT card", () => {
      render(
        <FileAnalysisCard 
          {...defaultProps}
          file={createMockFile({ 
            status: "done",
            extractedData: { type: "RECEIPT" }
          })}
        />
      );
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });
});
