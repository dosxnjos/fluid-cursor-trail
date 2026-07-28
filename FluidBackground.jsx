'use client';

// Fundo de fluido WebGL estilo torii.studio.
// Baseado em webgl-fluid-enhanced (npm) -> fork em classe do WebGL-Fluid-Simulation
// de Pavel Dobryakov (MIT), por Michael Brusegard, com start()/stop() reais.
//
// Instalação:   npm i webgl-fluid-enhanced
//
// Uso (Next.js App Router): coloque <FluidBackground /> no app/layout.js, NÃO numa página.
// Por quê: o layout persiste entre navegações, então o componente NÃO remonta a cada rota
// -> evita de vez o vazamento de contexto WebGL ("Too many active WebGL contexts").
//
//   // app/layout.js
//   import FluidBackground from '@/components/FluidBackground';
//   export default function RootLayout({ children }) {
//     return (
//       <html lang="pt-br">
//         <body>
//           <FluidBackground />
//           {children}
//         </body>
//       </html>
//     );
//   }

import { useEffect, useRef } from 'react';

// ---- Config tunada pra ficar parecida com o torii (sutil, escuro, rosa/magenta) ----
// Nomes camelCase (API do fork) — comentários marcam o que difere do default dele.
const FLUID_CONFIG = {
  transparent: true,                // canvas transparente -> compõe sobre o fundo escuro do site
  backgroundColor: '#06040a',       // só usado se transparent for false

  shading: true,                    // (default) iluminação volumétrica — confirmado ligado no torii
  bloom: true,                      // (default) brilho
  bloomIntensity: 0.4,              // de 0.8 -> mais sutil
  bloomThreshold: 0.7,              // de 0.6 -> só os núcleos mais brilhantes brilham
  sunrays: false,                   // god-rays off -> rastro mais limpo

  densityDissipation: 3.5,          // de 1 -> tinta some rápido (rastro curto)
  velocityDissipation: 0.5,         // de 0.2 -> movimento assenta rápido, rastro "cola" no cursor
  curl: 8,                          // de 30 -> bem menos redemoinho

  splatRadius: 0.18,                // de 0.25 -> rastro mais fino
  splatForce: 4500,                 // de 6000 -> injeção mais calma

  colorful: false,                  // desliga o ciclo automático de cores...
  colorPalette: ['#E61A80'],        // ...e fixa rosa/magenta (mesmo tom de r:.9,g:.1,b:.5 do fork antigo)

  simResolution: 96,                // de 128 -> grid de velocidade mais barato
  dyeResolution: 512,               // de 1024 -> metade do custo de GPU

  hover: true,                      // (default) rastro segue o cursor ao mover
};

const IDLE_MS = 3000; // pausa a simulação após 3s sem movimento do ponteiro (custo de GPU/bateria em rAF contínuo)

// ⚠️ webgl-fluid-enhanced espera um CONTÊINER (div), não um <canvas> — ele cria e
// gerencia o próprio <canvas> interno (100%x100%) e SOBRESCREVE o atributo `style` do
// elemento que recebe (seta `position: relative; display: flex`), o que tiraria o
// contêiner do fixed e empurraria o conteúdo da página pra baixo dele. Como React
// reaplica o style inline só em re-render (e a lib mutila o DOM depois, fora do ciclo
// do React), a saída é uma classe com `!important` — só ela vence o inline style que a
// lib escreve por fora do React.
const FLUID_BG_CSS = `
.fluid-bg-container {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw;
  height: 100vh;
  z-index: 0;             /* atrás do conteúdo (que deve ter zIndex maior) */
  touch-action: none;     /* rastro no mobile sem rolar/zoom */
  pointer-events: none;   /* o canvas interno não precisa receber cliques */
}
.fluid-bg-container canvas { width: 100% !important; height: 100% !important; display: block !important; }
`;

export default function FluidBackground({ config = FLUID_CONFIG, style }) {
  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const instanceRef = useRef(/** @type {any} */ (null));

  useEffect(() => {
    const wrap = containerRef.current;
    if (!wrap) return;

    // Acessibilidade: quem pede menos movimento não recebe a simulação.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Flag pra abortar se o componente desmontar ANTES do import dinâmico resolver
    // (e pra sobreviver ao double-mount do React Strict Mode em dev).
    let cancelled = false;
    let idleTimer = null;
    let paused = false;
    let canvasInterno = null;

    function armarIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        instanceRef.current?.stop();
        paused = true;
      }, IDLE_MS);
    }
    // O fork escuta `mousemove` no CANVAS INTERNO que ele mesmo cria dentro do
    // contêiner — e esse canvas tem pointer-events:none (pra deixar cliques
    // atravessarem até o conteúdo). Por isso o window escuta o ponteiro de verdade e
    // repassa um mousemove sintético pro canvas interno (mesmo padrão do
    // index.html/testbed deste repo).
    function onPointerMove(e) {
      canvasInterno?.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, bubbles: true }));
      if (paused && instanceRef.current) {
        instanceRef.current.start();
        paused = false;
      }
      armarIdle();
    }

    // Import dinâmico DENTRO do effect: o pacote toca window/navigator no load,
    // então nunca pode rodar no servidor (SSR). useEffect nunca roda no server.
    import('webgl-fluid-enhanced').then(({ default: WebGLFluidEnhanced }) => {
      if (cancelled || !containerRef.current) return;
      const sim = new WebGLFluidEnhanced(containerRef.current);
      sim.setConfig(config);
      sim.start();
      instanceRef.current = sim;
      canvasInterno = containerRef.current.querySelector('canvas');
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      armarIdle();
    });

    // Cleanup: o fork expõe stop() de verdade — nada de forçar perda de contexto WebGL.
    return () => {
      cancelled = true;
      clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onPointerMove);
      instanceRef.current?.stop();
      instanceRef.current = null;
    };
  }, [config]);

  return (
    <>
      <style>{FLUID_BG_CSS}</style>
      <div ref={containerRef} className="fluid-bg-container" style={style} />
    </>
  );
}
