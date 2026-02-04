# 📚 Bukee

**Bukee** es una aplicación de escritorio moderna y multiplataforma para gestionar tu biblioteca personal de libros. Construida con **Tauri**, **Next.js** y **Shadcn UI**, ofrece una experiencia de usuario fluida y elegante.

---

## ✨ Características

- 📖 **Gestión de Biblioteca**: Organiza tus libros con facilidad.
- 🔍 **Búsqueda y Filtrado**: Encuentra libros rápidamente por título, autor o etiquetas.
- 🎨 **Vistas Flexibles**: Alterna entre vista de cuadrícula (Grid) y lista (List) según tu preferencia.
- 🌙 **Modo Oscuro/Claro**: Soporte nativo para temas claro y oscuro.
- ⚡ **Rendimiento Nativo**: Gracias a Tauri y Rust, la aplicación es ligera y rápida.

---

## 🛠️ Tech Stack

| Capa       | Tecnología                              |
| ---------- | --------------------------------------- |
| Runtime    | [Tauri](https://tauri.app)              |
| Frontend   | [Next.js](https://nextjs.org)           |
| Estilos    | [Tailwind CSS](https://tailwindcss.com) |
| Componentes| [Shadcn UI](https://ui.shadcn.com)      |
| Tooling    | [Bun](https://bun.sh)                   |
| Lenguaje   | TypeScript + Rust                       |

---

## 🚀 Configuración y Ejecución

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

1. **Rust & Cargo** (necesario para Tauri)
2. **Bun** (gestor de paquetes y runtime de JS)
3. **Dependencias de desarrollo del sistema** (consulta la [guía de Tauri](https://tauri.app/v1/guides/getting-started/prerequisites))

### Pasos para ejecutar

1. **Instalar dependencias de JavaScript:**

    ```bash
    bun install
    ```

2. **Instalar dependencias de Rust (opcional si `tauri dev` lo maneja, pero recomendado):**

    ```bash
    # Dentro de la carpeta src-tauri si es necesario, o simplemente deja que tauri lo gestione
    ```

3. **Ejecutar en modo desarrollo:**

    ```bash
    bun run tauri dev
    ```

   Esto iniciará tanto el servidor de Next.js como la ventana de la aplicación Tauri.

---

## 📦 Construir para Producción

Para generar el ejecutable de la aplicación:

```bash
bun run tauri build
```

El ejecutable se generará en `src-tauri/target/release/bundle/`.

---

## 📂 Estructura del Proyecto

```
.
├── app/                  # Código fuente de Next.js (Frontend)
├── src-tauri/            # Backend de Tauri (Rust)
├── components/           # Componentes de UI (Shadcn)
├── public/               # Archivos estáticos
└── styles/               # Estilos globales y Tailwind
```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.