# atelier TECNOFORM HP プロジェクト指示書

最終更新：2026年5月27日

---

## 基本情報

- 代表：江藤徳晃（のりあきさん）
- サイト（確定）：atelier-tecnoform.com（DNS稼働中・GitHub Pages配信） ／ メール：info@tecnoform.jp（別ドメイン運用）
- キャッチコピー：「枠を解いて、揺らぎを纏う。」
- 正式英文社名：atelier TECNOFORM Inc;（連結表記・セミコロン）
- 通常表記：atelier TECNOFORM（atelierは小文字固定・CSSでuppercase変換しない）

---

## 公開中のHP

- **本番URL（確定）**: https://atelier-tecnoform.com/ ／ 予備: https://noriaki-eto.github.io/tecnoform-website/
- GitHub: Noriaki-Eto/tecnoform-website
- トークン: ghp_****（Claudeのメモリ内に保存済み）
- GitHub連携済み・自動デプロイ済み
- ※Netlify（stellular-clafoutis-e0a6ca.netlify.app）は帯域オーバーで停止。無視してOK
- ※公開ドメインは atelier-tecnoform.com で確定（GitHub Pages・DNS稼働）。Zenlogic移行は不要

---

## サイト現状（2026年5月27日）

- **構成**：26件公開（展覧会2件＝#30 美濃和紙の里・#22 六甲山「和紙 伝統と未来」展2021 を含む）＋ Coming Soon 2件（X2・X3）
- **番号体系**：01〜22、26〜31（23〜25は欠番／22は六甲山展で使用済み）

### 写真ゼロ（Coming Soon・最優先）

| # | 物件名 |
|---|---|
| X1 | キンダーキッズ インターナショナルスクール 大阪ベイ |
| X2 | リーガロイヤルリゾート沖縄（北谷）雲灯 |
| X3 | パナソニック日比谷 立礼茶室「得心軒」 |

### 写真1枚のみ（追加あると◎）

| # | 物件名 |
|---|---|
| 05 | リッツカールトン東京 クラブスイート 麻の葉文様 |
| 07 | HIDE 京町堀 エントランス |
| 08 | HIDE 京町堀 店内 |
| 10 | トライアクシス OSAKA-BAY |
| 11 | ゆの里 お水の宿 |
| 15 | 親愛産婦人科 廊下壁面 |
| 19 | ブランズ西宮北口 |
| 26 | 邸宅エントランス（涼樹園プロデュース）|
| 27 | 板倉レディースクリニック |
| 28 | DAIKIN鳥取 研修所 |
| 29 | iikids 大阪弁天町 |
| 31 | シスメックス ソリューションセンター |

---

## 画像アップロードルール（最重要）

のりあきさんから写真が届いたら：

1. 「これは○○の写真です」の説明を確認
2. 適切なファイル名で images/ フォルダにすぐGitHubアップロード
3. 確認・質問は最小限。手動作業を求めない

### ファイル命名規則

既存ファイル名に合わせて `物件名-連番.jpg` 形式。例：
- `kinderkids-osaka-bay-01.jpg`
- `rihga-kumo-01.jpg`
- `panasonic-hibiya-01.jpg`

### アップロードコード

```python
import base64, json, urllib.request
from PIL import Image, ImageOps

TOKEN = "ghp_****（Claudeのメモリ内に保存済み）"
REPO = "Noriaki-Eto/tecnoform-website"

def upload_image(local_path, filename):
    img = Image.open(local_path)
    img = ImageOps.exif_transpose(img)   # iPhone縦写真の回転補正（必須・これが無いと横倒しになる）
    if img.mode != "RGB":
        img = img.convert("RGB")
    w, h = img.size
    if w > 1600:
        img = img.resize((1600, int(h * 1600 / w)), Image.LANCZOS)
    img.save(f"/tmp/{filename}", "JPEG", quality=82)
    
    with open(f"/tmp/{filename}", "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    
    # 既存ファイルのSHAを取得（更新の場合）
    sha = None
    try:
        check = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/contents/images/{filename}",
            headers={"Authorization": f"token {TOKEN}"}
        )
        with urllib.request.urlopen(check) as r:
            sha = json.loads(r.read())["sha"]
    except:
        pass
    
    payload = {"message": f"Add {filename}", "content": b64}
    if sha:
        payload["sha"] = sha
    
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/images/{filename}",
        data=data,
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        print(f"{filename}: OK")
```

---

## 残タスク（優先順）

- [ ] X1〜X3 の写真を入手してGitHubアップロード → Coming Soon を公開状態に
- [ ] 1枚物件への写真追加（上記12件）
- [ ] Clientsリストの誤字修正（パナスニック→パナソニック等）
- [ ] 残り16件の物件説明文生成
- [ ] Instagram投稿カレンダー
- [ ] 営業提案資料
- [x] 公開ドメイン確定：atelier-tecnoform.com（GitHub Pages・DNS稼働済み）

---

## Google Drive フォルダID（参考）

| フォルダ | ID |
|---|---|
| メインルート | 10D96RgrJLWJ_Q3zGfNGyJpcrEyDbGDYe |
| images/ | 11H2Q4rUuAC2ebhmFoH_A-2blu_yZbM3U |
| 物件データ | 1dlc_8KXiC3M_L9G2SRkfn0jlBOOGK2X4 |
| ニュース | 1htHnSVvGoDTj5Np6cYkv7Du19FpYNvCt |
| 本番HTML | 1fJIVbEo_N_vzKk2GZSfkjRoPIA2Wm-Tj |
| Sysmex サブフォルダ | 1OONNOUQJsPlvZaV_EL5uEeeCXRkw4GJL |

---

## HP戦略（2026年5月28日 確定）

### HPの役割定義

**「発注者が江藤さんを指名する前に、裏で確認する場所」**

- 集客ツールではなく、**信頼の証明装置**
- 受注の本線は設計事務所・内装業者経由（B2B2B）。それはHPの仕事ではない
- **SEOや集客力強化の方向には走らないこと**

### ターゲット

設計事務所・内装業者・施設オーナー。  
「この作家は本物か」を確認するためにHPを見る。

### 発注者が見るのは2点だけ

1. **実績**（リッツ・カールトン、三井不動産等の固有名詞）
2. **「この人にしか作れないもの」**（Mebius / 和紙×光の独自性）

### 要素優先度

| 要素 | 役割 | 優先度 |
|---|---|---|
| WORKS（実績） | リッツ等＝信頼の証明 | **最優先** |
| ウェルネス空間の文脈 | 体験を売る空間を作れる作家だと示す | 高 |
| Mebius（和紙×光） | 独自性＝指名理由 | 高 |
| CONCEPT/思想 | ヘラルボニー型の物語 | 中 |

### 改善指針

- WORKSの各物件に発注者名・施設名を明示（リッツ・カールトン、三井不動産など）
- ウェルネス/温浴/くつろぎ空間の実績は「体験を売る空間」の文脈が伝わる説明を添える
- CONTACT動線：設計事務所・内装業者が「組みたい」と思った瞬間に迷わず連絡できる導線
- 「一般消費者向けの美しいサイト」ではなく「プロが10秒で信頼できると判断するサイト」
