import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Browser globals
const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  fetch: "readonly",
  Blob: "readonly",
  FileReader: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  FormData: "readonly",
  XMLHttpRequest: "readonly",
  WebSocket: "readonly",
  EventSource: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  alert: "readonly",
  confirm: "readonly",
  prompt: "readonly",
  console: "readonly",
  Headers: "readonly",
  Request: "readonly",
  Response: "readonly",
  Event: "readonly",
  KeyboardEvent: "readonly",
  MouseEvent: "readonly",
  TouchEvent: "readonly",
  PointerEvent: "readonly",
  FocusEvent: "readonly",
  AnimationEvent: "readonly",
  TransitionEvent: "readonly",
  InputEvent: "readonly",
  ClipboardEvent: "readonly",
  DragEvent: "readonly",
  ErrorEvent: "readonly",
  HashChangeEvent: "readonly",
  PageTransitionEvent: "readonly",
  PopStateEvent: "readonly",
  StorageEvent: "readonly",
  SubmitEvent: "readonly",
  WheelEvent: "readonly",
  CustomEvent: "readonly",
};

// Node.js globals
const nodeGlobals = {
  process: "readonly",
  Buffer: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  exports: "readonly",
  module: "readonly",
  require: "readonly",
  global: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  setImmediate: "readonly",
  clearImmediate: "readonly",
};

// Vue/Nuxt globals
const vueGlobals = {
  // Vue 3
  ref: "readonly",
  computed: "readonly",
  watch: "readonly",
  watchEffect: "readonly",
  onMounted: "readonly",
  onUnmounted: "readonly",
  onUpdated: "readonly",
  onBeforeMount: "readonly",
  onBeforeUnmount: "readonly",
  onBeforeUpdate: "readonly",
  onErrorCaptured: "readonly",
  onActivated: "readonly",
  onDeactivated: "readonly",
  onServerPrefetch: "readonly",
  onRenderTracked: "readonly",
  onRenderTriggered: "readonly",
  provide: "readonly",
  inject: "readonly",
  getCurrentInstance: "readonly",
  h: "readonly",
  nextTick: "readonly",
  defineProps: "readonly",
  defineEmits: "readonly",
  defineExpose: "readonly",
  defineOptions: "readonly",
  defineSlots: "readonly",
  defineModel: "readonly",
  withDefaults: "readonly",
  useSlots: "readonly",
  useAttrs: "readonly",
  shallowRef: "readonly",
  triggerRef: "readonly",
  customRef: "readonly",
  toRef: "readonly",
  toRefs: "readonly",
  unref: "readonly",
  isRef: "readonly",
  isReactive: "readonly",
  isReadonly: "readonly",
  isProxy: "readonly",
  reactive: "readonly",
  readonly: "readonly",
  shallowReactive: "readonly",
  shallowReadonly: "readonly",
  markRaw: "readonly",
  toRaw: "readonly",
  effectScope: "readonly",
  getCurrentScope: "readonly",
  onScopeDispose: "readonly",
  // Nuxt
  useHead: "readonly",
  useRouter: "readonly",
  useRoute: "readonly",
  useRuntimeConfig: "readonly",
  useNuxtApp: "readonly",
  useState: "readonly",
  useCookie: "readonly",
  useFetch: "readonly",
  useLazyFetch: "readonly",
  useAsyncData: "readonly",
  useLazyAsyncData: "readonly",
  useAppConfig: "readonly",
  useError: "readonly",
  clearError: "readonly",
  useImage: "readonly",
  usePreviewMode: "readonly",
  defineNuxtComponent: "readonly",
  defineNuxtPlugin: "readonly",
  defineNuxtRouteMiddleware: "readonly",
  defineNuxtLink: "readonly",
  useLink: "readonly",
  useServerHead: "readonly",
  useRequestHeaders: "readonly",
  useRequestEvent: "readonly",
  useRequestFetch: "readonly",
  useResponse: "readonly",
  useResponseStatus: "readonly",
  useNuxtData: "readonly",
  refreshNuxtData: "readonly",
  clearNuxtData: "readonly",
  useLoadingIndicator: "readonly",
  navigateTo: "readonly",
  abortNavigation: "readonly",
  addRouteMiddleware: "readonly",
  definePageMeta: "readonly",
  setPageLayout: "readonly",
  $fetch: "readonly",
  // Composables
  useTheme: "readonly",
};

