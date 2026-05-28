"use client";

import { FormEvent, useMemo, useState } from "react";
import { MenuCategory, MenuItem } from "@/lib/types";

type MenuManagementProps = {
  categories: MenuCategory[];
  items: MenuItem[];
};

type MenuFormState = {
  available: boolean;
  categoryId: string;
  description: string;
  enabled: boolean;
  gstRate: number;
  id?: string;
  image: string;
  isCombo: boolean;
  name: string;
  price: number;
  parcelPrice?: number;
};

type CategoryFormState = {
  id?: string;
  name: string;
  description: string;
};

const emptyItemForm: MenuFormState = {
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  gstRate: 5,
  image: "",
  available: true,
  enabled: true,
  isCombo: false,
  parcelPrice: undefined,
};

const emptyCategoryForm: CategoryFormState = {
  name: "",
  description: "",
};

export function MenuManagement({ categories: initialCategories, items: initialItems }: MenuManagementProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [menuItems, setMenuItems] = useState(initialItems);

  // Modals state
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => Promise<void>) | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

  // Forms state
  const [itemForm, setItemForm] = useState<MenuFormState>({
    ...emptyItemForm,
    categoryId: categories[0]?.id ?? "",
  });
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sortedItems = useMemo(
    () => [...menuItems].sort((a, b) => a.name.localeCompare(b.name)),
    [menuItems],
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  // ---- ITEM ACTIONS ----
  function startEditItem(item: MenuItem) {
    setItemForm({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      gstRate: item.gstRate,
      image: item.image,
      available: item.available,
      enabled: item.enabled,
      isCombo: item.isCombo,
      parcelPrice: item.parcelPrice,
    });
    setMessage("");
    setItemModalOpen(true);
  }

  function startNewItem() {
    setItemForm({
      ...emptyItemForm,
      categoryId: categories[0]?.id ?? "",
    });
    setMessage("");
    setItemModalOpen(true);
  }

  async function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const endpoint = itemForm.id ? `/api/menu-items/${itemForm.id}` : "/api/menu-items";
    const method = itemForm.id ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemForm),
    });

    const payload = (await response.json()) as { error?: string; item?: MenuItem };

    if (!response.ok || !payload.item) {
      setMessage(payload.error ?? "Unable to save menu item.");
      setSaving(false);
      return;
    }

    setMenuItems((current) => {
      const next = current.filter((item) => item.id !== payload.item?.id);
      return [...next, payload.item!];
    });
    
    // Update category item count locally
    if (!itemForm.id) {
      setCategories((current) =>
        current.map((c) =>
          c.id === payload.item?.categoryId ? { ...c, itemCount: c.itemCount + 1 } : c
        )
      );
    } else {
      // Find the old category to adjust counts if category changed
      const oldItem = menuItems.find(i => i.id === itemForm.id);
      if (oldItem && oldItem.categoryId !== payload.item!.categoryId) {
        setCategories((current) =>
          current.map((c) => {
            if (c.id === oldItem.categoryId) return { ...c, itemCount: Math.max(0, c.itemCount - 1) };
            if (c.id === payload.item!.categoryId) return { ...c, itemCount: c.itemCount + 1 };
            return c;
          })
        );
      }
    }

    setItemModalOpen(false);
    setSaving(false);
  }

  async function confirmRemoveItem(id: string) {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;

    setConfirmDialog({
      isOpen: true,
      title: "Delete Menu Item",
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      action: async () => {
        const response = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          alert(payload.error ?? "Unable to delete menu item.");
          return;
        }

        setMenuItems((current) => current.filter((i) => i.id !== id));
        setCategories((current) =>
          current.map((c) =>
            c.id === item.categoryId ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c
          )
        );
      },
    });
  }

  // ---- CATEGORY ACTIONS ----
  function startEditCategory(category: MenuCategory) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description,
    });
    setMessage("");
    setCategoryModalOpen(true);
  }

  function startNewCategory() {
    setCategoryForm(emptyCategoryForm);
    setMessage("");
    setCategoryModalOpen(true);
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const endpoint = categoryForm.id ? `/api/categories/${categoryForm.id}` : "/api/categories";
    const method = categoryForm.id ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });

    const payload = (await response.json()) as { error?: string; category?: MenuCategory };

    if (!response.ok || !payload.category) {
      setMessage(payload.error ?? "Unable to save category.");
      setSaving(false);
      return;
    }

    setCategories((current) => {
      const next = current.filter((c) => c.id !== payload.category?.id);
      return [...next, payload.category!];
    });

    // Also update category names in menu items
    if (categoryForm.id) {
      setMenuItems((current) =>
        current.map((item) =>
          item.categoryId === payload.category!.id
            ? { ...item, categoryName: payload.category!.name }
            : item
        )
      );
    }

    setCategoryModalOpen(false);
    setSaving(false);
  }

  async function confirmRemoveCategory(id: string) {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    setConfirmDialog({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`,
      action: async () => {
        const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          alert(payload.error ?? "Unable to delete category.");
          return;
        }

        setCategories((current) => current.filter((c) => c.id !== id));
      },
    });
  }

  // --- RENDER MODALS ---

  const renderConfirmModal = () => {
    if (!confirmDialog.isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl">
          <h3 className="text-xl font-bold">{confirmDialog.title}</h3>
          <p className="mt-2 text-muted">{confirmDialog.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-xl border border-line px-4 py-2 font-semibold"
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white"
              onClick={async () => {
                if (confirmDialog.action) {
                  await confirmDialog.action();
                }
                setConfirmDialog({ ...confirmDialog, isOpen: false });
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryModal = () => {
    if (!isCategoryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{categoryForm.id ? "Edit Category" : "New Category"}</h3>
            <button onClick={() => setCategoryModalOpen(false)} className="text-muted hover:text-black">&times;</button>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleCategorySubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Category name</span>
              <input
                className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))}
                value={categoryForm.name}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Description</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-line bg-white px-4 py-3"
                onChange={(e) => setCategoryForm((c) => ({ ...c, description: e.target.value }))}
                value={categoryForm.description}
              />
            </label>
            
            {message && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

            <div className="flex gap-3 pt-2">
              <button
                className="w-full rounded-2xl border border-line px-4 py-3 font-semibold"
                type="button"
                onClick={() => setCategoryModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="w-full rounded-2xl bg-[#1c120d] px-4 py-3 font-semibold text-white"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderItemModal = () => {
    if (!isItemModalOpen) return null;
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{itemForm.id ? "Edit Menu Item" : "New Menu Item"}</h3>
            <button onClick={() => setItemModalOpen(false)} className="text-xl font-bold text-muted hover:text-black">&times;</button>
          </div>
          <form className="mt-5 space-y-4" onSubmit={handleItemSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Category</span>
              <select
                className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                onChange={(event) => setItemForm((current) => ({ ...current, categoryId: event.target.value }))}
                value={itemForm.categoryId}
                required
              >
                <option value="" disabled>Select a category</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Item name</span>
              <input
                className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
                value={itemForm.name}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Description</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-line bg-white px-4 py-3"
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, description: event.target.value }))
                }
                value={itemForm.description}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Dine-in Price</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                  min={0}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                  type="number"
                  value={itemForm.price}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Parcel Price</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                  min={0}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      parcelPrice: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                  type="number"
                  placeholder="Same as dine-in"
                  value={itemForm.parcelPrice ?? ""}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">GST %</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                  min={0}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, gstRate: Number(event.target.value) }))
                  }
                  type="number"
                  value={itemForm.gstRate}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Image URL</span>
              <input
                className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                onChange={(event) => setItemForm((current) => ({ ...current, image: event.target.value }))}
                value={itemForm.image}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
                <input
                  checked={itemForm.available}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, available: event.target.checked }))
                  }
                  type="checkbox"
                />
                <span className="text-sm font-medium">Available</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
                <input
                  checked={itemForm.enabled}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, enabled: event.target.checked }))
                  }
                  type="checkbox"
                />
                <span className="text-sm font-medium">Enabled</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
                <input
                  checked={itemForm.isCombo}
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, isCombo: event.target.checked }))
                  }
                  type="checkbox"
                />
                <span className="text-sm font-medium">Combo</span>
              </label>
            </div>

            {message && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                className="w-full rounded-2xl border border-line px-4 py-3 font-semibold"
                type="button"
                onClick={() => setItemModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="w-full rounded-2xl bg-[#1c120d] px-4 py-3 font-semibold text-white"
                disabled={saving}
                type="submit"
              >
                {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="glass-card rounded-[1.5rem] border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Categories</p>
              <h3 className="mt-1 text-xl font-semibold">Manage Categories</h3>
            </div>
            <button
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold"
              onClick={startNewCategory}
              type="button"
            >
              New Category
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {sortedCategories.map((category) => (
              <article key={category.id} className="rounded-xl border border-line bg-white/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{category.name}</p>
                    <p className="mt-1 text-xs text-muted">{category.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="pill pill-neutral">{category.itemCount} items</span>
                    <div className="flex gap-2">
                      <button 
                        className="text-xs font-semibold text-muted hover:text-black"
                        onClick={() => startEditCategory(category)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-xs font-semibold text-red-500 hover:text-red-700"
                        onClick={() => confirmRemoveCategory(category.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-[1.5rem] border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Menu items</p>
              <h3 className="mt-1 text-xl font-semibold">Manage Items</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="pill pill-success text-[10px] px-2 py-0.5">{sortedItems.length} items</span>
              <button
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold"
                onClick={startNewItem}
                type="button"
              >
                New Item
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Price (Dine/Parcel)</th>
                  <th className="px-2 py-2">GST</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-2 py-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{item.description}</p>
                    </td>
                    <td className="px-2 py-3">{item.categoryName ?? "-"}</td>
                    <td className="px-2 py-3 font-semibold">
                      Rs {item.price}
                      {item.parcelPrice ? ` / Rs ${item.parcelPrice}` : ""}
                    </td>
                    <td className="px-2 py-3">{item.gstRate}%</td>
                    <td className="px-2 py-3">
                      <span
                        className={`pill text-[10px] px-2 py-0.5 ${
                          item.available && item.enabled ? "pill-success" : "pill-danger"
                        }`}
                      >
                        {item.available && item.enabled ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-1.5">
                        <button
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold"
                          onClick={() => startEditItem(item)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                          onClick={() => confirmRemoveItem(item.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {renderCategoryModal()}
      {renderItemModal()}
      {renderConfirmModal()}
    </>
  );
}
