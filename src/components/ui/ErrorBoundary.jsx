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
        <div style={{ padding: 20, color: '#ff453a', background: '#1c1c1e', borderRadius: 12, margin: 20, fontFamily: 'monospace' }}>
          <h2 style={{ color: '#e5e5ea' }}>Error en la aplicación</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#8e8e93', marginTop: 10 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{ marginTop: 10, padding: '8px 16px', background: '#0a84ff', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
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
