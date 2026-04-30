---
template_version: 1.0
doc_type: api-reference
language: ja
---
# API リファレンス: {{project.name}}

<!-- template_version: 1.0 -->
<!-- generated_at: {{doc.generated_at}} -->

> **ドキュメント種別:** API リファレンス
> **プロジェクト:** {{project.name}} (`{{project.slug}}`)
> **言語:** {{doc.lang}}
> **生成日時:** {{doc.generated_at}}

---

## 1. 認証

> _クライアントが API で認証する方法を説明してください。_
> _出典: ARCHITECTURE.md §5 API 設計 および SPEC.md セキュリティ要件。_

### 1.1 認証方式

| 方式 | 説明 | 設定箇所 |
|-----|------|--------|
| _ARCHITECTURE.md から導出_ | | |

### 1.2 認証情報の取得手順

> _API キー / トークンの取得手順をステップバイステップで説明してください。_

```bash
# アクセストークン取得の例
# POST /auth/token
# Content-Type: application/json
# {"client_id": "...", "client_secret": "..."}
```

### 1.3 リクエストでの認証情報の使用

```http
# Authorization ヘッダーの例
Authorization: Bearer <access_token>
```

---

## 2. 共通仕様

### 2.1 ベース URL

| 環境 | ベース URL |
|-----|---------|
| 本番 | `https://api.{{project.slug}}.example.com/v1` |
| ステージング | `https://staging-api.{{project.slug}}.example.com/v1` |

### 2.2 リクエスト形式

- Content-Type: `application/json`
- 文字エンコーディング: UTF-8
- 日時形式: ISO 8601 (`2026-04-30T12:00:00Z`)

### 2.3 レスポンス形式

```json
{
  "data": { },
  "meta": {
    "request_id": "...",
    "timestamp": "2026-04-30T12:00:00Z"
  }
}
```

### 2.4 エラーレスポンス形式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": []
  }
}
```

### 2.5 共通エラーコード

| HTTP ステータス | エラーコード | 説明 |
|--------------|-----------|------|
| 400 | `VALIDATION_ERROR` | リクエストパラメータのバリデーション失敗 |
| 401 | `UNAUTHORIZED` | 認証情報が未指定または無効 |
| 403 | `FORBIDDEN` | 権限不足 |
| 404 | `NOT_FOUND` | リソースが見つからない |
| 429 | `RATE_LIMIT_EXCEEDED` | リクエスト数超過 |
| 500 | `INTERNAL_ERROR` | サーバー側エラー |

---

## 3. エンドポイント

{{spec.use_cases}}

> _各 API エンドポイントをサブセクションでドキュメント化してください。_
> _ARCHITECTURE.md §5 API 設計、SPEC.md ユースケース、src/** スキャンから導出します。_
> _openapi.yaml / openapi.json が存在する場合は正規ソースとして扱ってください。_

### 3.x `{メソッド} {パス}`

> _各エンドポイントについてこのセクションを繰り返してください。_

**説明:** _このエンドポイントの動作の簡潔な説明。_

**ユースケース:** _SPEC.md ユースケースへの参照 (例: UC-001)。_

**リクエスト**

| パラメータ | 型 | 必須 | 説明 |
|---------|---|------|------|
| | | | |

**リクエストボディ** (該当する場合)

```json
{
  // リクエストボディの例
}
```

**レスポンス** (200 OK)

```json
{
  // 成功レスポンスの例
}
```

**エラーレスポンス**

| ステータス | コード | 条件 |
|---------|------|------|
| 400 | `VALIDATION_ERROR` | |
| 404 | `NOT_FOUND` | |

---

## 4. コードサンプル

> _一般的な言語ですぐに実行できるコードサンプルを提供してください。_

### 4.1 cURL

```bash
# リクエスト例
curl -X GET \
  "https://api.{{project.slug}}.example.com/v1/resource" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### 4.2 Python

```python
import requests

response = requests.get(
    "https://api.{{project.slug}}.example.com/v1/resource",
    headers={"Authorization": "Bearer <token>"}
)
print(response.json())
```

### 4.3 JavaScript / TypeScript

```typescript
const response = await fetch(
  "https://api.{{project.slug}}.example.com/v1/resource",
  {
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "application/json",
    },
  }
);
const data = await response.json();
```

---

## 5. レート制限

| プラン | 1分あたりリクエスト数 | 1日あたりリクエスト数 | 備考 |
|------|------------------|------------------|------|
| _ARCHITECTURE.md または SPEC.md から導出_ | | | |

### 5.1 レート制限ヘッダー

| ヘッダー | 説明 |
|--------|------|
| `X-RateLimit-Limit` | ウィンドウ内の最大リクエスト数 |
| `X-RateLimit-Remaining` | 現在のウィンドウでの残りリクエスト数 |
| `X-RateLimit-Reset` | ウィンドウがリセットされる Unix タイムスタンプ |

### 5.2 レート制限への対処

> _`429 Too Many Requests` を受信した場合の推奨バックオフ戦略。_

---

## 6. 変更履歴

| バージョン | 日付 | 変更内容 |
|---------|------|--------|
| 1.0 | {{doc.generated_at}} | 初回リリース |

---

## 付録 A: SDK とクライアントライブラリ

> _この API を利用するための公式またはコミュニティ SDK の一覧を記載してください。_

---

## 付録 B: 関連ドキュメント

| ドキュメント | パス | 説明 |
|------------|------|------|
| HLD | `docs/deliverables/{{project.slug}}/hld.{{doc.lang}}.md` | システムアーキテクチャ |
| LLD | `docs/deliverables/{{project.slug}}/lld.{{doc.lang}}.md` | 詳細設計書 |
| ARCHITECTURE.md | `ARCHITECTURE.md` | 元アーキテクチャドキュメント |
