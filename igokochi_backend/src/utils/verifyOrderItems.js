import { db } from "../db.js";

export class OrderValidationError extends Error {
  constructor(message, itemId) {
    super(message);
    this.itemId = itemId;
  }
}

export async function verifyOrderItems(items, {skipAvailabilityCheck = false} = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderValidationError("Cart is empty");
  }

  const itemIds = [...new Set(items.map((i) => i.id))];
  const [menuRows] = await db.query(
    `SELECT * FROM menu_items_table WHERE id IN (?)`,
    [itemIds],
  );

  const menuById = new Map(
    menuRows.map((row) => [
      row.id,
      {
        ...row,
        available: Boolean(row.available),
        modifiers:
          typeof row.modifiers === "string"
            ? JSON.parse(row.modifiers)
            : row.modifiers,
      },
    ]),
  );

  let verifiedTotal = 0;
  const verifiedItems = [];

  for (const line of items) {
    const menuItem = menuById.get(line.id);

    if (!menuItem) {
      throw new OrderValidationError(`Item not found: ${line.name || line.id}`, line.id);
    }
    if (!skipAvailabilityCheck && !menuItem.available) {
      throw new OrderValidationError(`${menuItem.name} is no longer available`, menuItem.id);
    }

    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new OrderValidationError(`Invalid quantity for ${menuItem.name}`, menuItem.id);
    }

    let unitPrice = Number(menuItem.price);
    const verifiedOptions = [];

    for (const opt of line.selectedOptions || []) {
      const modifier = (menuItem.modifiers || []).find((m) => m.id === opt.modifierId);
      const option = modifier?.options?.find((o) => o.id === opt.optionId);

      if (!modifier || !option) {
        throw new OrderValidationError(`Invalid option selected for ${menuItem.name}`, menuItem.id);
      }

      unitPrice += Number(option.priceDelta) || 0;
      verifiedOptions.push({
        modifierId: modifier.id,
        modifierName: modifier.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: Number(option.priceDelta) || 0,
      });
    }

    verifiedTotal += unitPrice * qty;
    verifiedItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: unitPrice,
      qty,
      category: menuItem.category,
      notes: typeof line.notes === "string" ? line.notes.trim() : "",
      selectedOptions: verifiedOptions,
      cartKey: line.cartKey,
    });
  }

  return { verifiedItems, verifiedTotal: Number(verifiedTotal.toFixed(2)) };
}
