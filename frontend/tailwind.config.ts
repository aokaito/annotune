import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ベースカラー（ダーク）
        background: '#111010',        // メイン背景
        surface: '#1C1917',           // カード・サーフェス
        elevated: '#292524',          // 入力フィールド・ホバー背景
        foreground: '#F5F5F4',        // メインテキスト

        muted: {
          DEFAULT: '#292524',
          foreground: '#A8A29E'       // サブテキスト
        },

        // アクセントカラー（アンバー）
        primary: {
          DEFAULT: '#F59E0B',         // メインアクセント
          hover: '#D97706',           // ホバー状態
          foreground: '#111010'       // ボタン上のテキスト
        },

        secondary: {
          DEFAULT: '#44403C',
          foreground: '#F5F5F4'
        },

        accent: {
          DEFAULT: '#FBBF24',         // 明るいアクセント
          foreground: '#111010'
        },

        // セマンティックカラー
        card: '#1C1917',
        border: '#44403C',
        input: '#292524',
        ring: '#F59E0B',

        // フィードバックカラー
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#F5F5F4'
        },
        success: {
          DEFAULT: '#22C55E',
          foreground: '#111010'
        }
      }
    }
  },
  plugins: []
};

export default config;
