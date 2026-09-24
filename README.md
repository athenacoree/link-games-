# 🎮 Link Minigames — Biblioteca Oficial de Minijuegos HTML5

Este repositorio contiene la biblioteca oficial de minijuegos estáticos HTML5 de la plataforma **Link**. La arquitectura está diseñada para funcionar principalmente de forma estática mediante **GitHub Pages** sin necesidad de ejecutar un servidor en Render para los juegos cliente-side.

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

Cada minijuego se organiza en su propia carpeta raíz:

```text
/
├── index.html              # Catálogo principal dinámico
├── games.json              # Registro unificado de juegos
├── assets/
│   └── css/
│       └── link-theme.css  # Tema visual unificado de Link
├── tictactoe/             # Tres en Raya
├── connect4/              # 4 en Raya
├── pong/                  # Pong Clásico
├── trivia/                # Trivia Quiz
├── memory/                # Juego de Memoria
├── snake/                 # Serpiente Classic
└── 2048/                  # 2048 Puzzle
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
- **`category`** (string): Categoría (`board`, `arcade`, `puzzle`, `trivia`, etc.).
- **`players`** (number): Número máximo de jugadores locales/soportados.
- **`mode`** (array): `["solo"]`, `["multiplayer"]` o ambos `["solo", "multiplayer"]`.
- **`mobile`** (boolean): `true` si cuenta con controles táctiles/diseño responsive.
- **`requiresServer`** (boolean): `false` para cliente estático (GitHub Pages), `true` si requiere servidor/WebSocket en Render.
- **`license`** (string): Licencia Open Source (`MIT`, `CC0`, `BSD`, `Apache-2.0`).
- **`url`** (string): Ruta relativa al juego (`./nombre-juego/`).

---

## ➕ 4. Cómo agregar un nuevo juego

1. Crea una carpeta dentro del repositorio con el identificador del juego (p. ej. `/flappy/`).
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
- `https://USUARIO.github.io/REPOSITORIO/connect4/`
- `https://USUARIO.github.io/REPOSITORIO/2048/`

---

## 📜 6. Catálogo e Información de Licencias

Todos los minijuegos integrados son open-source con licencias compatibles (MIT / CC0):

| Juego | Licencia | Sin Servidor | Descripción |
| :--- | :--- | :---: | :--- |
| **Tres en Raya** | MIT | Sí | Modo 1 vs IA y 2 Jugadores local |
| **4 en Raya** | MIT | Sí | Modo 1 vs IA y 2 Jugadores local |
| **Pong Clásico** | MIT | Sí | Teclado + Controles táctiles |
| **Trivia Quiz** | MIT | Sí | Múltiples categorías y retroalimentación |
| **Juego de Memoria** | MIT | Sí | Emparejamiento de cartas y temporizador |
| **Serpiente Classic** | MIT | Sí | Controles táctiles D-Pad + Gestos swipe |
| **2048 Puzzle** | MIT | Sí | Deslizamiento táctil y combinación de fichas |

---

## 🖥️ 7. Juegos Cliente-Side vs Infraestructura Adicional

- **Servidor Estático (GitHub Pages):**
  Todos los juegos actuales son **100% cliente-side (`requiresServer: false`)**. Se ejecutan completamente en el navegador del usuario y no consumen recursos de backend.

- **Infraestructura Adicional para Multijugador Online:**
  Si en el futuro se agregan juegos que requieran partidas multijugador online en tiempo real (mediante WebSockets o Node.js), deben marcarse en `games.json` con `"requiresServer": true`. Estos juegos requerirán desplegar su backend en plataformas como **Render**.

---

## 🤖 8. Integración con Link AI

La IA de Link puede consumir directamente `https://<USUARIO>.github.io/<REPOSITORIO>/games.json` para descubrir dinámicamente el catálogo completo, descripciones, categorías y enlaces a los minijuegos disponibles.
