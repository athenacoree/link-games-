# 🎮 Link Minigames — Biblioteca Oficial de Minijuegos HTML5

Este repositorio contiene la biblioteca oficial de minijuegos estáticos HTML5 de la plataforma **Link**. La arquitectura está diseñada para funcionar de forma completamente estática mediante **GitHub Pages** sin necesidad de ejecutar un servidor en Render para los juegos cliente-side.

---

## 🚀 1. Cómo activar GitHub Pages

1. Dirígete a tu repositorio en GitHub.
2. Ve a la pestaña **Settings** (Configuración) > **Pages**.
3. En la sección **Build and deployment**:
   - **Source**: Selecciona `Deploy from a branch`.
   - **Branch**: Selecciona la rama principal (`main` o `master`) y la carpeta `/ (root)`.
4. Haz clic en **Save**.
5. En unos momentos, tu sitio estará publicado en:
   `https://<USUARIO>.github.io/<REPOSITORIO>/`

---

## 🕹️ 2. Estructura del Repositorio

Cada minijuego se organiza en su propia carpeta raíz dentro del repositorio:

```text
/
├── index.html              # Catálogo principal dinámico con buscador y favoritos
├── games.json              # Registro unificado de juegos (27 juegos integrados)
├── assets/
│   └── css/
│       └── link-theme.css  # Tema visual unificado de Link
├── tictactoe/             # Tres en Raya
├── connect4/              # 4 en Raya
├── pong/                  # Pong Clásico
├── trivia/                # Trivia Quiz
├── memory/                # Juego de Memoria
├── snake/                 # Serpiente Classic
├── 2048/                  # 2048 Puzzle
├── flappy/                 # Flappy Link
├── breakout/              # Brick Breaker
├── wordle/                # Adivina la Palabra
├── minesweeper/           # Buscaminas
├── simon/                 # Secuencia de Colores
├── sudoku/                # Sudoku Puzzle
├── spaceinvaders/         # Invasores del Espacio
├── whackamole/            # Atrapa al Topo
├── solitaire/             # Solitario Klondike
├── checkers/              # Damas Clásicas
├── hanoi/                 # Torres de Hanói
├── pacman/                # Laberinto Pac-Runner
├── typing/                # Mecanografía Veloz
├── towerstack/            # Torre de Bloques
├── match3/                # Conecta 3
├── mathquiz/              # Reto Matemático
├── doodlejump/            # Salto Infinito
├── lightsout/             # Luces Fuera
├── hangman/               # El Ahorcado
└── wordsearch/            # Sopa de Letras
```

---

## 📋 3. Formato y Modificación de `games.json`

Para agregar o modificar un juego, únicamente edita el archivo `games.json`. El catálogo principal en `index.html` consumirá automáticamente esta configuración.

### Esquema de un Juego:

```json
{
  "id": "tictactoe",
  "name": "Tres en Raya",
  "description": "Clásico juego de Tres en Raya con modo 1 vs AI o 2 jugadores local.",
  "category": "board",
  "players": 2,
  "mode": ["solo", "multiplayer"],
  "mobile": true,
  "requiresServer": false,
  "license": "MIT",
  "url": "./tictactoe/"
}
```

### Campos requeridos:
- **`id`** (string): Identificador único en minúsculas.
- **`name`** (string): Nombre visible del juego.
- **`description`** (string): Descripción corta del juego.
- **`category`** (string): Categoría (`board`, `arcade`, `puzzle`, `trivia`).
- **`players`** (number): Número máximo de jugadores locales/soportados.
- **`mode`** (array): `["solo"]`, `["multiplayer"]` o ambos `["solo", "multiplayer"]`.
- **`mobile`** (boolean): `true` si cuenta con controles táctiles/diseño responsive.
- **`requiresServer`** (boolean): `false` para cliente estático (GitHub Pages), `true` si requiere servidor/WebSocket en Render.
- **`license`** (string): Licencia Open Source (`MIT`, `CC0`, `BSD`, `Apache-2.0`).
- **`url`** (string): Ruta relativa al juego (`./nombre-juego/`).

---

## ➕ 4. Cómo agregar un nuevo juego

1. Crea una carpeta dentro del repositorio con el identificador del juego (p. ej. `/mi-juego/`).
2. Agrega dentro el archivo `index.html` del juego asegurándote de:
   - Incluir la hoja de estilos global con ruta relativa: `<link rel="stylesheet" href="../assets/css/link-theme.css">`.
   - Incluir un botón de retorno: `<a href="../" class="btn-back">← Volver al Catálogo</a>`.
   - Utilizar únicamente rutas relativas (`./` o `../`) para que funcione en subdirectorios de GitHub Pages.
3. Agrega la entrada correspondiente en `games.json`.
4. ¡Listo! `index.html` mostrará automáticamente la nueva tarjeta sin modificar código HTML.

---

## 🔎 5. Comprobar la URL de un juego

En GitHub Pages, la URL de cada juego será:
`https://<USUARIO>.github.io/<REPOSITORIO>/<ID_JUEGO>/`

