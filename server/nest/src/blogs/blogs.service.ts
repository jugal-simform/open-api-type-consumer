import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BlogDto, CreateBlogDto, UpdateBlogDto } from './blog.dto';

const DATA_FILE = join(process.cwd(), 'data', 'blogs.json');

@Injectable()
export class BlogsService {
  private async readBlogs(): Promise<BlogDto[]> {
    const raw = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as BlogDto[];
  }

  private async writeBlogs(blogs: BlogDto[]): Promise<void> {
    await writeFile(DATA_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
  }

  async findAll(): Promise<BlogDto[]> {
    return this.readBlogs();
  }

  async findOne(id: string): Promise<BlogDto> {
    const blogs = await this.readBlogs();
    const blog = blogs.find((b) => b.id === id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  async create(input: CreateBlogDto): Promise<BlogDto> {
    const blogs = await this.readBlogs();
    const blog: BlogDto = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    blogs.push(blog);
    await this.writeBlogs(blogs);
    return blog;
  }

  async update(id: string, input: UpdateBlogDto): Promise<BlogDto> {
    const blogs = await this.readBlogs();
    const index = blogs.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new NotFoundException('Blog not found');
    }
    const updated = { ...blogs[index], ...input };
    blogs[index] = updated;
    await this.writeBlogs(blogs);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const blogs = await this.readBlogs();
    const index = blogs.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new NotFoundException('Blog not found');
    }
    blogs.splice(index, 1);
    await this.writeBlogs(blogs);
  }
}
