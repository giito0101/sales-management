## 画面名：求職者詳細

### 目的

営業担当者の求職者情報を確認する

### 対象スキーマ

JobSeeker
SalesUser
JobSeekerHistory

### 表示項目

#### 求職者詳細

- 氏名
- 年齢
- メールアドレス
- 電話番号
- 希望職種
- 希望勤務地
- 担当者名
- ステータス（新規/面談済/提案中/内定/終了）
- 最終更新日
- メモ

#### 求職者履歴

- 担当者名
- ステータス（新規/面談済/提案中/内定/終了）
- 作成日時
- メモ

### 機能

- 編集ボタン
- 戻るボタン
- 表示項目で求職者詳細と求職者履歴を表示
- 作成日時でソート

### 挙動

- 編集ボタンを押した後、求職者編集に遷移する
- 戻るボタンで、求職者一覧へ戻る

### ルーティング

求職者詳細 jobseekers/[jobseekerId]
求職者編集 /jobseekers/[jobseekerId]/edit

### スキーマ

```
model SalesUser {
  // ✅ ログインID（1〜50文字、英数字と - _ のみ）を“手入力で”使う想定
  // cuid() や autoincrement() は使わない
  id       String   @id @db.VarChar(50)
  name     String   @db.VarChar(255)
  password String   @db.VarChar(255)
  isActive Boolean  @default(true)

  jobSeekers JobSeeker[]

  @@map("sales_users")
}

model JobSeeker {
  id              String          @id @default(cuid())
  salesUserId     String          @db.VarChar(50)

  name            String          @db.VarChar(100)  // 1〜100文字（必須）
  age             Int?                               // 0〜120（アプリ側でバリデーション）
  email           String          @db.VarChar(255)  // ✅ 必須
  phone           String          @db.VarChar(20)   // ✅ 必須（数字とハイフン、最大20）

  desiredJobType  String          @db.VarChar(100)  // ✅ 希望職種（必須・1〜100）
  desiredLocation String          @db.VarChar(100)  // ✅ 希望勤務地（必須・1〜100）

  desiredSalary   Int?

  status          JobSeekerStatus @default(NEW)

  memo            String?         @db.VarChar(2000) // 0〜2000文字
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  salesUser       SalesUser       @relation(fields: [salesUserId], references: [id])
  histories       JobSeekerHistory[]

  @@index([salesUserId])
  @@map("job_seekers")
}

model JobSeekerHistory {
  id            String          @id @default(cuid())
  jobSeekerId   String

  status        JobSeekerStatus
  memo          String?         @db.VarChar(2000)

  salesUserId   String          @db.VarChar(50)
  salesUserName String          @db.VarChar(255)

  createdAt     DateTime        @default(now())

  jobSeeker     JobSeeker       @relation(fields: [jobSeekerId], references: [id])

  @@index([jobSeekerId, createdAt])
  @@map("job_seeker_histories")
}
```

### セッション

| キー          | 型     | 例          | 用途           | ソース         |
| ------------- | ------ | ----------- | -------------- | -------------- |
| salesUserId   | string | "sales-001" | DBの担当者確定 | SalesUser.id   |
| salesUserName | string | "営業 太郎" | 表示/履歴複製  | SalesUser.name |

### API

| 画面名     | ユーザー操作        | 認証 | httpメソッド | url                          | 例                                               |
| ---------- | ------------------- | ---- | ------------ | ---------------------------- | ------------------------------------------------ |
| 求職者詳細 | 1件詳細を取得したい | 要   | GET          | /api/jobseekers/{id}         |                                                  |
| 求職者履歴 | 履歴を取得したい    | 要   | GET          | /api/jobseekers/{id}/history | /api/jobseekers/{id}/history?sort=createdAt_desc |

### 前提

Next.js(App Router) + Auth.js v4
Next APIを使う
tailwind/shadcnを使う
最小構成
lib/prisma.ts
lib/auth.ts
validation設定例：features/auth/loginSchema.test.ts
proxy.ts
