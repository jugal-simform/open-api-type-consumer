import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA_FILE = fileURLToPath(new URL('../data/blogs.json', import.meta.url));

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export type CreateBlogInput = Pick<Blog, 'title' | 'content' | 'author'>;
export type UpdateBlogInput = Partial<CreateBlogInput>;

async function readBlogs(): Promise<Blog[]> {
  const raw = await readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as Blog[];
}

async function writeBlogs(blogs: Blog[]): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
}

export async function listBlogs(): Promise<Blog[]> {
  return readBlogs();
}

export async function getBlog(id: string): Promise<Blog | undefined> {
  const blogs = await readBlogs();
  return blogs.find((blog) => blog.id === id);
}

export async function addBlog(input: CreateBlogInput): Promise<Blog> {
  const blogs = await readBlogs();
  const blog: Blog = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  blogs.push(blog);
  await writeBlogs(blogs);
  return blog;
}

export async function updateBlog(id: string, input: UpdateBlogInput): Promise<Blog | undefined> {
  const blogs = await readBlogs();
  const index = blogs.findIndex((blog) => blog.id === id);
  if (index === -1) {
    return undefined;
  }
  const updated = { ...blogs[index], ...input };
  blogs[index] = updated;
  await writeBlogs(blogs);
  return updated;
}

export async function deleteBlog(id: string): Promise<boolean> {
  const blogs = await readBlogs();
  const index = blogs.findIndex((blog) => blog.id === id);
  if (index === -1) {
    return false;
  }
  blogs.splice(index, 1);
  await writeBlogs(blogs);
  return true;
}
