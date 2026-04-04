import React from 'react';

class ErrorBoundary extends React.Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, error: null, errorInfo: null };
 }

 static getDerivedStateFromError(error) {
 return { hasError: true, error };
 }

 componentDidCatch(error, errorInfo) {
 console.error('ErrorBoundary caught:', error, errorInfo);
 this.setState({ errorInfo });
 }

 render() {
 if (this.state.hasError) {
 return (
 <div style={{ padding: 20, color: 'var(--accent)', background: '#111', border: '1px solid #333', borderRadius: 8, margin: 20, fontFamily: "'Space Mono', monospace" }}>
 <h2 style={{ color: 'var(--text-primary)', fontFamily: "'Space Mono', monospace", fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>[ERROR] Application Error</h2>
 {import.meta.env.DEV ? (
 <>
 <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 12 }}>
 {this.state.error?.toString()}
 </pre>
 <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: 'var(--text-disabled)', marginTop: 10 }}>
 {this.state.errorInfo?.componentStack}
 </pre>
 </>
 ) : (
 <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 12 }}>Ha ocurrido un error inesperado. Por favor, recarga la página.</p>
 )}
 <button
 onClick={() => window.location.reload()}
 style={{ marginTop: 16, padding: '12px 24px', background: 'var(--text-primary)', color: '#000', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}
 >
 Reintentar
 </button>
 </div>
 );
 }
 return this.props.children;
 }
}

export default ErrorBoundary;
