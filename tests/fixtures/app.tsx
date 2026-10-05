import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdaptiveDrawer, AdaptiveDrawerTrigger, AdaptiveDrawerContent, AdaptiveDrawerTitle, AdaptiveDrawerDescription, AdaptiveDrawerClose } from '../../src';

function Fixture() {
  const [step, setStep] = useState(0);
  const [extra, setExtra] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const query = new URLSearchParams(location.search);
  const mode = query.get('mode');
  return <AdaptiveDrawer snapPoints={mode === 'snap' || snapping ? [.5, 1] : undefined} swipeDirection={mode === 'horizontal' ? 'right' : 'down'}>
    <AdaptiveDrawerTrigger>Open fixture</AdaptiveDrawerTrigger>
    <AdaptiveDrawerContent contentKey={step} crossFade={query.get('fade') !== 'off'} header={<><AdaptiveDrawerTitle style={{ margin: 0 }}>Fixture title</AdaptiveDrawerTitle><AdaptiveDrawerDescription>Fixture description</AdaptiveDrawerDescription></>} footer={<><button onClick={() => setStep((step + 1) % 3)}>Stable next</button><button onClick={() => setExtra(!extra)}>Toggle extra</button><button onClick={() => setSnapping(!snapping)}>Toggle snapping</button><AdaptiveDrawerClose>Close fixture</AdaptiveDrawerClose></>}>
      <div style={{ height: [200.25, 400.5, 550.75][step] + (extra ? 77 : 0), padding: 20, boxSizing: 'border-box' }}>
        <button onClick={() => setStep((step + 1) % 3)}>Panel next</button>
        <p>Panel {step + 1}</p>
      </div>
      {mode === 'nested' && <AdaptiveDrawer><AdaptiveDrawerTrigger>Open nested</AdaptiveDrawerTrigger><AdaptiveDrawerContent contentKey="nested" header={<AdaptiveDrawerTitle>Nested title</AdaptiveDrawerTitle>} footer={<AdaptiveDrawerClose>Close nested</AdaptiveDrawerClose>}><p style={{ padding: 20 }}>Nested content stays under Base UI control.</p></AdaptiveDrawerContent></AdaptiveDrawer>}
    </AdaptiveDrawerContent>
  </AdaptiveDrawer>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
