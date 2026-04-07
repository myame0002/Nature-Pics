# Nature Pics

自然の写真をアップロードし、解析対象カテゴリを先に絞ったうえで iNaturalist の Computer Vision API から候補を返す試作です。

## 開発手順

1. `.env.example` を参考に `.env.local` を作成する
2. `INATURALIST_API_TOKEN` に有効な iNaturalist JWT を設定する
3. ローカルで説明文を生成したい場合は Ollama を導入し、`OLLAMA_MODEL=gemma3:4b` などを設定する
4. OpenAI 互換 API を使う場合は任意で `OPENAI_API_KEY` を設定する
5. 1つ目のターミナルで `npm run api` を起動する
6. 2つ目のターミナルで `npm run dev` を起動する

フロントエンドは `/api` を `http://localhost:8787` にプロキシします。トークンをブラウザへ露出しないため、推論リクエストはローカルの Node プロキシ経由です。

## 補足

- 花カテゴリは Flowering Plants に絞って照合します
- キノコカテゴリは Fungi に絞って照合します
- ビルドはフロントエンドのみを対象にしています。推論には別途 `npm run api` が必要です
- `OLLAMA_MODEL` を設定すると、図鑑メモ生成はローカルの Ollama を優先して使います
- `OPENAI_API_KEY` を設定しない場合、または LLM 呼び出しが失敗した場合、図鑑メモは既存の定型文テンプレートで保存されます
