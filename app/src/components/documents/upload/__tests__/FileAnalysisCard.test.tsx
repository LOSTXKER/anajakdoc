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
  status: "done",
  ...overrides,
});

const defaultProps = {
  file: createMockFile(),
  onRemove: vi.fn(),
};

describe("FileAnalysisCard", () => {
  describe("Rendering", () => {
    it("should render file name", () => {
      render(<FileAnalysisCard {...defaultProps} />);
      
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });

    it("should render file size", () => {
      render(<FileAnalysisCard {...defaultProps} />);
      
      // File size should be displayed (4 bytes = "4 B")
      expect(screen.getByText(/B|KB|MB/)).toBeInTheDocument();
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
      
      // Find the remove button
      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      
      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe("File Types", () => {
    it("should render image file with preview", () => {
      const imageFile = createMockFile({
        file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
        preview: "blob:test-preview-url",
        status: "done",
      });
      
      render(<FileAnalysisCard {...defaultProps} file={imageFile} />);
      
      expect(screen.getByText("test.jpg")).toBeInTheDocument();
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("should render PDF file without image preview", () => {
      const pdfFile = createMockFile({
        file: new File(["test"], "invoice.pdf", { type: "application/pdf" }),
        preview: "",
        status: "done",
      });
      
      render(<FileAnalysisCard {...defaultProps} file={pdfFile} />);
      
      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
      // Should not have image preview
      expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
    });

    it("should render other file types", () => {
      const otherFile = createMockFile({
        file: new File(["test"], "document.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
        preview: "",
        status: "done",
      });
      
      render(<FileAnalysisCard {...defaultProps} file={otherFile} />);
      
      expect(screen.getByText("document.docx")).toBeInTheDocument();
    });
  });
});