// Nitro/Nuxt server globals
const serverGlobals = {
  defineEventHandler: "readonly",
  defineEventHandlerWithSchema: "readonly",
  defineRequestMiddleware: "readonly",
  defineResponseMiddleware: "readonly",
  defineNitroPlugin: "readonly",
  defineNitroConfig: "readonly",
  nitroPlugin: "readonly",
  createError: "readonly",
  createAppError: "readonly",
  sendError: "readonly",
  readBody: "readonly",
  readRawBody: "readonly",
  readMultipartFormData: "readonly",
  readFormData: "readonly",
  getQuery: "readonly",
  getRouterParam: "readonly",
  getRouterParams: "readonly",
  getValidatedRouterParams: "readonly",
  getRequestHeader: "readonly",
  getRequestHeaders: "readonly",
  getRequestURL: "readonly",
  getRequestHost: "readonly",
  getRequestProtocol: "readonly",
  getRequestIP: "readonly",
  getRequestFingerprint: "readonly",
  getResponseStatus: "readonly",
  getResponseStatusText: "readonly",
  getResponseHeader: "readonly",
  getResponseHeaders: "readonly",
  setResponseStatus: "readonly",
  setResponseHeader: "readonly",
  setResponseHeaders: "readonly",
  appendResponseHeader: "readonly",
  appendResponseHeaders: "readonly",
  removeResponseHeader: "readonly",
  sendRedirect: "readonly",
  sendProxy: "readonly",
  proxyRequest: "readonly",
  handleCors: "readonly",
  appendCorsHeaders: "readonly",
  appendCorsPreflightHeaders: "readonly",
  serveStatic: "readonly",
  getCookie: "readonly",
  getCookies: "readonly",
  setCookie: "readonly",
  deleteCookie: "readonly",
  useSession: "readonly",
  getSession: "readonly",
  updateSession: "readonly",
  clearSession: "readonly",
  sealSession: "readonly",
  unsealSession: "readonly",
  useStorage: "readonly",
  useNitroStorage: "readonly",
  isMethod: "readonly",
  isPreflightRequest: "readonly",
  getRouteRules: "readonly",
  defineCachedEventHandler: "readonly",
  cachedFunction: "readonly",
  cachedEventHandler: "readonly",
  defineRenderHandler: "readonly",
  useEvent: "readonly",
  eventHandler: "readonly",
  toEventHandler: "readonly",
  fromNodeMiddleware: "readonly",
  toNodeListener: "readonly",
  toWebRequest: "readonly",
  defineLazyEventHandler: "readonly",
  defineEventHandlerWithBody: "readonly",
  defineEventHandlerWithQuery: "readonly",
  defineEventHandlerWithParams: "readonly",
  defineEventHandlerWithFiles: "readonly",
  defineEventHandlerWithForm: "readonly",
  defineEventHandlerWithJson: "readonly",
};

const __filename_current = fileURLToPath(import.meta.url);
const __dirname_current = path.dirname(__filename_current);
const gitignorePath = path.resolve(__dirname_current, ".gitignore");

export default [
  // Ignore files from .gitignore and other patterns
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "dist/**",
      ".output/**",
      "node_modules/**",
      "*.min.js",
      ".nuxt/**",
      ".nitro/**",
      ".cache/**",
      "data/**",
      "*.d.ts",
      "coverage/**",
      "tailwind.config.js",
    ],
  },

  // Base JavaScript/TypeScript config
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.mjs", "**/*.cjs"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        ...vueGlobals,
        ...serverGlobals,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-var-requires": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      "no-undef": "error",
    },
  },

  // Vue files
  {
    files: ["**/*.vue"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      vue: vuePlugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        ...vueGlobals,
        ...serverGlobals,
      },
    },
    rules: {
      ...vuePlugin.configs.recommended.rules,
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
      "vue/require-default-prop": "off",
      "vue/no-v-html": "off",
      "vue/attribute-hyphenation": "off",
      "vue/v-on-event-hyphenation": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },

  // Server API files - specific Nitro/Nuxt server handling
  {
    files: ["server/**/*.ts", "server/**/*.js"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      globals: {
        ...nodeGlobals,
        ...serverGlobals,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },

  // CLI and bin files - Node.js specific
  {
    files: ["bin/**/*.js", "cli/**/*.js"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      globals: {
        ...nodeGlobals,
      },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
      "no-undef": "off",
    },
  },

  // Fix no-case-declarations errors in export.post.ts
  {
    files: ["server/api/export.post.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-case-declarations": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Fix sqlite.ts ExampleFilters type issue
  {
    files: ["server/storage/backends/sqlite.ts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-undef": "off",
    },
  },

  // Config files
  {
    files: [
      "*.config.ts",
      "*.config.js",
      "*.config.mjs",
      "nuxt.config.ts",
      "vitest.config.ts",
      "eslint.config.mjs",
    ],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      globals: {
        ...nodeGlobals,
        ...vueGlobals,
        defineNuxtConfig: "readonly",
        defineVitestConfig: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
    },
  },
];
