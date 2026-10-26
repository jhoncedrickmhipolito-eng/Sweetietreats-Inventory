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

/* ---------------- Finance ---------------- */

export async function addFinanceEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const income = parseMoney(formData.get("income"));
  const capital = parseMoney(formData.get("capital"));

  if (income === null || income <= 0) return fail("Income must be a positive amount.");
  if (capital === null || capital < 0) return fail("Capital must be zero or a positive amount.");
  if (capital > income) return fail("Capital cannot be greater than income.");

  const profit = income - capital;

  await prisma.financeEntry.create({ data: { income, capital, profit } });
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

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (income === null || income <= 0) return fail("Income must be a positive amount.");
  if (capital === null || capital < 0) return fail("Capital must be zero or a positive amount.");
  if (capital > income) return fail("Capital cannot be greater than income.");

  const existing = await prisma.financeEntry.findUnique({ where: { id } });
  if (!existing) return fail("Entry no longer exists.");

  const profit = income - capital;
  await prisma.financeEntry.update({
    where: { id },
    data: { income, capital, profit },
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

/* ---------------- Ingredients ---------------- */

export async function addIngredientUse(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const productId = Number(formData.get("productId"));
  const quantity = parseMoney(formData.get("quantity"));

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
      data: { productId, productName: product.name, quantity, unitPrice, cost },
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

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid entry.");
  if (quantity === null || !Number.isInteger(quantity) || quantity <= 0)
    return fail("Quantity used must be a whole number of 1 or more.");
  if (unitPrice === null || unitPrice < 0)
    return fail("Unit price must be zero or a positive amount.");

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
      data: { quantity, unitPrice, cost },
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

  if (amount === null || amount <= 0) return fail("Amount must be a positive amount.");
  if (!description) return fail("Description is required.");

  await prisma.expense.create({ data: { amount, description } });
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

  if (!Number.isInteger(id) || id <= 0) return fail("Invalid expense.");
  if (amount === null || amount <= 0) return fail("Amount must be a positive amount.");
  if (!description) return fail("Description is required.");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return fail("Expense no longer exists.");

  await prisma.expense.update({ where: { id }, data: { amount, description } });
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
