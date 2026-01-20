export const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        items: [...state.items, action.payload],
      };
  }
};

export const initialCartState = {
  items: [],
};
