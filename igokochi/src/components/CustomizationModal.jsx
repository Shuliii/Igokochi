import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCart } from "../cart/CartContext";
import styles from "./CustomizationModal.module.css";

const CustomizationModal = ({ item, isOpen, onClose }) => {
  const { dispatch } = useCart();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!item) return;

    const initialSelections = {};

    for (const modifier of item.modifiers || []) {
      if (modifier.type === "single" && modifier.options?.length) {
        const defaultOption =
          modifier.options.find((option) => option.default) ||
          modifier.options[0];

        initialSelections[modifier.id] = defaultOption.id;
      }
    }

    setSelectedOptions(initialSelections);
    setQty(1);
    setNotes("");
  }, [item]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;

    let total = item.price;

    for (const modifier of item.modifiers || []) {
      const selectedOptionId = selectedOptions[modifier.id];
      const selectedOption = modifier.options?.find(
        (option) => option.id === selectedOptionId,
      );

      if (selectedOption) {
        total += selectedOption.priceDelta || 0;
      }
    }

    return total;
  }, [item, selectedOptions]);

  const totalPrice = unitPrice * qty;

  const handleOptionChange = (modifierId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [modifierId]: optionId,
    }));
  };

  const handleAddToCart = () => {
    if (!item) return;

    const resolvedOptions = (item.modifiers || []).map((modifier) => {
      const selectedOptionId = selectedOptions[modifier.id];
      const selectedOption = modifier.options?.find(
        (option) => option.id === selectedOptionId,
      );

      return {
        modifierId: modifier.id,
        modifierName: modifier.name,
        optionId: selectedOption?.id,
        optionName: selectedOption?.name,
        priceDelta: selectedOption?.priceDelta || 0,
      };
    });

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: item.id,
        name: item.name,
        image: item.image,
        price: unitPrice,
        qty,
        notes: notes.trim(),
        selectedOptions: resolvedOptions,
      },
    });

    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.content}>
          <div className={styles.handle} />

          <div className={styles.header}>
            <div className={styles.headerMain}>
              {item?.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className={styles.thumb}
                />
              )}

              <div className={styles.headerText}>
                <Dialog.Title className={styles.title}>
                  {item?.name}
                </Dialog.Title>
                <Dialog.Description className={styles.description}>
                  {item?.description}
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className={styles.body}>
            {(item?.modifiers || []).map((modifier) => (
              <section key={modifier.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>{modifier.name}</h3>
                  {modifier.required && (
                    <span className={styles.required}>Required</span>
                  )}
                </div>

                <div className={styles.options}>
                  {(modifier.options || []).map((option) => {
                    const checked = selectedOptions[modifier.id] === option.id;

                    return (
                      <label
                        key={option.id}
                        className={`${styles.optionCard} ${
                          checked ? styles.optionCardSelected : ""
                        }`}
                      >
                        <div className={styles.optionLeft}>
                          <input
                            type="radio"
                            name={modifier.id}
                            value={option.id}
                            checked={checked}
                            onChange={() =>
                              handleOptionChange(modifier.id, option.id)
                            }
                            className={styles.radio}
                          />
                          <span className={styles.optionName}>
                            {option.name}
                          </span>
                        </div>

                        {option.priceDelta > 0 && (
                          <span className={styles.optionPrice}>
                            +${option.priceDelta.toFixed(2)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <textarea
                className={styles.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Less ice, no sugar, etc."
                rows={3}
              />
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Quantity</h3>

              <div className={styles.qtyRow}>
                <button
                  type="button"
                  className={styles.qtyButton}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span className={styles.qtyValue}>{qty}</span>

                <button
                  type="button"
                  className={styles.qtyButton}
                  onClick={() => setQty((prev) => prev + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </section>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.addToCartButton}
              onClick={handleAddToCart}
            >
              Add to cart · ${totalPrice.toFixed(2)}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CustomizationModal;
