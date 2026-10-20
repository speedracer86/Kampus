/* Non-component helpers shared across the library.
   NOTE the .jsx extension: it carries no JSX, but vite.config.js only injects
   React into .jsx files, and useWidth below needs React in scope. A .js file
   here compiles clean and then throws "React is not defined" at runtime.
   They live outside the component modules on purpose: React Fast Refresh only
   works on modules whose exports are all components, so a stray function
   exported beside them costs the whole dev loop a full page reload. */

/** Width of a ref'd element, for container-driven responsive layout. */
export function useWidth(ref) {
  const [w, setW] = React.useState(1060);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].borderBoxSize?.[0]?.inlineSize ?? es[0].target.getBoundingClientRect().width));
    ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  return w;
}

/** Read text aloud (browser SpeechSynthesis). Silent where unsupported. */
export function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/−/g, ' negative '));
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => /Natural/.test(v.name)) || vs.find(v => /Google US/.test(v.name)) || vs.find(v => /Samantha/.test(v.name)) || null;
    u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { /* no speech support */ }
}
