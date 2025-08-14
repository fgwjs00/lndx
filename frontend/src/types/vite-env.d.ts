/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 声明全局开发模式变量
declare const __DEV_MODE__: boolean
declare const __SKIP_CAPTCHA__: boolean
declare const __MOCK_AUTH__: boolean 
