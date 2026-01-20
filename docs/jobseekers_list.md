## 画面名：求職者一覧

### 目的
営業担当者の求職者を確認する画面。

### 対象スキーマ
JobSeeker
SalesUser

### 表示項目
- ID
- 氏名
- メールアドレス
- 電話番号
- 担当者名
- ステータス（新規）
- 最終更新日

### 機能
- 求職者詳細画面に遷移
- 最終更新日を降順でソート(デフォルト設定)
- IDと氏名でソート(昇順、降順)
- 検索（氏名、メールアドレス、電話番号、担当者）

### 挙動
- 求職者を選択後、詳細画面へ遷移
- 検索を入力し検索ボタンを押した後、求職者一覧へ戻る
- ソート選択後、求職者一覧へ戻る

### ルーティング
求職者一覧 /jobseekers
求職者詳細 /jobseekers/[jobseekersId]

### エラーメッセージ
検索失敗時：「検索ワードが適切ではありません」
検索フォームの下

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
```

### ルール

| 対象（画面） | エンティティ | 項目名 | 必須か | 入力制約（文字数・形式など） | 権限方針（誰が操作可能か / MVP） | 履歴方針（残す/残さない） | 一覧検索対象か | 一覧の並び順キーか | 備考 |
|--------------|--------------|--------|--------|------------------------------|----------------------------------|----------------------------|------------------|----------------------|------|
| 求職者一覧 | 営業担当者、求職者 | 検索 | No | 0〜255文字 | - | - | Yes | No | 氏名・メール・電話・担当者を対象 |


### API

| 画面名 | ユーザー操作 | 認証 | HTTPメソッド | URL | 例 |
|--------|--------------|------|--------------|-----|-----|
| 求職者一覧 | 一覧を取得したい | 要 | GET | /api/jobseekers | /api/jobseekers?search=営業%20太郎&sort=updatedAt_desc,id_desc |
