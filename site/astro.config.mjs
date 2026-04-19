// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Aphelion',
			logo: {
				src: './src/assets/logo.png',
			},
			customCss: ['./src/styles/custom.css'],
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
			sidebar: [
				{
					label: 'Overview',
					link: '/en/home/',
					translations: { ja: '概要' },
				},
				{
					label: 'Getting Started',
					link: '/en/getting-started/',
					translations: { ja: 'はじめる' },
				},
				{
					label: 'Architecture',
					link: '/en/architecture/',
					translations: { ja: 'アーキテクチャ' },
				},
				{
					label: 'Triage System',
					link: '/en/triage-system/',
					translations: { ja: 'トリアージシステム' },
				},
				{
					label: 'Agents Reference',
					link: '/en/agents-reference/',
					translations: { ja: 'エージェントリファレンス' },
				},
				{
					label: 'Rules Reference',
					link: '/en/rules-reference/',
					translations: { ja: 'ルールリファレンス' },
				},
				{
					label: 'Platform Guide',
					link: '/en/platform-guide/',
					translations: { ja: 'プラットフォームガイド' },
				},
				{
					label: 'Contributing',
					link: '/en/contributing/',
					translations: { ja: 'コントリビューション' },
				},
			],
		}),
	],
});
