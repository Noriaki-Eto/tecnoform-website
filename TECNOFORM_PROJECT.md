# atelier TECNO FORM HP プロジェクト指示書

**最終更新：2026年5月27日**

---

## 基本情報

| 項目 | 内容 |
|---|---|
| 代表 | 江藤徳晃（のりあきさん） |
| サイト | tecnoform.jp |
| メール | info@tecnoform.jp |
| キャッチコピー | 「枠を解いて、揺らぎを纏う。」 |
| 本番サーバー | Zenlogic（htdocs/にFTP/FileZilla経由デプロイ予定） |

---

## HP現状（GitHub Pages）

| 項目 | 内容 |
|---|---|
| **公開URL** | https://noriaki-eto.github.io/tecnoform-website/ |
| **GitHub** | Noriaki-Eto/tecnoform-website |
| **トークン** | ghp_lmQ***（Claudeのメモリに記録済み） |
| **管理ファイル** | index.html（HTML/CSS/JS一体型） |
| **Netlify** | 帯域超過で停止中・使用しない |

---

## 画像アップロード手順（最重要）

写真が届いたら **以下を全て同時に実行**：

1. 画像内に書かれているテキスト（コンセプト・説明文・クレジット）を**直接読み取る**
2. GitHubのimages/フォルダにアップロード
3. index.htmlのPROJECTSデータ（slides配列＋desc/credit）を**同時に更新**
4. GitHubにpush

確認・質問は最小限。手動作業を求めない。

### アップロードコード（完全版）

```python
import base64, json, urllib.request, os
from PIL import Image

TOKEN = "ghp_lmQ***（Claudeのメモリに記録済み）"
REPO = "Noriaki-Eto/tecnoform-website"

def upload_image(local_path, filename):
    img = Image.open(local_path)
    if img.mode != "RGB": img = img.convert("RGB")
    w, h = img.size
    if w > 1600: img = img.resize((1600, int(h*1600/w)), Image.LANCZOS)
    tmp = f"/tmp/{filename}"
    img.save(tmp, "JPEG", quality=82)
    if os.path.getsize(tmp)/1024 > 500:
        img.save(tmp, "JPEG", quality=65)
    with open(tmp, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    url = f"https://api.github.com/repos/{REPO}/contents/images/{filename}"
    sha = None
    try:
        req = urllib.request.Request(url, headers={"Authorization": f"token {TOKEN}"})
        with urllib.request.urlopen(req) as r: sha = json.loads(r.read()).get("sha")
    except urllib.error.HTTPError as e:
        if e.code != 404: raise
    payload = {"message": f"{'Update' if sha else 'Add'} {filename}", "content": b64}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"}, method="PUT")
    with urllib.request.urlopen(req) as r:
        print(f"✅ {filename}")
```

---

## 物件リスト（全24件・確定）

