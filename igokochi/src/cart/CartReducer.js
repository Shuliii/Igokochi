export const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const item = action.payload;

      const existing = state.items.find((i) => i.id === item.id);

      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === item.id ? {...i, qty: i.qty + 1} : i,
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, {...item, qty: 1}],
      };
    }
    case "REMOVE_ITEM": {
      const id = action.payload.id;

      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state; // nothing to remove

      // if qty is 1, remove the item completely
      if (existing.qty <= 1) {
        return {
          ...state,
          items: state.items.filter((i) => i.id !== id),
        };
      }

      // otherwise, decrement qty
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === id ? {...i, qty: i.qty - 1} : i,
        ),
      };
    }
    case "CLEAR_CART":
      return {...state, items: []};

    default:
      return state;
  }
};

export const initialCartState = {
  items: [],
};
