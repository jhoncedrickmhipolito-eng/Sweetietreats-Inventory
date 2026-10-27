"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ADMIN_CODE, checkPassword, setPassword } from "@/lib/auth";

export type ActionResult = { ok: boolean; message: string };

function fail(message: string): ActionResult {
  return { ok: false, message };
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseMoney(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

// Parse an HTML datetime-local value ("YYYY-MM-DDTHH:mm") in local time.
// Empty/invalid → null (caller falls back to now).
function parseDateTimeLocal(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ---------------- Finance ---------------- */

export async function addFinanceEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const income = parseMoney(formData.get("income"));
  const capital = parseMoney(formData.get("capital"));
  const occurredAt = parseDateTimeLocal(formData.get("occurredAt")) ?? new Date();

  if (income === null || income <= 0) return fail("Income must be a positive amount.");
  if (capital === null || capital < 0) return fail("Capital must be zero or a positive amount.");
  if (capital > income) return fail("Capital cannot be greater than income.");

  const profit = income - capital;

  await prisma.financeEntry.create({ data: { income, capital, profit, occurredAt } });
  revalidatePath("/finance");
  return { ok: true, message: `Recorded: capital ${capital.toFixed(2)}, profit ${profit.toFixed(2)}.` };
}

export async function updateFinanceEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const income = parseMoney(formData.get("income"));
  const capital = parseMoney(formData.get("capital"));
  const occurredAt = parseDateTimeLocal(formData.get("occurredAt"));

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (income === null || income <= 0) return fail("Income must be a positive amount.");
  if (capital === null || capital < 0) return fail("Capital must be zero or a positive amount.");
  if (capital > income) return fail("Capital cannot be greater than income.");
  if (formData.get("occurredAt") && occurredAt === null)
    return fail("Enter a valid date and time.");

  const existing = await prisma.financeEntry.findUnique({ where: { id } });
  if (!existing) return fail("Entry no longer exists.");

  const profit = income - capital;
  await prisma.financeEntry.update({
    where: { id },
    data: { income, capital, profit, ...(occurredAt ? { occurredAt } : {}) },
  });
  revalidatePath("/finance");
  redirect("/finance");
}

export async function deleteFinanceEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const password = getString(formData, "password");

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (!password) return fail("Enter your password to delete this entry.");

  const allowed = await checkPassword(password);
  if (!allowed) return fail("Incorrect password. Entry was not deleted.");

  const existing = await prisma.financeEntry.findUnique({ where: { id } });
  if (!existing) return fail("Entry no longer exists.");

  await prisma.financeEntry.delete({ where: { id } });
  revalidatePath("/finance");
  return { ok: true, message: "Entry deleted." };
}

/* ---------------- Stock ---------------- */

export async function addProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = getString(formData, "name").trim();
  const price = parseMoney(formData.get("price"));
  const quantity = parseMoney(formData.get("quantity"));

  if (!name) return fail("Product name is required.");
  if (price === null || price < 0) return fail("Price must be zero or a positive amount.");
  if (quantity === null || !Number.isInteger(quantity) || quantity < 0)
    return fail("Quantity must be a whole number of 0 or more.");

  const dup = await prisma.product.findUnique({ where: { name } });
  if (dup) return fail(`"${name}" already exists in stock.`);

  await prisma.product.create({ data: { name, price, quantity } });
  revalidatePath("/stock");
  return { ok: true, message: `Added ${quantity} x ${name} to stock.` };
}

export async function updateProductStock(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const quantity = parseMoney(formData.get("quantity"));

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid product.");
  if (quantity === null || !Number.isInteger(quantity) || quantity < 0)
    return fail("Quantity must be a whole number of 0 or more.");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return fail("Product not found.");

  await prisma.product.update({ where: { id }, data: { quantity } });
  revalidatePath("/stock");
  return { ok: true, message: `${product.name} stock set to ${quantity}.` };
}

export async function updateProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const name = getString(formData, "name").trim();
  const price = parseMoney(formData.get("price"));
  const quantity = parseMoney(formData.get("quantity"));

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid product.");
  if (!name) return fail("Product name is required.");
  if (price === null || price < 0) return fail("Price must be zero or a positive amount.");
  if (quantity === null || !Number.isInteger(quantity) || quantity < 0)
    return fail("Quantity must be a whole number of 0 or more.");

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return fail("Product not found.");

  const dup = await prisma.product.findFirst({ where: { name, NOT: { id } } });
  if (dup) return fail(`"${name}" already exists in stock.`);

  await prisma.product.update({ where: { id }, data: { name, price, quantity } });
  revalidatePath("/stock");
  revalidatePath("/ingredients");
  redirect("/stock");
}

