import * as vscode from 'vscode';
import RPC from 'discord-rpc';

const DEFAULT_APPLICATION_ID = '1556730043995136100';

// PNGs públicos por lenguaje. El mapa de configuración del usuario puede reemplazarlos
// o añadir otros usando el languageId que VS Code muestra para el documento.
const LANGUAGE_LOGOS: Record<string, string> = {
  javascript: 'https://img.icons8.com/color/96/javascript--v1.png',
  javascriptreact: 'https://img.icons8.com/color/96/react-native.png',
  typescript: 'https://img.icons8.com/color/96/typescript.png',
  typescriptreact: 'https://img.icons8.com/color/96/react-native.png',
  python: 'https://img.icons8.com/color/96/python.png',
  java: 'https://img.icons8.com/color/96/java-coffee-cup-logo.png',
  c: 'https://img.icons8.com/color/96/c-programming.png',
  cpp: 'https://img.icons8.com/color/96/c-plus-plus-logo.png',
  csharp: 'https://img.icons8.com/color/96/c-sharp-logo.png',
  php: 'https://img.icons8.com/color/96/php.png',
  ruby: 'https://img.icons8.com/color/96/ruby-programming-language.png',
  go: 'https://img.icons8.com/color/96/golang.png',
  rust: 'https://img.icons8.com/color/96/rust.png',
  kotlin: 'https://img.icons8.com/color/96/kotlin.png',
  swift: 'https://img.icons8.com/color/96/swift.png',
  html: 'https://img.icons8.com/color/96/html-5.png',
  css: 'https://img.icons8.com/color/96/css3.png',
  scss: 'https://img.icons8.com/color/96/css3.png',
  less: 'https://img.icons8.com/color/96/css3.png',
  vue: 'https://img.icons8.com/color/96/vue-js.png',
  dart: 'https://img.icons8.com/color/96/dart.png',
  shellscript: 'https://img.icons8.com/color/96/bash.png',
  powershell: 'https://img.icons8.com/color/96/powershell.png',
  sql: 'https://img.icons8.com/color/96/mysql-logo.png',
  json: 'https://img.icons8.com/color/96/json.png',
  markdown: 'https://img.icons8.com/color/96/markdown.png'
};

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript', javascriptreact: 'React (JavaScript)',
  typescript: 'TypeScript', typescriptreact: 'React (TypeScript)',
  python: 'Python', java: 'Java', c: 'C', cpp: 'C++', csharp: 'C#',
  php: 'PHP', ruby: 'Ruby', go: 'Go', rust: 'Rust', kotlin: 'Kotlin',
  swift: 'Swift', html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'Less',
  vue: 'Vue', dart: 'Dart', shellscript: 'Shell', powershell: 'PowerShell',
  sql: 'SQL', json: 'JSON', markdown: 'Markdown'
};

export function activate(context: vscode.ExtensionContext): void {
  const client = new RPC.Client({ transport: 'ipc' });
  let connected = false;
  let connecting = false;
  let updateTimer: ReturnType<typeof setTimeout> | undefined;
  let lastUpdate = 0;
  let lastSignature = '';

  const output = vscode.window.createOutputChannel('Code Bro RPC');
  context.subscriptions.push(output);

  const config = () => vscode.workspace.getConfiguration('codeBroRpc');

  const scheduleUpdate = (immediate = false): void => {
    if (!connected) return;
    if (updateTimer) clearTimeout(updateTimer);
    const interval = Math.max(15, config().get<number>('updateInterval', 15)) * 1000;
    const wait = immediate ? 0 : Math.max(0, interval - (Date.now() - lastUpdate));
    updateTimer = setTimeout(() => void updatePresence(), wait);
  };

  const updatePresence = async (): Promise<void> => {
    if (!connected) return;
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    const language = document?.languageId
      ? vscode.languages.getLanguages().then((ids) => ids.includes(document.languageId)
        ? document.languageId
        : 'plaintext')
      : Promise.resolve('sin archivo');
    const languageName = await language;
    const languageId = document?.languageId ?? '';
    const languageLabel = LANGUAGE_LABELS[languageId] ?? languageName;
    const workspace = document ? vscode.workspace.getWorkspaceFolder(document.uri) : undefined;
    const folderName = workspace?.name ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'Sin proyecto';
    const fileName = document?.isUntitled ? 'Archivo nuevo' : document?.uri.fsPath.split(/[\\/]/).pop() ?? 'Sin archivo';
    const settings = config();
    const customImages = settings.get<Record<string, string>>('languageImages', {});
    const imageForLanguage = customImages[languageId] || LANGUAGE_LOGOS[languageId];
    const largeImage = imageForLanguage || settings.get<string>('largeImage', 'vscode');
    const details = settings.get<boolean>('showFile', true) ? `Editando ${fileName}` : 'Programando en VS Code';
    const stateParts: string[] = [];
    if (settings.get<boolean>('showLanguage', true)) stateParts.push(`Lenguaje: ${languageName}`);
    if (settings.get<boolean>('showWorkspace', true)) stateParts.push(`Proyecto: ${folderName}`);
    const state = stateParts.join(' · ') || 'Programando';
    const signature = `${details}|${state}|${largeImage}`;
    if (signature === lastSignature) return;

    try {
      await client.setActivity({
        details: details.slice(0, 128),
        state: state.slice(0, 128),
        largeImageKey: largeImage || undefined,
        largeImageText: `Programando en ${languageLabel}`.slice(0, 128),
        instance: false
      });
      lastUpdate = Date.now();
      lastSignature = signature;
    } catch (error) {
      output.appendLine(`No se pudo actualizar la actividad: ${String(error)}`);
    }
  };

  const start = async (): Promise<void> => {
    if (connected || connecting) return;
    const appId = config().get<string>('applicationId', DEFAULT_APPLICATION_ID).trim();
    if (!appId) {
      void vscode.window.showInformationMessage(
        'Code Bro RPC: configura codeBroRpc.applicationId con el ID de tu aplicación de Discord.'
      );
      return;
    }
    connecting = true;
    try {
      await client.login({ clientId: appId });
      connected = true;
      output.appendLine('Conectado a Discord Rich Presence.');
      scheduleUpdate(true);
    } catch (error) {
      output.appendLine(`Discord no está disponible o el ID no es válido: ${String(error)}`);
      void vscode.window.showWarningMessage('Code Bro RPC: abre Discord e inténtalo de nuevo.');
    } finally {
      connecting = false;
    }
  };

  const stop = async (): Promise<void> => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = undefined;
    lastSignature = '';
    if (connected) {
      try { await client.clearActivity(); } catch { /* Discord pudo cerrarse */ }
      connected = false;
    }
    void vscode.window.showInformationMessage('Code Bro RPC: presencia detenida.');
  };

  client.on('disconnected', () => {
    connected = false;
    lastSignature = '';
    output.appendLine('Discord se desconectó.');
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('codeBroRpc.start', start),
    vscode.commands.registerCommand('codeBroRpc.stop', stop),
    vscode.window.onDidChangeActiveTextEditor(() => scheduleUpdate()),
    vscode.workspace.onDidOpenTextDocument(() => scheduleUpdate()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => scheduleUpdate()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codeBroRpc')) scheduleUpdate(true);
    }),
    { dispose: () => { if (updateTimer) clearTimeout(updateTimer); void client.destroy(); } }
  );

  void start();
}

export function deactivate(): void {}
