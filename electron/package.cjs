const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const staging = path.join(root, '.electron-build');
const output = path.join(root, 'dist-electron');

fs.rmSync(staging, { recursive: true, force: true });
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
fs.cpSync(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'electron'), path.join(staging, 'electron'), { recursive: true });
fs.copyFileSync(
  path.join(root, 'firebase-applet-config.json'),
  path.join(staging, 'firebase-applet-config.json'),
);

const packageJson = {
  name: 'alco-creative-system-desktop',
  version: '1.0.3',
  description: 'ALCO Creative System desktop application',
  author: 'Aladzan Corpora',
  main: 'electron/main.cjs',
  build: {
    appId: 'com.alco.creative.system',
    productName: 'ALCO Creative System',
    executableName: 'ALCO Creative System',
    electronVersion: '44.1.1',
    directories: { output: '../dist-electron' },
    files: [
      'dist/**/*',
      'electron/**/*',
      'package.json',
      'firebase-applet-config.json',
    ],
    asar: true,
    asarUnpack: ['dist/**/*', 'firebase-applet-config.json'],
    win: { target: ['nsis'] },
    nsis: {
      oneClick: false,
      perMachine: false,
      allowToChangeInstallationDirectory: true,
      deleteAppDataOnUninstall: false,
      artifactName: 'ALCO.Creative.System.Setup.${version}.${ext}',
    },
  },
};

fs.writeFileSync(
  path.join(staging, 'package.json'),
  `${JSON.stringify(packageJson, null, 2)}\n`,
);

const builder = path.join(root, 'node_modules', 'electron-builder', 'cli.js');
const result = spawnSync(process.execPath, [builder, '--win', '--projectDir', staging], {
  cwd: root,
  stdio: 'inherit',
});

fs.rmSync(staging, { recursive: true, force: true });
process.exit(result.status ?? 1);
