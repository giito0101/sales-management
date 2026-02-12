# SALES-MANAGEMENT

## Overview

求職者・企業・選考履歴を管理する営業支援Webアプリ。

個人開発として、
MVPを1サイクルで設計・実装・テストまで完結させることを目的に構築しました。

単に動作させるだけでなく、
再現性・保守性を意識しながら段階的に機能を追加しています。

---

## Architecture / Design

### 設計方針

- Route HandlerベースのAPI設計（※Server Actionsは未使用）
- Prismaによるスキーマ駆動設計
- Zodによる入力バリデーション
- 機能単位で責務を分離

### 主なドメイン

- SalesUser
- JobSeeker
- JobSeekerHistory
- Company

履歴管理は、営業担当が「求職者の現在状況を把握できること」を目的に設計。

---

## Tech Stack

- Framework: Next.js
- Language: TypeScript
- ORM: Prisma
- DB: PostgreSQL（Neon）
- Auth: Auth.js（NextAuth）
- Validation: Zod
- Styling: Tailwind CSS
- Testing: Vitest / Testing Library / Playwright

---

## Features

- 認証付きCRUD（求職者・企業管理）
- 履歴管理（ステータス遷移の記録）
- フォームバリデーション
- 一覧・詳細表示

---

## Testing

- 機能単位で必要最低限のテストを追加
- ユニット／コンポーネントテスト（Vitest）
- E2Eテスト（Playwright）

Playwrightは、MVP受け入れ確認および証跡保存を目的に導入。

---

## Development Policy

MVPを提供するまでを1サイクルとし、

1. 要件整理
2. 設計
3. 実装
4. テスト
5. 動作確認

の流れで構築。

---

## Getting Started

```sh
npm install
npm run dev
```

## Scripts

### Unit / Component Test

```sh
npm run test:run
```
