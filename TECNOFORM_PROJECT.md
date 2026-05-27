# atelier TECNOFORM HP プロジェクト指示書

最終更新：2026年5月27日

---

## 基本情報

- 代表：江藤徳晃（のりあきさん）
- サイト：tecnoform.jp / info@tecnoform.jp
- キャッチコピー：「枠を解いて、揺らぎを纏う。」
- 正式英文社名：atelier TECNOFORM Inc;（連結表記・セミコロン）
- 通常表記：atelier TECNOFORM（atelierは小文字固定・CSSでuppercase変換しない）

---

## 公開中のHP

- **本番URL**: https://noriaki-eto.github.io/tecnoform-website/
- GitHub: Noriaki-Eto/tecnoform-website
- トークン: ghp_****（Claudeのメモリ内に保存済み）
- GitHub連携済み・自動デプロイ済み
- ※Netlify（stellular-clafoutis-e0a6ca.netlify.app）は帯域オーバーで停止。無視してOK
- ※本番ドメイン tecnoform.jp（Zenlogic/FileZilla）への移行は保留中

---

## サイト現状（2026年5月27日）

- **構成**：30件公開 ＋ Coming Soon 3件（X1〜X3、SHOW_COMING=false で非表示中）
- **番号体系**：01〜21、26〜31（22〜25は欠番）

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
from PIL import Image

TOKEN = "ghp_****（Claudeのメモリ内に保存済み）"
REPO = "Noriaki-Eto/tecnoform-website"

def upload_image(local_path, filename):
    img = Image.open(local_path)
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
- [ ] tecnoform.jp 本番デプロイ（Zenlogic / FileZilla）

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
