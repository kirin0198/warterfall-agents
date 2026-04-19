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
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
			],
		}),
	],
});
