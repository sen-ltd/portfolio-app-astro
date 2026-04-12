# portfolio-app-astro

[![Demo](https://img.shields.io/badge/demo-sen.ltd%2Fportfolio%2Fportfolio--app--astro%2F-7cc4ff)](https://sen.ltd/portfolio/portfolio-app-astro/)

SEN Portfolio ブラウザの **Astro 実装**。Islands Architecture により JS をゼロから始め、必要最小限の vanilla-TS クライアントバンドルだけでインタラクティブ機能を実現した、比較シリーズ第 8 弾。

**Live demo**: https://sen.ltd/portfolio/portfolio-app-astro/

## バンドルサイズ比較（更新）

| 実装 | main JS | gzip | 対 React |
|---|---|---|---|
| React 18 (021) | 151.01 kB | 48.84 kB | — |
| Vue 3 (022) | 73.65 kB | 28.76 kB | −41% |
| Svelte 5 (023) | 49.78 kB | 18.92 kB | −61% |
| SolidJS (024) | 21.97 kB | 8.33 kB | −83% |
| Nuxt 3 (025) | — | 52.01 kB | +6% |
| SvelteKit (026) | — | 32.50 kB | −33% |
| Qwik City (027) | — | 28.60 kB★ | −41% |
| **Astro 5 (028)** | **8.53 kB** | **3.17 kB** | **−94%** |

★ Qwik は初回ペイント時の同期 JS のみ（全チャンク合計は 44.92 kB gzip）。

Astro が **新記録を更新**しました。Solid の 8.33 kB gzip を大きく下回る **3.17 kB gzip** を達成。理由は明確：フレームワークランタイムが一切含まれていないからです。

## 共通コード

`src/types.ts`, `src/filter.ts`, `src/data.ts`, `src/style.css`, `tests/filter.test.ts` は他の実装と byte-identical。差分は `src/pages/index.astro`、`src/client.ts`、`src/i18n.ts`（framework 名のみ差分）。

## Astro 独自のポイント

### Islands Architecture：ゼロ JS デフォルト

Astro の最大の特徴は **「JS を使わないことがデフォルト」** という設計哲学です。通常の Astro ページでは HTML だけが配信され、JS は一切含まれません。インタラクティブな要素が必要な部分だけを「island（島）」として指定し、そこにだけ JS を注入します。このアプローチにより、静的なコンテンツ（ヘッダー・フッター・静的テキスト等）のレンダリングコストがゼロになります。

本実装では `src/pages/index.astro` の `<script>` タグが唯一の island です。Astro は Vite でこの `<script>` を独立したバンドルとしてコンパイルし、ページに `<script type="module">` として注入します。HTML/CSS のシェル自体には JS が含まれず、クライアント側のインタラクション（フィルター・ソート・検索）だけが JS バンドルとして届きます。

### フレームワークランタイムゼロ

React・Vue・Solid・Svelte はいずれもランタイムライブラリをバンドルに含めます（最小の Solid でも 8.33 kB gzip）。Astro の island に vanilla TypeScript を使った本実装では、**フレームワークランタイムがゼロ**です。バンドルの中身はアプリケーションロジックそのもの（`client.ts` + 共有ユーティリティ）だけです。このため 3.17 kB gzip という記録的な小ささを実現しています。

### 手書き DOM vs コンポーネントフレームワーク

この設計の代償として、UI ロジックは vanilla TS で手書きです（`src/client.ts`）。React/Solid の JSX や Vue の SFC のような宣言的 UI ではなく、`document.createElement` / `element.appendChild` を直接使って DOM を構築します。状態が変わるたびに `render()` 関数が `#app` の中身を全再構築するため、大規模アプリには適しません。ただし本ポートフォリオブラウザ程度の規模では十分実用的であり、フレームワークランタイムなしに同等の機能を実現できることを示しています。

Astro は React・Solid・Preact などの UI フレームワークを island として組み込む統合も公式でサポートしています（`client:load` ディレクティブ）。今回あえて vanilla TS を選んだのは、「Islands Architecture の極北」として最小バンドルサイズを測定するためです。

### SSG + ランタイムフェッチ

Astro はデフォルトで Static Site Generation (SSG) を行います。本実装ではビルド時にデータを取得せず、クライアントが `sen.ltd/portfolio/data.json` を **ランタイムで fetch** します。理由は、デプロイ済みの `data.json` が常に最新であり、Astro アプリの再ビルドなしにエントリを追加できるためです（シリーズ他実装と同じ設計方針）。

## ローカル起動

```sh
npm install
npm run dev
# → http://localhost:4321/portfolio/portfolio-app-astro/
```

開発時は `astro.config.mjs` の Vite ミドルウェアが `../../data/entries.json` を `/data.json` として serve します。

## テスト

```sh
npm test
```

14 vitest ケース（共有の `filter.ts` を node environment で実行）。

## ライセンス

MIT. See [LICENSE](./LICENSE).

---

Part of the [SEN portfolio series](https://sen.ltd/portfolio/). Entry 028.

<!-- sen-publish:links -->
## Links

- 🌐 Demo: https://sen.ltd/portfolio/portfolio-app-astro/
- 📝 dev.to: https://dev.to/sendotltd/astro-port-317-kb-gzip-94-vs-react-new-series-record-because-the-framework-runtime-is-5f09
<!-- /sen-publish:links -->