Por ejemplo:
- `https://USUARIO.github.io/REPOSITORIO/tictactoe/`
- `https://USUARIO.github.io/REPOSITORIO/wordle/`
- `https://USUARIO.github.io/REPOSITORIO/pacman/`

---

## 📜 6. Catálogo e Información de Licencias (27 Minijuegos)

Todos los minijuegos integrados son open-source con licencias compatibles (MIT / CC0 / Apache-2.0 / BSD):

| Juego | Categoría | Licencia | Sin Servidor | Descripción |
| :--- | :--- | :---: | :---: | :--- |
| **Tres en Raya** | Board | MIT | Sí | Modo 1 vs IA y 2 Jugadores local |
| **4 en Raya** | Board | MIT | Sí | Conecta 4 fichas en línea contra IA o local |
| **Pong Clásico** | Arcade | MIT | Sí | Arcade 2D con IA o 2 jugadores |
| **Trivia Quiz** | Trivia | MIT | Sí | Múltiples categorías y preguntas |
| **Juego de Memoria** | Puzzle | MIT | Sí | Emparejamiento de cartas y temporizador |
| **Serpiente Classic** | Arcade | MIT | Sí | Serpiente clásica con D-Pad táctil y Swipe |
| **2048 Puzzle** | Puzzle | MIT | Sí | Junta casillas para alcanzar el 2048 |
| **Flappy Link** | Arcade | MIT | Sí | Vuela entre tuberías con toques |
| **Brick Breaker** | Arcade | MIT | Sí | Rompe bloques con pelota y paleta |
| **Adivina la Palabra** | Puzzle | MIT | Sí | Juego estilo Wordle de 5 letras |
| **Buscaminas** | Board | MIT | Sí | Campo de minas clásico con banderas |
| **Secuencia de Colores** | Puzzle | MIT | Sí | Estilo Simon Says de memoria auditiva/visual |
| **Sudoku Puzzle** | Board | MIT | Sí | Tablero 9x9 con detección de conflictos |
| **Invasores del Espacio** | Arcade | MIT | Sí | Defender la Tierra destruyendo naves |
| **Atrapa al Topo** | Arcade | MIT | Sí | Golpea topos en cuadrícula contra el reloj |
| **Solitario Klondike** | Board | MIT | Sí | Clásico juego de cartas Solitario |
| **Damas Clásicas** | Board | MIT | Sí | Tablero 8x8 con capturas obligatorias y rey |
| **Torres de Hanói** | Puzzle | MIT | Sí | Acertijo matemático de discos y torres |
| **Laberinto Pac-Runner** | Arcade | MIT | Sí | Esquiva fantasmas recolectando puntos |
| **Mecanografía Veloz** | Arcade | MIT | Sí | Escribe palabras antes de agotarse el tiempo |
| **Torre de Bloques** | Arcade | MIT | Sí | Apila bloques móviles para crear torres |
| **Conecta 3** | Puzzle | MIT | Sí | Intercambia gemas alineando 3 o más |
| **Reto Matemático** | Trivia | MIT | Sí | Resuelve operaciones contrarreloj |
| **Salto Infinito** | Arcade | MIT | Sí | Salta entre plataformas dinámicas |
| **Luces Fuera** | Puzzle | MIT | Sí | Apaga todas las luces invirtiendo casillas |
| **El Ahorcado** | Trivia | MIT | Sí | Descubre la palabra antes de agotar vidas |
| **Sopa de Letras** | Puzzle | MIT | Sí | Encuentra palabras ocultas en cuadrícula |

---

## ⭐ 7. Nuevas Funcionalidades de la Plataforma

- **¡Juego Aleatorio!**: Selecciona instantáneamente un juego al azar del catálogo.
- **Sistema de Favoritos**: Guarda tus minijuegos preferidos persistiendo tus datos en `localStorage`.
- **Filtros por Categoría**: Explora según categorías (Tablero, Arcade, Puzzle, Trivia) y Favoritos.
- **Contador de Estadísticas**: Vista rápida del número de juegos disponibles, soporte móvil e infraestructura.

---

## 🖥️ 8. Juegos Cliente-Side vs Infraestructura Adicional

- **Servidor Estático (GitHub Pages):**
  Todos los 27 juegos actuales son **100% cliente-side (`requiresServer: false`)**. Se ejecutan completamente en el navegador del usuario.

- **Infraestructura Adicional para Multijugador Online:**
  Si en el futuro se agregan juegos que requieran partidas multijugador online en tiempo real (mediante WebSockets o Node.js), deben marcarse en `games.json` con `"requiresServer": true`. Estos juegos requerirán desplegar su backend en plataformas como **Render**.

---

## 🤖 9. Integración con Link AI

La IA de Link puede consumir directamente `https://<USUARIO>.github.io/<REPOSITORIO>/games.json` para descubrir dinámicamente el catálogo completo de 27 juegos, sus descripciones, categorías, requisitos y enlaces.
