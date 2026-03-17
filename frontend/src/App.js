// App.js
import { SubmitButton } from './submit';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      <PipelineToolbar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PipelineUI />
      </div>
      <SubmitButton />
    </div>
  );
}

export default App;
