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
├── games.json              # Registro unificado de juegos (30 juegos integrados)
├── assets/
│   └── css/
│       └── link-theme.css  # Tema visual unificado de Link
├── dungeon/               # Dungeon Crawler: El Laberinto Sombrío
├── towerdefense/          # Kingdom Defense: Defensa de Torres
├── rpgquest/              # Leyenda Heroica: RPG Quest
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
  "id": "dungeon",
  "name": "Dungeon Crawler: El Laberinto Sombrío",
  "description": "Peligrosa aventura en mazmorra con niveles, niebla de guerra, combate por turnos, magia, pociones y NPCs.",
  "category": "rpg",
  "players": 1,
  "mode": ["solo"],
  "mobile": true,
  "requiresServer": false,
  "license": "MIT",
  "url": "./dungeon/"
}
```

---

## 📜 6. Catálogo e Información de Licencias (30 Minijuegos)

Todos los minijuegos integrados son open-source con licencias compatibles (MIT / CC0 / Apache-2.0 / BSD):

| Juego | Categoría | Licencia | Sin Servidor | Descripción |
| :--- | :--- | :---: | :---: | :--- |
| **Dungeon Crawler** | RPG | MIT | Sí | Aventura en mazmorras con niveles, niebla, magia y NPCs |
| **Kingdom Defense** | RPG | MIT | Sí | Defensa de torres con 4 tipos de torres, oleadas y jefes |
| **Leyenda Heroica RPG** | RPG | MIT | Sí | RPG de exploración 2D, misiones con NPCs y batallas |
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
- **Filtros por Categoría**: Explora según categorías (RPG/Aventura, Tablero, Arcade, Puzzle, Trivia) y Favoritos.
- **Contador de Estadísticas**: Vista rápida del número de juegos disponibles, soporte móvil e infraestructura.

---

## 🖥️ 8. Juegos Cliente-Side vs Infraestructura Adicional

- **Servidor Estático (GitHub Pages):**
  Todos los 30 juegos actuales son **100% cliente-side (`requiresServer: false`)**. Se ejecutan completamente en el navegador del usuario.
