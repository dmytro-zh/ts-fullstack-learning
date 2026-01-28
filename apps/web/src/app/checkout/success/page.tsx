export default async function CheckoutSuccessPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 40,
        background: '#f7f7f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 20,
          maxWidth: 720,
          width: '100%',
          border: '1px solid #e5e7eb',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        Payment received. We are confirming your order...
      </div>
    </main>
  );
}
