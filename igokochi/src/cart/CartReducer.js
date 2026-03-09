const normalizeText = (value) => (value || "").trim();

const buildCartKey = (item) => {
  const optionsKey = (item.selectedOptions || [])
    .map((opt) => `${opt.modifierId}:${opt.optionId}`)
    .sort()
    .join("|");

  const notesKey = normalizeText(item.notes);

  return `${item.id}__${optionsKey}__${notesKey}`;
};

export const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const item = action.payload;
      const cartKey = item.cartKey || buildCartKey(item);

      const existing = state.items.find((i) => i.cartKey === cartKey);

      if (existing) {
        const qtyToAdd = item.qty ?? 1;

        return {
          ...state,
          items: state.items.map((i) =>
            i.cartKey === cartKey ? { ...i, qty: i.qty + qtyToAdd } : i,
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            ...item,
            cartKey,
            qty: item.qty ?? 1,
            notes: normalizeText(item.notes),
            selectedOptions: item.selectedOptions || [],
          },
        ],
      };
    }

    case "REMOVE_ITEM": {
      const cartKey = action.payload.cartKey;

      const existing = state.items.find((i) => i.cartKey === cartKey);
      if (!existing) return state;

      if (existing.qty <= 1) {
        return {
          ...state,
          items: state.items.filter((i) => i.cartKey !== cartKey),
        };
      }

      return {
        ...state,
        items: state.items.map((i) =>
          i.cartKey === cartKey ? { ...i, qty: i.qty - 1 } : i,
        ),
      };
    }

    // case "DELETE_ITEM": {
    //   const cartKey = action.payload.cartKey;

    //   return {
    //     ...state,
    //     items: state.items.filter((i) => i.cartKey !== cartKey),
    //   };
    // }

    case "CLEAR_CART":
      return { ...state, items: [] };

    default:
      return state;
  }
};

export const initialCartState = {
  items: [],
};

export { buildCartKey };
