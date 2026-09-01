import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { BlogDto, CreateBlogDto, UpdateBlogDto } from './blog.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOkResponse({ type: BlogDto, isArray: true })
  findAll(): Promise<BlogDto[]> {
    return this.blogsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: BlogDto })
  findOne(@Param('id') id: string): Promise<BlogDto> {
    return this.blogsService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ type: BlogDto })
  create(@Body() body: CreateBlogDto): Promise<BlogDto> {
    return this.blogsService.create(body);
  }

  @Put(':id')
  @ApiOkResponse({ type: BlogDto })
  update(@Param('id') id: string, @Body() body: UpdateBlogDto): Promise<BlogDto> {
    return this.blogsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.blogsService.remove(id);
  }
}