/* ---------------- Ingredients ---------------- */

export async function addIngredientUse(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = Number(formData.get("productId"));
  const quantity = parseMoney(formData.get("quantity"));
  const usedAt = parseDateTimeLocal(formData.get("usedAt")) ?? new Date();

  if (!Number.isInteger(productId) || productId <= 0) return fail("Choose a product.");
  if (quantity === null || !Number.isInteger(quantity) || quantity <= 0)
    return fail("Quantity used must be a whole number of 1 or more.");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return fail("Product not found in stock.");
  if (product.quantity < quantity)
    return fail(`Not enough stock: only ${product.quantity} x ${product.name} available.`);

  const unitPrice = product.price;
  const cost = unitPrice * quantity;

  // Atomic: decrement stock and record the usage together.
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.ingredientUse.create({
      data: { productId, productName: product.name, quantity, unitPrice, cost, usedAt },
    }),
  ]);

  revalidatePath("/ingredients");
  revalidatePath("/stock");
  return {
    ok: true,
    message: `Used ${quantity} x ${product.name}. Stock is now ${product.quantity - quantity}. Cost: ${cost.toFixed(2)}.`,
  };
}

export async function updateIngredientUse(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const quantity = parseMoney(formData.get("quantity"));
  const unitPrice = parseMoney(formData.get("unitPrice"));
  const usedAt = parseDateTimeLocal(formData.get("usedAt"));

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (quantity === null || !Number.isInteger(quantity) || quantity <= 0)
    return fail("Quantity used must be a whole number of 1 or more.");
  if (unitPrice === null || unitPrice < 0)
    return fail("Unit price must be zero or a positive amount.");
  if (formData.get("usedAt") && usedAt === null)
    return fail("Enter a valid date and time.");

  const use = await prisma.ingredientUse.findUnique({ where: { id } });
  if (!use) return fail("Record no longer exists.");

  const delta = quantity - use.quantity;
  const cost = unitPrice * quantity;

  if (use.productId !== null && delta > 0) {
    // Increasing the quantity needs that many more items in stock.
    const product = await prisma.product.findUnique({
      where: { id: use.productId },
    });
    if (product && product.quantity < delta)
      return fail(
        `Not enough stock to increase usage: only ${product.quantity} x ${product.name} available.`,
      );
  }

  await prisma.$transaction([
    prisma.ingredientUse.update({
      where: { id },
      data: { quantity, unitPrice, cost, ...(usedAt ? { usedAt } : {}) },
    }),
    ...(use.productId !== null && delta !== 0
      ? [
          prisma.product.update({
            where: { id: use.productId },
            data: { quantity: { decrement: delta } },
          }),
        ]
      : []),
  ]);

  revalidatePath("/ingredients");
  revalidatePath("/stock");
  return {
    ok: true,
    message:
      use.productId !== null
        ? `Usage updated: ${quantity} x ${use.productName}. Cost: ${cost.toFixed(2)}. Stock adjusted.`
        : `Usage updated: ${quantity} x ${use.productName}. Cost: ${cost.toFixed(2)}.`,
  };
}

export async function deleteIngredientUse(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const password = getString(formData, "password");

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (!password) return fail("Enter your password to delete this usage record.");

  const allowed = await checkPassword(password);
  if (!allowed) return fail("Incorrect password. Record was not deleted.");

  const use = await prisma.ingredientUse.findUnique({ where: { id } });
  if (!use) return fail("Record no longer exists.");

  // Return the ingredients to stock (if the product still exists) and remove the record.
  await prisma.$transaction([
    ...(use.productId !== null
      ? [
          prisma.product.update({
            where: { id: use.productId },
            data: { quantity: { increment: use.quantity } },
          }),
        ]
      : []),
    prisma.ingredientUse.delete({ where: { id } }),
  ]);

  revalidatePath("/ingredients");
  revalidatePath("/stock");
  return {
    ok: true,
    message:
      use.productId !== null
        ? "Usage record deleted and stock restored."
        : "Usage record deleted (the product no longer exists, so stock was not restored).",
  };
}

