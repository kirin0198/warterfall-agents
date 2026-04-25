// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMermaid from './src/remark-mermaid.mjs';

// ページ定義を一元管理する配列。
// ページ追加・変更時はここだけ編集すれば sidebar に反映される (SH-009, NI-003)。
// `items` を持つエントリはサイドバー上でグループとしてネストされる (#42)。
/** @typedef {{ slug: string; labelEn: string; labelJa: string }} LeafPage */
/** @typedef {{ groupEn: string; groupJa: string; items: LeafPage[] }} PageGroup */
/** @type {(LeafPage | PageGroup)[]} */
const PAGES = [
	{ slug: 'home',             labelEn: 'Overview',          labelJa: '概要'                   },
	{ slug: 'getting-started',  labelEn: 'Getting Started',   labelJa: 'はじめる'               },
	{
		groupEn: 'Architecture',
		groupJa: 'アーキテクチャ',
		items: [
			{ slug: 'architecture-domain-model',      labelEn: 'Domain Model',       labelJa: 'ドメインモデル' },
			{ slug: 'architecture-protocols',         labelEn: 'Protocols',          labelJa: 'プロトコル'     },
			{ slug: 'architecture-operational-rules', labelEn: 'Operational Rules', labelJa: '運用ルール'     },
		],
	},
	{ slug: 'triage-system',    labelEn: 'Triage System',     labelJa: 'トリアージシステム'     },
	{
		groupEn: 'Agents Reference',
		groupJa: 'エージェントリファレンス',
		items: [
			{ slug: 'agents-orchestrators', labelEn: 'Orchestrators & Cross-Cutting', labelJa: 'オーケストレーター・横断系' },
			{ slug: 'agents-discovery',     labelEn: 'Discovery Domain',              labelJa: 'Discovery ドメイン'         },
			{ slug: 'agents-delivery',      labelEn: 'Delivery Domain',               labelJa: 'Delivery ドメイン'          },
			{ slug: 'agents-operations',    labelEn: 'Operations Domain',             labelJa: 'Operations ドメイン'        },
			{ slug: 'agents-maintenance',   labelEn: 'Maintenance Domain',            labelJa: 'Maintenance ドメイン'       },
		],
	},
	{ slug: 'rules-reference',  labelEn: 'Rules Reference',   labelJa: 'ルールリファレンス'     },
	{ slug: 'contributing',     labelEn: 'Contributing',      labelJa: 'コントリビューション'   },
];

// PAGES から Starlight sidebar エントリを生成する。
// translations に en/ja 両言語を含めることで英日ラベルの対称性を保証する (NI-003)。
const toLeaf = ({ slug, labelEn, labelJa }) => ({
	label: labelEn,
	link: slug,
	translations: { en: labelEn, ja: labelJa },
});
const sidebar = PAGES.map((entry) => {
	if ('items' in entry) {
		return {
			label: entry.groupEn,
			translations: { en: entry.groupEn, ja: entry.groupJa },
			items: entry.items.map(toLeaf),
		};
	}
	return toLeaf(entry);
});

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [remarkMermaid],
	},
	// サイトルート `/` は言語切替をサポートするため各ロケールの splash に委譲する。
	// `/en` と `/ja` は Starlight が各ロケールの index.mdx を splash として配信する。
	// 言語スイッチャーは同一スラッグのペア (`/en/` ↔ `/ja/`) 上でのみ機能する。
	redirects: {
		'/': '/en/',
	},
	integrations: [
		starlight({
			title: 'Aphelion',
			logo: {
				src: './src/assets/logo.png',
			},
			customCss: ['./src/styles/custom.css'],
			// mermaid 初期化は src/components/Head.astro で npm バンドルを使用。
			// CDN 依存 (jsdelivr.net) と SRI なし読み込みを排除し、securityLevel を strict に変更。
			components: {
				Head: './src/components/Head.astro',
			},
			locales: {
				en: {
					label: 'English',
					lang: 'en',
				},
				ja: {
					label: '日本語',
					lang: 'ja',
				},
			},
			defaultLocale: 'en',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/kirin0198/aphelion-agents' }],
			sidebar,
		}),
	],
});