| # | 物件名 | 画像ファイル | 説明文 | 状態 |
|---|---|---|---|---|
| 01 | キャノピーbyヒルトン沖縄宮古島リゾート | hilton-okinawa-01〜08.jpg（7枚） | ✅ | 公開 |
| 02 | ザ・リッツカールトン東京 クラブレベルエントランス | ritz-entrance-01〜03.jpg（3枚） | ✅ | 公開 |
| 03 | ザ・リッツカールトン東京 最上階バー カウンターオブジェ | ritz-bar-counter-01〜02.jpg（2枚） | ✅ | 公開 |
| 04 | ザ・リッツカールトン東京 トップスイート 麻の葉文様 | ritz-suite-hemp-01〜03.jpg（3枚） | ✅ | 公開 |
| 05 | ルネッサンス台北士林ホテル Butterfly Wall Art | renaissance-taipei.jpg / renaissance-taipei-detail.jpg（2枚） | ✅ | 公開 |
| 06 | 秀〜京町堀〜 阿吽の宇宙 エントランス 光オブジェ | hide-entrance.jpg（1枚） | ✅ | 公開 |
| 07 | 秀〜京町堀〜 阿吽の宇宙 店内 和紙アートパネル | hide-interior.jpg（1枚） | ✅ | 公開 |
| 08 | シスメックス株式会社 本社 | sysmex_main.jpg / sysmex.jpg / sysmex_glass.jpg（3枚） | ✅ | 公開 |
| 09 | フィットネス トライアクシス OSAKA-BAY | triaxis.jpg（1枚） | ✅ | 公開 |
| 10 | ゆの里 お水の宿 アクアフォトミクス ガラスアート | yunosato.jpg（1枚） | ✅ | 公開 |
| 11 | パークタワー晴海 マンションギャラリー エントランス | park-tower-harumi-01〜05.jpg（5枚） | ✅ | 公開 |
| 12 | 三井不動産レジデンシャル 横浜北仲 ガラスオブジェ | mitsui-yokohama-photo.jpg / mitsui-yokohama-concept.jpg（2枚） | ✅ | 公開 |
| 13 | 三井不動産レジデンシャル パークコート JR芦屋駅前 | mitsui-parkcoat.jpg（1枚） | ✅ | 公開 |
| 14 | キンダーキッズ インターナショナルスクール 大阪ベイ | なし | ─ | **Coming Soon** |
| 15 | 親愛産婦人科 Life on the planet earth | shinai-obstetrics.jpg（1枚） | ✅ | 公開 |
| 16 | 大丸神戸店 クラフトガラス壁面アート | daimaru-kobe-01〜07.jpg（7枚） | ✅ | 公開 |
| 17 | 多可町生涯学習まちづくりプラザ Asmile | taka-town-01〜06.jpg（6枚） | ✅ | 公開 |
| 18 | リーガロイヤルリゾート沖縄（北谷）雲灯 | なし | ─ | **Coming Soon** |
| 19 | パナソニック日比谷 立礼茶室「得心軒」 | なし | ─ | **Coming Soon** |
| 20 | ホテル京阪 天満橋駅前 客室和紙オブジェ・壁面パネル | hotel-keihan-tenmabashi-01〜06.jpg（6枚） | ✅ | 公開 |
| 21 | 東急不動産 ブランズ西宮北口 エントランスロビー壁面アートガラス | branz-nishinomiya-kitaguchi.jpg（1枚） | ✅ | 公開 |
| 22 | プレサンス レジェンド 琵琶湖 エントランス＆モデルルーム | presance-legend-biwako-entrance.jpg / presance-legend-biwako-modelroom.jpg（2枚） | ✅ | 公開 |
| 23 | 株式会社プレナス 企業シンボル ガラスオブジェ | plenus-corporate-symbol.jpg（1枚） | ✅ | 公開 |
| 24 | マンション山崎 エントランス 強化ガラスサイン | mansion-yamazaki-entrance.jpg（1枚） | ✅ | 公開 |

---

## HPのデータ構造

index.html 内に `var PROJECTS = [...]` というJS配列で全24件を管理。

```js
// 各物件の構造
{
  "num": "01",
  "title": "キャノピーbyヒルトン<br>沖縄宮古島リゾート",
  "meta": "Hotel · 2026 · Miyakojima",
  "desc": "コンセプト説明文（HTML可）",
  "credit": "クレジット（HTML可）",
  "slides": ["images/hilton-okinawa-01.jpg", ...],
  // Coming Soonの場合のみ:
  "coming": true
}
```

**物件追加・更新時は必ずこの配列を直接編集してpushすること。**

---

## 追加予定物件

| 物件 | 状態 |
|---|---|
| 美濃和紙の里会館 ヤドリギアートとの展覧会 | 写真・年・詳細待ち |

---

## 未完了タスク

| 優先 | タスク |
|---|---|
| 🔴 高 | Coming Soon 3件（14/18/19）の写真・説明文 |
| 🟡 中 | Zenlogicサーバーへの本番デプロイ（tecnoform.jp） |
| 🟡 中 | 美濃和紙の里会館展覧会の情報収集・追加 |
| 🟢 低 | Instagram投稿カレンダー |
| 🟢 低 | 営業提案資料・トークスクリプト |

---

## 重要ルール（絶対守ること）

1. **画像が届いたら画像内テキストを直接読み取る**。「失念」は許されない
2. **画像アップロードとモーダルデータ更新は必ずセット**
3. **画像削除は必ずGitHub APIのDELETEで実施**（ファイル名変更時も旧ファイル削除）
4. **物件番号を変更した場合はPROJECTS配列のキーも必ず同時更新**
5. **毎回デプロイ後に全画像の実在チェック（404確認）を実施**
6. **CloudsAO風ミニマルデザインの方向性を維持**：過剰な動き・明滅禁止、画像はcontainで全体表示

