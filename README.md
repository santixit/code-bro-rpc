# Code Bro RPC

Rich Presence para Discord que muestra el archivo, el lenguaje y la carpeta que estás editando en VS Code. Cambia automáticamente el logo para varios lenguajes comunes.

## Uso

1. Instala Discord de escritorio e inicia sesión.
2. Instala esta extensión en VS Code.
3. El Application ID compartido ya viene configurado. Si usas otro, cambia `codeBroRpc.applicationId` en los ajustes de VS Code.
4. Abre un archivo de código. Usa `Code Bro RPC: Iniciar presencia` si la conexión no comenzó al iniciar VS Code.

## Configuración

- `codeBroRpc.applicationId`: ID de la aplicación de Discord.
- `codeBroRpc.showFile`: muestra el archivo activo.
- `codeBroRpc.showLanguage`: muestra el lenguaje.
- `codeBroRpc.showWorkspace`: muestra el nombre del proyecto.
- `codeBroRpc.largeImage`: imagen predeterminada (clave de asset o URL directa).
- `codeBroRpc.languageImages`: mapa opcional de `languageId` a URL de imagen PNG o GIF. Por ejemplo: `{ "java": "https://img.icons8.com/color/96/java-coffee-cup-logo.png" }`.

Los nombres del archivo y del proyecto aparecen en tu perfil mientras Rich Presence esté activo. Los logos PNG de varios lenguajes usan enlaces públicos de Icons8. Las imágenes externas, incluidos los GIF animados, dependen de que Discord acepte la URL.

## Desarrollo

```sh
npm install
npm run compile
```

Pulsa `F5` en VS Code para abrir Extension Development Host.
