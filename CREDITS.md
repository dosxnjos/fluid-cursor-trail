# Créditos

Este projeto **não inventa** o efeito de rastro de fluido — ele empacota,
documenta e configura código open-source de terceiros (tudo MIT). Crédito a quem
fez o trabalho de verdade:

| Autor | Projeto | Papel aqui | Licença |
|---|---|---|---|
| **Pavel Dobryakov** | [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | Autor original do solver Navier-Stokes + shaders WebGL. A base de tudo. | MIT © 2017 |
| **webgl-fluid** (npm) | [npm](https://www.npmjs.com/package/webgl-fluid) | Port/wrapper em pacote ESM que `index.html` e `FluidBackground.jsx` importam. | MIT |
| **Michael Brusegard** | [WebGL-Fluid-Enhanced](https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced) | Fork em classe com `start()/stop()` e config camelCase. É o `wfe-index.umd.js` embutido (usado pela injeção offline). | MIT |
| **[torii.studio](https://torii.studio/)** | — | **Inspiração de design** (não é autor de código): a paleta rosa/magenta e o uso do efeito como fundo vieram de observar o site deles. | — |

## O que é meu neste repo

Só a **camada de configuração e integração**: o preset "torii", os ajustes de
SSR/cleanup no componente React, a bancada de tuning (`testbed/`) e os scripts de
injeção (`apply_full.py`, `fluid_inject_enhanced.txt`). O motor da simulação é
inteiramente dos autores acima.
