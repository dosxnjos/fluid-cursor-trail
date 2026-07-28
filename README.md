# Fluid Cursor Trail — o efeito do torii.studio

O rastro do cursor na home do [torii.studio](https://torii.studio/) **não é um "trail" comum** (nem partículas, nem canvas 2D com fade). É uma **simulação de fluido 2D rodando na GPU** (Navier-Stokes em tempo real). Eu confirmei isso extraindo os shaders WebGL da própria página — são exatamente os passos de um solver de fluido: `splat`, `advection`, `divergence`, `pressure` (solver de Jacobi, 20 iterações), `curl`/`vorticity`, `dissipation`, mais `bloom`, `dithering` e `shading`.

É o projeto open-source **[WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)** do **Pavel Dobryakov** — **licença MIT**. O torii só ligou `SHADING` + `BLOOM`, deixou o fundo **transparente** sobre o site escuro e tunou a paleta pro rosa/magenta da marca.

Os consumidores deste repo (`index.html`, `FluidBackground.jsx`) rodam sobre o fork **[webgl-fluid-enhanced](https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced)** — mesma simulação, API em classe com `start()`/`stop()` reais, além de idle-pause (a simulação pausa sozinha depois de 3s sem movimento do ponteiro) e respeito a `prefers-reduced-motion`.

## Demos ao vivo

Abra e mexa o cursor — roda 100% no navegador, na GPU:

- 🌊 **[Efeito (preset torii)](https://dosxnjos.github.io/fluid-cursor-trail/)** — o rastro rosa/magenta sobre fundo escuro, do jeito do site.
- 🎛️ **[Bancada de tuning](https://dosxnjos.github.io/fluid-cursor-trail/testbed/)** — painel ao vivo: arraste os sliders (dissipação, raio, curl, bloom, blur, véu…) e veja o rastro mudar na hora. É daqui que saem os presets.

> Rodando local: sirva a pasta por http (ex.: `npx serve` ou `python -m http.server`) — o `index.html` importa a lib via CDN ESM, então abrir por `file://` pode falhar.

## Como funciona (em 1 parágrafo)

A cada movimento do cursor, o código calcula o deslocamento `(deltaX, deltaY)` e faz um **"splat"**: injeta um borrão gaussiano de **velocidade** (delta × `SPLAT_FORCE`) no campo de velocidade e um borrão de **cor** no campo de tinta (dye), ambos do tamanho `SPLAT_RADIUS`. A cada frame, a GPU resolve o fluido: vorticidade (`CURL`) → divergência → pressão (Jacobi) → subtração do gradiente (mantém incompressível) → **advecção** (a tinta é "empurrada" pelo campo de velocidade) → e tudo desbota um pouco via `DENSITY_DISSIPATION` / `VELOCITY_DISSIPATION`. O resultado é tinta que escorre e some como fumaça, seguindo o cursor.

## Arquivos aqui

| Arquivo | O quê |
|---|---|
| [`index.html`](index.html) | Versão **vanilla**, copia-e-cola. Carrega o pacote via CDN ESM (sem bundler). É o que a demo "Efeito" serve. |
| [`FluidBackground.jsx`](FluidBackground.jsx) | Componente **React / Next.js** pronto, com SSR-safe + cleanup do contexto WebGL. |
| [`testbed/index.html`](testbed/index.html) | **Bancada de tuning** com painel ao vivo. Autossuficiente — embute a lib [`webgl-fluid-enhanced`](https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced), não precisa de internet. Tem um **seletor de cor em disco (OKLCH)** — botão "🎨 cor custom" ao lado dos presets — e "Meus kits": salve paletas nomeadas (`localStorage`), reaplique com um clique. |

> Créditos completos a todos os autores do efeito em [`CREDITS.md`](CREDITS.md). Licença em [`LICENSE`](LICENSE).

## Setup React/Next

```bash
npm i webgl-fluid-enhanced
```

Coloque `<FluidBackground />` no **`app/layout.js`** (não numa página). O layout persiste entre navegações → o componente não remonta a cada rota → evita o vazamento de contexto WebGL.

```jsx
import FluidBackground from '@/components/FluidBackground';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <FluidBackground />
        {children}
      </body>
    </html>
  );
}
```

## Config: nomes novos (camelCase) vs. a versão "torii"

> ⚠️ **Migração (27/07/2026): trocamos `webgl-fluid` por `webgl-fluid-enhanced`.** A API virou
> classe (`new WebGLFluidEnhanced(container)` + `setConfig()` + `start()`/`stop()`) e os nomes de
> config passaram de `SCREAMING_CASE` para `camelCase`. A tabela abaixo já reflete os nomes novos;
> se você ainda tem código apontando pro pacote antigo, é só mapear 1:1 (`TRANSPARENT` →
> `transparent`, `SPLAT_RADIUS` → `splatRadius` etc.).

| Opção (fork atual) | Default do fork | Torii-style | Pra que serve |
|---|---|---|---|
| `transparent` | `false` | **`true`** | Canvas transparente, compõe sobre seu fundo escuro |
| `backgroundColor` | `'#000000'` | `'#06040a'` | Cor de fundo (hex). Ignorada se `transparent` |
| `shading` | `true` | `true` | Iluminação volumétrica (ligado no torii) |
| `bloom` | `true` | `true` | Brilho (glow) |
| `bloomIntensity` | `0.8` | **`0.4`** | Força do glow — mais sutil |
| `bloomThreshold` | `0.6` | **`0.7`** | Só núcleos brilhantes brilham |
| `sunrays` | `true` | **`false`** | God-rays — desligado p/ rastro limpo |
| `densityDissipation` | `1` | **`3.5`** | Velocidade com que a tinta some (↑ = some mais rápido) |
| `velocityDissipation` | `0.2` | **`0.5`** | Velocidade com que o movimento assenta |
| `curl` | `30` | **`8`** | Redemoinho/turbulência (↓ = fita suave) |
| `splatRadius` | `0.25` | **`0.18`** | Espessura do rastro |
| `splatForce` | `6000` | **`4500`** | Força de injeção por movimento |
| `colorful` | `true` | **`false`** | Ciclo automático de cores (off p/ fixar a cor) |
| `colorPalette` | `[]` | `['#E61A80']` | Paleta fixa do rastro, em hex (equivale ao antigo `SPLAT_COLOR: {r:.9,g:.1,b:.5}`) |
| `simResolution` | `128` | **`96`** | Resolução do grid de velocidade (custo) |
| `dyeResolution` | `1024` | **`512`** | Resolução da tinta (nitidez vs. custo de GPU) |
| `pressureIterations` | `20` | `20` | Iterações do solver de pressão (principal custo) |
| `hover` | `true` | `true` | Rastro segue o cursor ao mover (equivalente ao antigo `TRIGGER: 'hover'`) |

**Quer mais ou menos rastro?** Mexa em `densityDissipation` (↑ = rastro mais curto), `splatRadius` (espessura) e `curl` (quantidade de redemoinho).

## Idle-pause e `prefers-reduced-motion`

Os dois consumidores (`index.html`, `FluidBackground.jsx`) pausam a simulação sozinhos depois de
**3s sem movimento do ponteiro** (`sim.stop()`, retomando com `sim.start()` no próximo
`pointermove`) — o `requestAnimationFrame` contínuo do solver consome GPU/bateria mesmo parado, e
não há motivo pra isso rodar com a tela "quieta". Quem tem `prefers-reduced-motion: reduce`
ativado **nem inicializa** a simulação (nenhum canvas é criado). Nenhum dos dois é configurável —
o valor de 3s já foi validado no uso real; virar um knob seria complexidade sem consumidor.

## Gotchas (os que você vai esbarrar)

1. **~~Sem teardown → vaza contexto WebGL~~ (resolvido pelo fork).** O pacote `webgl-fluid`
   original rodava um `requestAnimationFrame` cujo id nunca era guardado, exigindo o hack de
   forçar `WEBGL_lose_context` no cleanup. O fork `webgl-fluid-enhanced` expõe `stop()` de
   verdade — o cleanup dos dois consumidores só chama `sim.stop()`, sem tocar em contexto WebGL.

2. **SSR quebra.** O pacote toca `window`/`document` no load. `'use client'` **não** impede SSR sozinho. **Fix:** import dinâmico **dentro** do `useEffect` (já feito). Pra garantia máxima, renderize via `next/dynamic` com `{ ssr: false }`.

3. **Strict Mode monta 2x em dev** → loop duplicado. **Fix:** flag `cancelled` setada no cleanup e checada após o import resolver (já feito).

4. **O contêiner passado NÃO é o canvas.** `new WebGLFluidEnhanced(container)` espera um
   **elemento contêiner** (`<div>`) — ele cria e gerencia o próprio `<canvas>` interno, e
   **sobrescreve o atributo `style`** desse contêiner (seta `position: relative; display: flex`).
   Passar um `<canvas>` no lugar do contêiner faz a lib tentar aninhar um canvas dentro de outro
   (o interno nunca é pintado — `<canvas>` não renderiza filhos), e não travar o `position: fixed`
   do contêiner com `!important` faz o layout dobrar de altura (o efeito sai do fixed e empurra o
   conteúdo da página pra baixo dele). Os dois consumidores já cobrem isso — ver os comentários
   `⚠️` em `index.html`/`FluidBackground.jsx`.

5. **Pointer-events.** O fork escuta `mousemove` no **canvas interno que ele mesmo cria**, não no
   `window` (ao contrário do que a documentação do fork sugere) — então esse canvas interno
   **PODE** ter `pointer-events: none` (é o que os dois consumidores fazem, pra deixar o cursor
   atravessar até o conteúdo/links reais), mas alguém precisa repassar o movimento real do
   ponteiro pra ele: o `window` escuta `pointermove` de verdade e despacha um `mousemove`
   sintético pro canvas interno (`wrap.querySelector('canvas')`) — ver a função `onPointerMove` em
   `index.html`/`FluidBackground.jsx`/`testbed/index.html`. Esquecer esse repasse é a razão mais
   provável do rastro simplesmente não aparecer.

6. **Cor/transparência fora do esperado.** Default pinta preto sólido (`transparent: false`) e cicla todas as cores (`colorful: true`). **Fix:** `transparent: true` + `colorful: false` + `colorPalette: ['#hex']`.

**Mobile:** o pacote auto-reduz `dyeResolution` e pode desligar `bloom`/`sunrays` em celulares sem suporte a float-linear — então o glow pode sumir em alguns aparelhos. Use `touch-action: none` no contêiner pra ter rastro sem rolar a página.

## Licença

Código da simulação: **MIT**, © 2017 Pavel Dobryakov. Pode usar comercialmente; só mantenha o aviso de copyright/MIT do pacote nos seus arquivos (ele já vem no `node_modules`).
