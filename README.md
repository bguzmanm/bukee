# 📚 Bukee

**Bukee** es una aplicación de escritorio moderna y multiplataforma para gestionar tu biblioteca personal de libros electrónicos. Construida con **Tauri**, **Next.js** y **Tailwind CSS**, ofrece una experiencia de usuario fluida, elegante y nativa.

---

## ✨ Características

- 📖 **Gestión de Biblioteca**: Organiza tus libros con facilidad, con la capacidad de editar y eliminar títulos.
- 🚀 **Añadir Libros con Drag-and-Drop**: Simplemente arrastra y suelta tus archivos EPUB para añadirlos a tu biblioteca.
- 🧩 **Extracción de Metadatos**: Bukee extrae automáticamente metadatos de tus EPUBs, incluyendo título, autor, portada, descripción e identificador (ISBN).
- 🔍 **Búsqueda y Filtrado**: Encuentra libros rápidamente por título, autor, o filtra por etiquetas y autores.
- 🎨 **Vistas Flexibles**: Alterna entre una vista de cuadrícula (Grid) visual y una lista (List) detallada.
- 🌙 **Modo Oscuro/Claro**: Soporte nativo para temas claro y oscuro, adaptable a tu sistema.
- ⚡ **Rendimiento Nativo**: Gracias a Tauri y Rust, la aplicación es ligera y rápida.

---

## 🛠️ Tech Stack

| Capa              | Tecnología                                   |
| ----------------- | -------------------------------------------- |
| Runtime           | [Tauri](https://tauri.app)                   |
| Frontend          | [Next.js](https://nextjs.org) (App Router)   |
| Estilos           | [Tailwind CSS](https://tailwindcss.com)      |
| Componentes       | Basado en [Shadcn UI](https://ui.shadcn.com) |
| Backend           | Rust                                         |
| Base de Datos     | SQLite (`tauri-plugin-sql`)                  |
| Tooling           | [Bun](https://bun.sh)                        |
| Lenguaje          | TypeScript + Rust                            |

---

## 🚀 Configuración y Ejecución

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

1.  **Rust & Cargo** (necesario para Tauri).
2.  **Bun** (gestor de paquetes y runtime de JS).
3.  **Dependencias de desarrollo del sistema** (consulta la [guía de Tauri](https://tauri.app/v1/guides/getting-started/prerequisites) para tu sistema operativo).

### Pasos para ejecutar

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/bukee.git
    cd bukee
    ```

2.  **Instala las dependencias:**
    ```bash
    bun install
    ```
    *Nota: Si es la primera vez, es posible que necesites borrar el archivo `bukee.db` del directorio de datos de la aplicación para que las migraciones se apliquen correctamente.*

3.  **Ejecuta en modo desarrollo:**
    ```bash
    bun run tauri dev
    ```
    Esto iniciará tanto el servidor de Next.js como la ventana de la aplicación Tauri.

---

## 📦 Construir para Producción

Para generar el ejecutable de la aplicación para tu plataforma:

```bash
bun run tauri build
```

El ejecutable se generará en `src-tauri/target/release/bundle/`.

---

## 📂 Estructura del Proyecto

```
.
├── app/                  # Código fuente de Next.js (Frontend)
│   ├── layout.tsx        # Layout principal de la aplicación
│   ├── page.tsx          # Página principal y lógica de la UI
│   └── globals.css       # Estilos globales de CSS
├── components/           # Componentes de UI reutilizables
├── hooks/                # Hooks personalizados de React (ej. useBooks)
├── lib/                  # Librerías y utilidades (db, epub, tauri)
├── public/               # Archivos estáticos (imágenes, fuentes)
├── src-tauri/            # Backend de Tauri (Rust)
│   ├── src/
│   │   ├── lib.rs        # Lógica principal del backend en Rust
│   │   └── main.rs       # Punto de entrada de la aplicación Rust
│   └── tauri.conf.json   # Configuración de la aplicación Tauri
└── types/                # Definiciones de tipos (ej. Book)
```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.