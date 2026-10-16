import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Gestión DPC',
  tagline: 'Documentación técnica del sistema de gestión de planes posconsumo',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://dreinova.github.io',
  baseUrl: '/dpc-docs/',
  organizationName: 'Dreinova',
  projectName: 'dpc-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // Los .md se leen como CommonMark (no MDX): la documentación tiene fórmulas con < y { que MDX interpretaría como JSX.
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Contenido de ejemplo de la plantilla de Docusaurus: no forma parte de la documentación.
          exclude: ['tutorial-basics/**', 'tutorial-extras/**', 'intro.mdx'],
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Igual que la app: solo tema claro.
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Gestión DPC',
      logo: {
        alt: 'Gestión DPC',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'documentacion',
          position: 'left',
          label: 'Documentación',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Documentación',
          items: [
            {label: 'Introducción', to: '/docs/'},
            {label: 'Arquitectura', to: '/docs/arquitectura/vision-general'},
            {label: 'Base de datos', to: '/docs/base-de-datos/modelo'},
          ],
        },
        {
          title: 'Operación',
          items: [
            {label: 'Desarrollo local', to: '/docs/operacion/desarrollo-local'},
            {label: 'Despliegue', to: '/docs/operacion/despliegue'},
            {label: 'Importación de Excel', to: '/docs/importacion/proceso'},
          ],
        },
      ],
      copyright: `Gestión DPC · Documentación técnica · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      additionalLanguages: ['sql', 'bash', 'python', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
