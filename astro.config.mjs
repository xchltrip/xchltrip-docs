import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import { remarkHeadingId } from 'remark-custom-heading-id';
import { unified } from '@astrojs/markdown-remark';

const isPreview = process.env.PUBLIC_ENV === 'preview';
const buildSha = process.env.PUBLIC_BUILD_SHA ?? 'local';

export default defineConfig({
  site: isPreview ? 'https://docs-preview.xchltrip.com' : 'https://docs.xchltrip.com',
  trailingSlash: 'always',
  server: { host: true },
  markdown: { processor: unified({ remarkPlugins: [remarkHeadingId] }) },
  integrations: [
    starlight({
      title: '小草互联文档中心',
      locales: { root: { label: '简体中文', lang: 'zh-CN' } },
      lastUpdated: true,
      plugins: [starlightLinksValidator()],
      head: [
        { tag: 'meta', attrs: { name: 'build-sha', content: buildSha } },
        ...(isPreview ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' } }] : []),
      ],
      components: isPreview ? { Banner: './src/components/PreviewBanner.astro' } : {},
      sidebar: [
        { label: '快速入门', items: [{ autogenerate: { directory: 'manual/getting-started' } }] },
        { label: '酒店查询', items: [{ autogenerate: { directory: 'manual/hotel-search' } }] },
        { label: '询价报价', items: [{ autogenerate: { directory: 'manual/quotation' } }] },
        { label: '订单管理', items: [{ autogenerate: { directory: 'manual/orders' } }] },      ],
    }),
  ],
});