---

## HPデザイン仕様（現行）

| 項目 | 内容 |
|---|---|
| スタイル | Refined Minimalist（CloudsAO風） |
| 背景色 | #0b0a09（深い墨色） |
| テキスト色 | #ece5d5（紙色）/ #b8a78a（paper-soft）/ #c9a875（金茶アクセント） |
| フォント | Noto Serif JP（和文）/ Cormorant Garamond（欧文セリフ）/ Inter（本文） |
| セクション順 | Hero → Works → About → Technology → Clients → Contact |
| Works表示 | 2列グリッド（モバイル1列）/ 全カード静止画 / タップでライトボックス |
| 画像表示 | object-fit: contain（切り抜きなし・全体表示） |
| ライトボックス | 黒背景・最大78vh・左右矢印・スワイプ・ESC対応 |
| スクロール表示 | IntersectionObserver で reveal アニメーション |

## 次チャットへの引き継ぎ（優先タスク）

1. **CloudsAO風レイアウトの完成度向上**（最優先）
   - のりあきさんが参照として提示。現状ある程度近いが、さらなる改善余地あり
   - 縦長・大型画像・過剰な動き禁止の方向性は確認済み

2. **Coming Soon 3件の解消**
   - 14: キンダーキッズ 大阪ベイ（写真待ち）
   - 18: リーガロイヤルリゾート沖縄 北谷 雲灯（写真待ち）
   - 19: パナソニック日比谷 立礼茶室「得心軒」（写真待ち）

3. **美濃和紙の里会館 展覧会**（ヤドリギアートとの共同作品）
   - 情報未確定：写真・年・共同/出展の別・テーマ

4. **tecnoform.jp への本番デプロイ**（Zenlogic / FileZilla）

5. **Instagram投稿カレンダー**

6. **営業提案資料**

## このチャットで発生した問題と教訓

- 画像内テキストを手動で読み取らず、後から対応した → **写真が届いたら即座に画像内テキストを読み取ること**
- 部分修正の積み重ねでHTMLが破綻 → **根本問題は全面書き直しで対処する**
- モーダルデータとカード番号のずれ → **物件削除・追加時はPROJECTS配列のキーを必ず同時更新**
- Netlify帯域超過で停止 → **GitHub Pages に移行済み・Netlifyは使用しない**

---

## キャッチコピー（確定）

| 用途 | コピー |
|---|---|
| **メインキャッチ（和文）** | 枠を解いて、揺らぎを纏う。 |
| **ヒーロー メインタイトル** | 光が宿り、素材が語りだす。 |
| **ヒーロー 英文サブ** | born from fire and water |

**ヒーロー3段構成（採用済み・現HTMLでは一部省略中）：**
```
光が宿り、
素材が語りだす。

born from fire and water

枠を解いて、揺らぎを纏う。
```

→ 次チャットで「光が宿り、素材が語りだす。」をヒーローに復活させること。

## 残タスク

- [ ] Clientsリストの誤字修正（パナスニック→パナソニック等）
- [ ] 残り物件の説明文生成（未着手分）
- [ ] Instagram投稿カレンダー
- [ ] 営業提案資料
- [ ] tecnoform.jp 本番デプロイ（Zenlogic/FileZilla）

## 2026年5月27日 作業ログ

### 画像更新・スライド追加
- **02 リッツカールトン クラブレベル**: 実物写真5枚追加（計9枚スライド）
- **03 リッツカールトン バーラウンジ**: ガラス×大理石オブジェ実物2枚追加（計3枚）
- **09 シスメックス**: ガラスパネル空間写真を2枚目に追加
- **12 パークタワー晴海**: 実物写真差し替え・部屋写真を末尾に移動
- **13 三井横浜北仲**: CG+実物+ガラスアップ 計4枚スライド
- **14 三井パークコート**: 建物外観・エントランス・実物など6枚スライド
- **30 美濃和紙展覧会**: 画像回転修正・クレジット更新

### データ変更
- **プレナス 21〜25番**: 5件を1件に統合（東京本社ガラスアートコレクション）
- **01 キャノピー沖縄**: キャッチコピー「宮古の風と水を、光に還す」に変更