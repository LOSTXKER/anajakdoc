// Re-export all box actions from separate files
// This allows cleaner imports: import { createBox, getBox } from "@/server/actions/box"

// Query operations
export { getBoxes, getBox, searchBoxes, getPendingBoxes } from "./query";

// Create operations  
export { createBox, generateBoxNumber, handleFileUploads } from "./create";

// Update operations
export { 
  updateBox, 
  updateBoxData,
  updateVatStatus,
  updateWhtStatus,
  markDuplicate,
  updateReimbursementStatus,
} from "./update";

// Review/Status operations (simplified 4-status system)
export { 
  submitBox, 
  reviewBox,
  changeBoxStatus,
  getAvailableTransitions,
  requestMoreDocs,
  approveBox,
  revertToEdit,
  // Legacy aliases
  startReview,
  markReadyToBook,
  bookBox,
  archiveBox,
  batchChangeStatus,
} from "./review";

// Delete operations
export { deleteBox } from "./delete";

// Checklist operations
export { toggleChecklistItem, enableWht, recalculateBoxChecklist } from "./checklist";

// File operations
export { addFileToBox, deleteBoxFile } from "./files";

// Tax operations
export { updateBoxTax } from "./tax";

// AI Read operations
export { readBoxDocuments, type AIReadResult } from "./ai-read";
