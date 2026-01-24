"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing dialog state with optional editing item.
 * 
 * Replaces the common pattern of:
 * ```typescript
 * const [dialogOpen, setDialogOpen] = useState(false);
 * const [editingItem, setEditingItem] = useState<Item | null>(null);
 * 
 * const openEditDialog = (item: Item) => {
 *   setEditingItem(item);
 *   setDialogOpen(true);
 * };
 * 
 * const openCreateDialog = () => {
 *   setEditingItem(null);
 *   setDialogOpen(true);
 * };
 * ```
 * 
 * @example
 * // Basic usage
 * const dialog = useDialog<Contact>();
 * 
 * // In JSX
 * <Button onClick={dialog.openCreate}>Add New</Button>
 * <Button onClick={() => dialog.openEdit(contact)}>Edit</Button>
 * 
 * <Dialog open={dialog.open} onOpenChange={dialog.setOpen}>
 *   <ContactForm 
 *     contact={dialog.editingItem}
 *     isEdit={dialog.isEditMode}
 *     onSuccess={dialog.close}
 *   />
 * </Dialog>
 */
export function useDialog<T = unknown>() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setOpen(true);
  }, []);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Delay clearing editingItem to allow for closing animation
    setTimeout(() => setEditingItem(null), 150);
  }, []);

  const toggle = useCallback(() => {
    if (open) {
      close();
    } else {
      openCreate();
    }
  }, [open, close, openCreate]);

  return {
    /** Whether the dialog is open */
    open,
    /** Set the open state directly */
    setOpen,
    /** The item being edited (null for create mode) */
    editingItem,
    /** Set the editing item directly */
    setEditingItem,
    /** Open dialog in create mode (editingItem = null) */
    openCreate,
    /** Open dialog in edit mode with the given item */
    openEdit,
    /** Close the dialog and clear editing item */
    close,
    /** Toggle dialog open/close */
    toggle,
    /** Whether in edit mode (editingItem is not null) */
    isEditMode: editingItem !== null,
    /** Whether in create mode (editingItem is null) */
    isCreateMode: editingItem === null,
  };
}

/**
 * Extended version of useDialog for CRUD operations with delete confirmation.
 * 
 * @example
 * const crud = useCrudDialog<Contact>();
 * 
 * // In JSX
 * <Button onClick={crud.openCreate}>Add</Button>
 * <Button onClick={() => crud.openEdit(contact)}>Edit</Button>
 * <Button onClick={() => crud.openDelete(contact)}>Delete</Button>
 * 
 * <Dialog open={crud.formOpen} onOpenChange={crud.setFormOpen}>
 *   <ContactForm 
 *     contact={crud.editingItem}
 *     onSuccess={crud.closeForm}
 *   />
 * </Dialog>
 * 
 * <AlertDialog open={crud.deleteOpen} onOpenChange={crud.setDeleteOpen}>
 *   <AlertDialogContent>
 *     <p>Delete {crud.deletingItem?.name}?</p>
 *     <Button onClick={() => handleDelete(crud.deletingItem)}>Confirm</Button>
 *   </AlertDialogContent>
 * </AlertDialog>
 */
export function useCrudDialog<T = unknown>() {
  // Form dialog state (create/edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);

  // Form dialog actions
  const openCreate = useCallback(() => {
    setEditingItem(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setTimeout(() => setEditingItem(null), 150);
  }, []);

  // Delete dialog actions
  const openDelete = useCallback((item: T) => {
    setDeletingItem(item);
    setDeleteOpen(true);
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteOpen(false);
    setTimeout(() => setDeletingItem(null), 150);
  }, []);

  // Close all dialogs
  const closeAll = useCallback(() => {
    closeForm();
    closeDelete();
  }, [closeForm, closeDelete]);

  return {
    // Form dialog state
    formOpen,
    setFormOpen,
    editingItem,
    setEditingItem,
    isEditMode: editingItem !== null,
    isCreateMode: editingItem === null,

    // Form dialog actions
    openCreate,
    openEdit,
    closeForm,

    // Delete dialog state
    deleteOpen,
    setDeleteOpen,
    deletingItem,
    setDeletingItem,

    // Delete dialog actions
    openDelete,
    closeDelete,

    // Utility
    closeAll,
  };
}
