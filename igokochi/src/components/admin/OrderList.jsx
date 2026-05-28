import styles from "./OrderList.module.css";
import OrderCard from "./OrderCard";

const OrderSkeleton = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonTopRow}>
      <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`} />
    </div>
    <div className={`${styles.skeletonLine} ${styles.skeletonCustomer}`} />
    <div className={styles.skeletonBox}>
      <div className={`${styles.skeletonLine} ${styles.skeletonItem}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonItem} ${styles.skeletonItemShort}`} />
      <div className={styles.skeletonDivider} />
      <div className={`${styles.skeletonLine} ${styles.skeletonTotal}`} />
    </div>
    <div className={styles.skeletonActions}>
      <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
    </div>
  </div>
);

const OrderList = ({ orders, tab, onSetStatus, loading }) => {
  if (loading) {
    return (
      <section className={styles.list} aria-label="Orders">
        {Array.from({ length: 4 }, (_, i) => <OrderSkeleton key={i} />)}
      </section>
    );
  }

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