export async function deleteProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("Invalid product.");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return fail("Product not found (it may already be deleted).");

  // Deleting the product sets IngredientUse.productId to NULL (history keeps
  // the productName snapshot, so past entries remain readable).
  await prisma.product.delete({ where: { id } });
  revalidatePath("/stock");
  return { ok: true, message: `${product.name} deleted from stock. Ingredient history kept.` };
}

/* ---------------- Expenses ---------------- */

export async function addExpense(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const amount = parseMoney(formData.get("amount"));
  const description = getString(formData, "description").trim();
  const occurredAt = parseDateTimeLocal(formData.get("occurredAt")) ?? new Date();

  if (amount === null || amount <= 0) return fail("Amount must be a positive amount.");
  if (!description) return fail("Description is required.");

  await prisma.expense.create({ data: { amount, description, occurredAt } });
  revalidatePath("/expenses");
  return { ok: true, message: `Expense recorded: ${amount.toFixed(2)} for ${description}.` };
}

export async function deleteExpense(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const password = getString(formData, "password");

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (!password) return fail("Enter your password to delete this expense.");

  const allowed = await checkPassword(password);
  if (!allowed) return fail("Incorrect password. Expense was not deleted.");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return fail("Expense no longer exists.");

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  return { ok: true, message: "Expense deleted." };
}

export async function updateExpense(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = Number(formData.get("id"));
  const amount = parseMoney(formData.get("amount"));
  const description = getString(formData, "description").trim();
  const occurredAt = parseDateTimeLocal(formData.get("occurredAt"));

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid expense.");
  if (amount === null || amount <= 0) return fail("Amount must be a positive amount.");
  if (!description) return fail("Description is required.");
  if (formData.get("occurredAt") && occurredAt === null)
    return fail("Enter a valid date and time.");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return fail("Expense no longer exists.");

  await prisma.expense.update({
    where: { id },
    data: { amount, description, ...(occurredAt ? { occurredAt } : {}) },
  });
  revalidatePath("/expenses");
  redirect("/expenses");
}

/* ---------------- Security ---------------- */

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const code = getString(formData, "code").trim();
  const newPassword = getString(formData, "newPassword");
  const confirm = getString(formData, "confirm");

  if (code !== ADMIN_CODE) return fail("Wrong code. Password not changed.");
  if (newPassword.length < 4) return fail("New password must be at least 4 characters.");
  if (newPassword !== confirm) return fail("New password and confirmation do not match.");

  await setPassword(newPassword);
  return { ok: true, message: "Password changed successfully." };
}

/* ---------------- Backup restore ---------------- */

