import styles from "./OrderList.module.css";
import OrderCard from "./OrderCard";

const OrderList = ({orders, tab, onSetStatus}) => {
  if (!orders || orders.length === 0) {
    return <div className={styles.empty}>No orders</div>;
  }

  return (
    <section className={styles.list} aria-label="Orders">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          tab={tab}
          onSetStatus={onSetStatus}
        />
      ))}
    </section>
  );
};

export default OrderList;
