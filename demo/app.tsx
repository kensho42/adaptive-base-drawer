import { useEffect, useRef, useState } from 'react';
import {
  AdaptiveDrawer, AdaptiveDrawerTrigger, AdaptiveDrawerContent,
  AdaptiveDrawerClose, AdaptiveDrawerTitle, AdaptiveDrawerDescription,
} from '../src';
import styles from './app.module.css';

const steps = ['A little introduction', 'Make it yours', 'Room for the details'];

function Arrow({ back = false }: { back?: boolean }) {
  return <span aria-hidden="true">{back ? '←' : '→'}</span>;
}

export function App() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [crossFade, setCrossFade] = useState(true);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark') || (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [height, setHeight] = useState(0);
  const [oversize, setOversize] = useState(false);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!open) return;
    let observer: ResizeObserver | null = null;
    const frame = requestAnimationFrame(() => {
      if (!popup.current) return;
      observer = new ResizeObserver(() => setHeight(Math.round(popup.current?.offsetHeight ?? 0)));
      observer.observe(popup.current);
      setHeight(popup.current.offsetHeight);
    });
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [open]);

  function toggleHelp() {
    if (help) { setHelp(false); return; }
    setLoading(true);
    timer.current = setTimeout(() => { setHelp(true); setLoading(false); timer.current = null; }, 650);
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="Adaptive Base Drawer home"><span className={styles.mark} aria-hidden="true">▤</span> adaptive<span className={styles.brandMuted}> / base drawer</span></a>
        <div className={styles.headerActions}>
          <a href="https://github.com/kensho42/adaptive-base-drawer" target="_blank" rel="noreferrer">GitHub <svg aria-hidden="true" width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 12 12 4M4 4h8v8" stroke="currentColor" strokeWidth="1.3" /></svg></a>
          <button className={styles.theme} onClick={() => setDark(!dark)} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? '☀' : '☾'}</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.eyebrow}><span /> BASE UI + MOTION / REACT</div>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>A drawer.<br /><span>Made to move.</span></h1>
            <p>Content changes. Your drawer should follow.<br />Smooth, adaptive height that feels right—<br className={styles.desktopBreak} /> from the first field to the last detail.</p>
            <AdaptiveDrawer open={open} onOpenChange={setOpen}>
              <AdaptiveDrawerTrigger className={styles.primary}>Try the drawer <Arrow /></AdaptiveDrawerTrigger>
              <AdaptiveDrawerContent
                ref={popup} className={styles.drawer} contentKey={step} crossFade={crossFade}
                header={<div className={styles.drawerHeader}><div><AdaptiveDrawerTitle className={styles.drawerTitle}>A drawer that moves with you.</AdaptiveDrawerTitle><AdaptiveDrawerDescription className={styles.drawerDescription}>An adaptive drawer. Take it for a spin.</AdaptiveDrawerDescription></div><AdaptiveDrawerClose aria-label="Close drawer" className={styles.close}>×</AdaptiveDrawerClose></div>}
                footer={<div className={styles.drawerFooter}><div className={styles.progress} aria-label={`Step ${step + 1} of 3`}>{steps.map((label, i) => <button key={label} onClick={() => setStep(i)} aria-label={`Go to step ${i + 1}`} aria-current={step === i ? 'step' : undefined}>{i + 1}</button>)}</div><button className={styles.primary} onClick={() => setStep((step + 1) % 3)}>{step === 2 ? 'Back to the start' : 'Next step'} <Arrow /></button></div>}
              >
                <div className={styles.panel}>
                  <div className={styles.stepLabel}>0{step + 1} / 03 <span>{step === 0 ? 'SMALL' : step === 1 ? 'MEDIUM' : 'LARGE'}</span></div>
                  <h2>{steps[step]}</h2>
                  {step === 0 && <p>Start small. Open a form. Come back. The height follows.</p>}
                  {step === 1 && <><p>A few details to make this space your own.</p><div className={styles.form}><label>Your name<input placeholder="Alex Morgan" autoComplete="name" /></label><label>Email address<input type="email" placeholder="alex@example.com" autoComplete="email" /></label><label>What are you working on?<select defaultValue="design"><option value="design">A design system</option><option>A new product</option><option>Something else entirely</option></select></label></div></>}
                  {step === 2 && <><p>More content, same calm motion. Everything stays reachable, even on a smaller screen.</p><div className={styles.detailCard}><span className={styles.detailIcon} aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 12 12 4M4 4h8v8" stroke="currentColor" strokeWidth="1.3" /></svg></span><div><strong>Built on a solid foundation</strong><p>Base UI handles focus, accessibility, and swipe dismissal. Motion adds the finishing touch.</p></div></div><div className={styles.detailCard}><span className={styles.detailIcon} aria-hidden="true">↕</span><div><strong>Every change is a height change</strong><p>Forms, wrapped text, images, and late responses. ResizeObserver keeps up with it all.</p></div></div><button className={styles.accordion} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>What about the small screens? <span aria-hidden="true">{expanded ? '−' : '+'}</span></button>{expanded && <p className={styles.expansion}>The drawer stops at the viewport limit and scrolls inside. Resize this window: text can wrap freely, and the intrinsic stage is measured again.</p>}<label className={styles.check}><input type="checkbox" checked={oversize} onChange={e => setOversize(e.target.checked)} /> Add extra content to test scrolling</label>{oversize && Array.from({ length: 8 }, (_, i) => <p className={styles.extra} key={i}>Detail {i + 1}. This content deliberately extends beyond the viewport. Scroll to reach every item and the navigation below.</p>)}</>}
                  <button className={styles.helpButton} disabled={loading} onClick={toggleHelp}>{loading ? 'Fetching a little help…' : help ? '− Remove help block' : '+ Load a help block'}<span>IN-PLACE RESIZE</span></button>
                  {help && <div className={styles.help} role="status"><strong>No new key. Still smooth.</strong><p>This block arrived asynchronously. The observer detected its height and the drawer followed.</p></div>}
                </div>
              </AdaptiveDrawerContent>
            </AdaptiveDrawer>
            <div className={styles.heroNote}>Swipe to close. Tab to explore. Resize to test.</div>
          </div>
          <div className={styles.playground}>
            <div className={styles.playgroundTop}><span><span className={styles.statusDot} /> INTERACTIVE PREVIEW</span><span>01—03</span></div>
            <div className={styles.diagram}>
              <div className={styles.heightGuide}><span>HEIGHT</span><i /><span>{open ? `${height}px` : 'ADAPTIVE'}</span></div>
              <div className={styles.miniDrawer}>
                <div className={styles.miniHandle} />
                <div className={styles.miniHeader}><div className={styles.miniIcon}>↕</div><div><strong>One fluid container.</strong><span>As much room as you need.</span></div></div>
                <div className={styles.bars}><i /><i /><i /></div>
                <div className={styles.miniSteps}>{['Small', 'Medium', 'Large'].map((label, i) => <button key={label} onClick={() => { setStep(i); setOpen(true); }}><span className={styles.stepBars}>{Array.from({length:i+1},(_,j)=><i key={j}/>)}</span><strong>{label}</strong><span>0{i + 1} <Arrow /></span></button>)}</div>
                <div className={styles.miniFoot}><span className={styles.statusDot} /><span>Intrinsic size → measured pixels → motion</span></div>
              </div>
            </div>
            <div className={styles.playgroundBottom}><label><input type="checkbox" checked={crossFade} onChange={e => setCrossFade(e.target.checked)} />Cross-fade panels</label><span>{open ? 'LIVE' : 'READY WHEN YOU ARE'} <span className={styles.statusDot} /></span></div>
          </div>
        </section>
        <div className={styles.specs}>
          <div><span>01 / ADAPTIVE</span><h3>Grows. Shrinks. Follows.</h3><p>Real measurements, smooth numeric height.<br />No fixed sizes. No guessing.</p></div>
          <div><span>02 / COORDINATED</span><h3>One transition, two layers.</h3><p>Panels leave layout and linger visually.<br />Height and content move together.</p></div>
          <div><span>03 / CONSIDERATE</span><h3>Motion on your terms.</h3><p>Optional cross-fade. Reduced motion support.<br />Base UI, all the way down.</p></div>
        </div>
      </main>
      <footer className={styles.footer}><span>A small component. A thoughtful detail.</span><span>React · TypeScript · CSS Modules</span></footer>
    </div>
  );
}
