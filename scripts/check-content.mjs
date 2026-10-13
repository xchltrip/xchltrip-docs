import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

const DOCS = 'src/content/docs';
const IMAGES = 'public/images/manual';
const MAX_IMAGE_BYTES = 1024 * 1024;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.mdx?$/;
const errors = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

for (const file of walk(DOCS).filter((f) => /\.mdx?$/.test(f))) {
  const rel = relative(DOCS, file);
  const name = rel.split('/').pop();
  if (!NAME_RE.test(name)) errors.push(`${rel}: 文件名只能用小写英文、数字和连字符`);

  const { data, content } = matter(readFileSync(file, 'utf8'));
  if (!data.title) errors.push(`${rel}: 缺少 title`);

  const prose = content.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '');
  for (const m of prose.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    if (!/^(\/images\/manual\/|https?:\/\/)/.test(m[1])) {
      errors.push(`${rel}: 图片路径 ${m[1]} 必须以 /images/manual/ 开头`);
    }
  }
  for (const m of prose.matchAll(/!\[([^\]]*)\]\((\/images\/manual\/[^)\s]+)\)/g)) {
    if (!m[1].trim()) errors.push(`${rel}: 图片 ${m[2]} 缺少替代文本`);
    if (!existsSync(join('public', m[2]))) errors.push(`${rel}: 图片不存在 ${m[2]}`);
  }
}

for (const img of walk(IMAGES).filter((f) => !f.endsWith('.gitkeep'))) {
  if (statSync(img).size > MAX_IMAGE_BYTES) errors.push(`${img}: 超过 1MB，请压缩后重新上传`);
}

if (errors.length) {
  console.error(`内容校验失败（${errors.length} 项）：\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log('内容校验通过');