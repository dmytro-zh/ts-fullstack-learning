import styles from './admin.module.css';

export default function AdminPage() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin overview</h1>
          <p className={styles.subtitle}>Platform health and key metrics.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
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
          Metrics will appear here (MRR, active Pro, orders, revenue).
        </div>
      </div>
    </div>
  );
}