type BackupProduct = { id: number; name: string; price: number; quantity: number };
type BackupFinance = { id: number; income: number; capital: number; occurredAt: Date };
type BackupExpense = { id: number; amount: number; description: string; occurredAt: Date };
type BackupUse = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  cost: number;
  usedAt: Date;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asId(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null;
}
function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function asText(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
function asDate(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function asArray(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null;
}

function uniqueIds(items: { id: number }[]): boolean {
  return new Set(items.map((i) => i.id)).size === items.length;
}

/**
 * Validates a downloaded backup and replaces all current data with it.
 * Password required; everything happens in one transaction, so a bad file
 * leaves the existing data untouched.
 */
export async function restoreBackup(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = getString(formData, "password");
  if (!password) return fail("Enter your password to restore a backup.");
  const allowed = await checkPassword(password);
  if (!allowed) return fail("Incorrect password. Nothing was restored.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return fail("Choose a backup file (.json) to restore.");
  if (file.size > 5_000_000) return fail("That backup file is too large (over 5 MB).");

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return fail("That file is not a valid backup (it is not JSON).");
  }
  if (!isRecord(parsed)) return fail("That file is not a valid backup (unexpected shape).");

  const rawProducts = asArray(parsed.products);
  const rawFinance = asArray(parsed.financeEntries);
  const rawExpenses = asArray(parsed.expenses);
  const rawUses = asArray(parsed.ingredientUses);
  if (!rawProducts || !rawFinance || !rawExpenses || !rawUses)
    return fail("That backup file is missing required sections.");

  const products: BackupProduct[] = [];
  for (const r of rawProducts) {
    if (!isRecord(r)) return fail("Backup product entry is malformed.");
    const id = asId(r.id);
    const name = asText(r.name);
    const price = asNumber(r.price);
    const quantity = asNumber(r.quantity);
    if (id === null || name === null || price === null || price < 0)
      return fail("Backup contains an invalid product (id/name/price).");
    if (quantity === null || !Number.isInteger(quantity) || quantity < 0)
      return fail("Backup contains an invalid product quantity.");
    products.push({ id, name, price, quantity });
  }
  if (products.length > 0 && !uniqueIds(products))
    return fail("Backup contains duplicate product ids.");
  if (new Set(products.map((p) => p.name)).size !== products.length)
    return fail("Backup contains duplicate product names.");

  const financeEntries: BackupFinance[] = [];
  for (const r of rawFinance) {
    if (!isRecord(r)) return fail("Backup money entry is malformed.");
    const id = asId(r.id);
    const income = asNumber(r.income);
    const capital = asNumber(r.capital);
    const occurredAt = asDate(r.occurredAt);
    if (
      id === null ||
      income === null ||
      income <= 0 ||
      capital === null ||
      capital < 0 ||
      capital > income ||
      occurredAt === null
    )
      return fail("Backup contains an invalid money entry.");
    financeEntries.push({ id, income, capital, occurredAt });
  }
  if (financeEntries.length > 0 && !uniqueIds(financeEntries))
    return fail("Backup contains duplicate money entry ids.");

  const expenses: BackupExpense[] = [];
  for (const r of rawExpenses) {
    if (!isRecord(r)) return fail("Backup expense is malformed.");
    const id = asId(r.id);
    const amount = asNumber(r.amount);
    const description = asText(r.description);
    const occurredAt = asDate(r.occurredAt);
    if (id === null || amount === null || amount <= 0 || description === null || occurredAt === null)
      return fail("Backup contains an invalid expense.");
    expenses.push({ id, amount, description, occurredAt });
  }
  if (expenses.length > 0 && !uniqueIds(expenses))
    return fail("Backup contains duplicate expense ids.");

  const productIds = new Set(products.map((p) => p.id));
  const ingredientUses: BackupUse[] = [];
  for (const r of rawUses) {
    if (!isRecord(r)) return fail("Backup ingredient entry is malformed.");
    const id = asId(r.id);
    const productName = asText(r.productName);
    const quantity = asNumber(r.quantity);
    const unitPrice = asNumber(r.unitPrice);
    const cost = asNumber(r.cost);
    const usedAt = asDate(r.usedAt);
    const rawProductId = r.productId;
    const productId = rawProductId === null ? null : asId(rawProductId);
    if (
      id === null ||
      productName === null ||
      quantity === null ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      unitPrice === null ||
      unitPrice < 0 ||
      cost === null ||
      cost < 0 ||
      usedAt === null
    )
      return fail("Backup contains an invalid ingredient record.");
    if (rawProductId !== null && productId === null)
      return fail("Backup contains an invalid product reference.");
    if (productId !== null && !productIds.has(productId))
      return fail("Backup ingredient record points to a product that is not in the backup.");
    ingredientUses.push({ id, productId, productName, quantity, unitPrice, cost, usedAt });
  }
  if (ingredientUses.length > 0 && !uniqueIds(ingredientUses))
    return fail("Backup contains duplicate ingredient ids.");

  // One transaction: either the whole restore happens, or nothing changes.
  await prisma.$transaction([
    prisma.ingredientUse.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.financeEntry.deleteMany(),
    prisma.product.deleteMany(),
    prisma.product.createMany({
      data: products.map((p) => ({ ...p, createdAt: new Date() })),
    }),
    prisma.financeEntry.createMany({
      data: financeEntries.map((e) => ({
        ...e,
        profit: e.income - e.capital,
        createdAt: new Date(),
      })),
    }),
    prisma.expense.createMany({
      data: expenses.map((e) => ({ ...e, createdAt: new Date() })),
    }),
    prisma.ingredientUse.createMany({
      data: ingredientUses.map((u) => ({ ...u, createdAt: new Date() })),
    }),
  ]);

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Restored ${products.length} products, ${financeEntries.length} money entries, ${expenses.length} expenses, and ${ingredientUses.length} ingredient records.`,
  };
}
