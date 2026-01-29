import styles from '../admin.module.css';

export default function AdminStoresPage() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Stores</h1>
          <p className={styles.subtitle}>Monitor store health and revenue.</p>
        </div>
      </div>

      <div
        style={{
          borderRadius: 14,
          border: '1px dashed rgba(148,163,184,0.4)',
          padding: 16,
          fontSize: 13,
          color: '#64748b',
          background: '#f9fafb',
        }}
      >
        Stores table will be implemented here.
      </div>
    </div>
  );
}
