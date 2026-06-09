'use client';

// Fundo de fluido WebGL estilo torii.studio.
// Baseado em webgl-fluid (npm) -> port do WebGL-Fluid-Simulation de Pavel Dobryakov (MIT).
//
// Instalação:   npm i webgl-fluid
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
// Comentários marcam tudo que difere do default do pacote.
const FLUID_CONFIG = {
  TRANSPARENT: true,                  // canvas transparente -> compõe sobre o fundo escuro do site
  BACK_COLOR: { r: 6, g: 4, b: 10 },  // 0-255; só usado se TRANSPARENT for false

  SHADING: true,                      // (default) iluminação volumétrica — confirmado ligado no torii
  BLOOM: true,                        // (default) brilho
  BLOOM_INTENSITY: 0.4,               // de 0.8 -> mais sutil
  BLOOM_THRESHOLD: 0.7,               // de 0.6 -> só os núcleos mais brilhantes brilham
  SUNRAYS: false,                     // god-rays off -> rastro mais limpo

  DENSITY_DISSIPATION: 3.5,           // de 1 -> tinta some rápido (rastro curto)
  VELOCITY_DISSIPATION: 0.5,          // de 0.2 -> movimento assenta rápido, rastro "cola" no cursor
  CURL: 8,                            // de 30 -> bem menos redemoinho

  SPLAT_RADIUS: 0.18,                 // de 0.25 -> rastro mais fino
  SPLAT_FORCE: 4500,                  // de 6000 -> injeção mais calma

  COLORFUL: false,                    // desliga o ciclo automático de cores...
  SPLAT_COLOR: { r: 0.9, g: 0.1, b: 0.5 }, // ...e fixa rosa/magenta (canais 0-1 float)

  SIM_RESOLUTION: 96,                 // de 128 -> grid de velocidade mais barato
  DYE_RESOLUTION: 512,                // de 1024 -> metade do custo de GPU

  TRIGGER: 'hover',                   // (default) rastro segue o cursor ao mover
  IMMEDIATE: false,                   // sem a "explosão" aleatória inicial
  AUTO: false,                        // (default) 100% dirigido pelo cursor
};

export default function FluidBackground({ config = FLUID_CONFIG, style }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Flag pra abortar se o componente desmontar ANTES do import dinâmico resolver
    // (e pra sobreviver ao double-mount do React Strict Mode em dev).
    let cancelled = false;

    // Import dinâmico DENTRO do effect: o pacote toca window/navigator no load,
    // então nunca pode rodar no servidor (SSR). useEffect nunca roda no server.
    import('webgl-fluid').then(({ default: WebGLFluid }) => {
      if (cancelled || !canvasRef.current) return;
      WebGLFluid(canvasRef.current, config);
    });

    // Cleanup: o webgl-fluid original NÃO expõe stop()/destroy(), e seu loop de
    // requestAnimationFrame nunca guarda o id. A forma confiável de neutralizá-lo
    // é forçar a perda do contexto WebGL -> os draws órfãos viram no-op e o browser
    // não acumula contextos a cada remontagem.
    return () => {
      cancelled = true;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const lose = gl && gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    };
  }, [config]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,             // atrás do conteúdo (que deve ter zIndex maior)
        display: 'block',
        touchAction: 'none',   // rastro no mobile sem rolar/zoom
        ...style,
      }}
      // NÃO use pointer-events: none aqui: o webgl-fluid escuta mousemove no canvas.
      // Em vez disso, deixe o cursor atravessar a camada de conteúdo decorativa
      // (pointer-events: none nela; pointer-events: auto só nos links/botões).
    />
  );
}

/*
 * ── Alternativa mais limpa: webgl-fluid-enhanced ───────────────────────────
 * É um fork em classe (npm i webgl-fluid-enhanced) com start()/stop() de verdade,
 * e ele escuta no window — então você PODE pôr pointer-events: none no canvas.
 * Esboço (a API de config do fork usa nomes em camelCase, confira o README dele):
 *
 *   import('webgl-fluid-enhanced').then(({ default: WebGLFluidEnhanced }) => {
 *     if (cancelled || !canvasRef.current) return;
 *     const sim = new WebGLFluidEnhanced(canvasRef.current);
 *     sim.setConfig({  ...  });
 *     sim.start();
 *     instanceRef.current = sim;
 *   });
 *   // cleanup: instanceRef.current?.stop();
 */
