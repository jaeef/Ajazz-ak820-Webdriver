import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './styles.css'

// Last line of defence: a render error shows a way out instead of a blank page.
// Clearing saved data recovers from a corrupt localStorage entry.
class CrashScreen extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { console.error(error) }
  render() {
    if (!this.state.error) return this.props.children
    const reset = () => { try { localStorage.clear() } catch { /* blocked */ } location.reload() }
    return (
      <main className="crash" role="alert">
        <h1>Something went wrong</h1>
        <p>The page hit an error it couldn’t recover from. Your keyboard keeps its current settings.</p>
        <div className="crash__actions">
          <button className="btn btn--primary" onClick={() => location.reload()}>Reload</button>
          <button className="btn btn--outline" onClick={reset}>Clear saved data and reload</button>
        </div>
        <details><summary>Details</summary><pre>{this.state.error.message}</pre></details>
      </main>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CrashScreen>
      <App />
    </CrashScreen>
    {/* Anonymous visit counts on Vercel only (no cookies); does nothing on localhost. */}
    <Analytics />
  </StrictMode>,
)
