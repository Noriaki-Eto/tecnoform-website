# atelier TECNOFORM HP 引き継ぎ（最新ポインタ）
最終更新：2026年6月6日

## 新チャット開始時
1. リポジトリ: Noriaki-Eto/tecnoform-website
2. **正となる指示書は `TECNOFORM_PROJECT.md`（同リポジトリ内）。まずそれを読む。**
3. GitHubトークンは別途共有（リポジトリ・ドキュメントには絶対に載せない）。

## 公開中のHP
- 本番URL（確定）: https://atelier-tecnoform.com/ （DNS稼働確認済み・GitHub Pages配信）
- 予備URL: https://noriaki-eto.github.io/tecnoform-website/
- メール: info@atelier-tecnoform.com（サイトと同一ドメインに統一・Cloudflare Email Routingで無料転送）
- GitHub Pages 自動デプロイ。
- ※Netlify（旧 stellular-clafoutis-e0a6ca.netlify.app）は停止済み。無視してよい。

## 構成（2026年6月時点）
- WORKS 公開 26 件（うち展覧会 2 件：#30 美濃和紙の里「和紙のファンタジア」展、#22 六甲山サイレンスリゾート「和紙 伝統と未来」展 2021）。
- Coming Soon 2 件（X2, X3）。

## 画像アップロードの必須ルール
- **iPhone写真は EXIF 回転を必ず補正**（`ImageOps.exif_transpose`）してからリサイズ・アップロードする。これを怠ると縦写真が横倒しになる。
- ファイル名は `物件名-連番.jpg`（既存命名に合わせる）。
- 詳細手順・コードは `TECNOFORM_PROJECT.md` を参照。

## 未処理（要のりあきさん判断）
- GitHubトークンを期限付き・リポジトリ限定の fine-grained token に更新。
- GitHub Pages の「Enforce HTTPS」を有効化（リポジトリ設定）。
