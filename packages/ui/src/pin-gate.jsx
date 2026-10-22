/* The kid/parent boundary, restyled to §0a: it now wraps the shared PinPad rather
   than drawing its own keypad, so the four pads in the product are one component.

   It is a kid-stopper, not security: the real boundary is row-level security on the
   server (docs/DEPLOYMENT.md). When no PIN has been set yet the pad runs in 'set'
   mode — §0a gives parent setup no step for the grown-ups PIN, and the kid's own
   unlock PIN must not open the grown-up side. */
import { color, font } from './tokens.js';
import { Button, Blob, Kicker } from './primitives.jsx';
import { PinPad } from './pin-pad.jsx';

const pBase = { fontFamily: font.family, boxSizing: 'border-box' };

export function PinGate({ pin, onPass = () => {}, onCancel, blobDir = 'blobs/' }) {
  return <div style={{ ...pBase, background: color.ground, minHeight: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
    <div style={{ textAlign: 'center' }}>
      <Blob name="Access" size={90} dir={blobDir} />
      <Kicker style={{ margin: '10px 0 14px' }}>Grown-ups</Kicker>
      <PinPad mode={pin ? 'enter' : 'set'} expect={pin}
        title="Grown-ups only."
        sub={pin ? 'Type the PIN you set.' : 'Pick a PIN for your side. Not hers.'}
        onDone={(entered) => onPass(entered)} />
      {onCancel && <Button variant="ghost" size="sm" style={{ marginTop: 18 }} onClick={onCancel}>← Back to the kid side</Button>}
    </div>
  </div>;
}
