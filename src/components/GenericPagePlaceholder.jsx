import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function GenericPage({ title, desc }) {
  return (
    <>
      <Header />
      <main className="container" style={{ padding: 'var(--spacing-6) var(--spacing-2)', minHeight: '60vh' }}>
        <h1>{title}</h1>
        <p className="text-secondary">{desc}</p>
        <div style={{ marginTop: 'var(--spacing-4)' }}>
          <p>Page content placeholder...</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
