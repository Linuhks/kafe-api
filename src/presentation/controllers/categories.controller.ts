import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { CreateCategoryUseCase } from '../../application/use-cases/menu/create-category.use-case.js';
import type { DeleteCategoryUseCase } from '../../application/use-cases/menu/delete-category.use-case.js';
import type { GetCategoryUseCase } from '../../application/use-cases/menu/get-category.use-case.js';
import type { ListCategoriesUseCase } from '../../application/use-cases/menu/list-categories.use-case.js';
import type { UpdateCategoryUseCase } from '../../application/use-cases/menu/update-category.use-case.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { CreateCategoryDto } from '../dtos/menu/create-category.dto.js';
import type { UpdateCategoryDto } from '../dtos/menu/update-category.dto.js';
import type { PaginationDto } from '../dtos/shared/pagination.dto.js';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Lista categorias (público)' })
  async list(@Query() query: PaginationDto) {
    const result = await this.listCategories.execute(query);
    return {
      data: result.data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  @Get(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Busca categoria por ID (público)' })
  async getOne(@Param('id') id: string) {
    return this.getCategory.execute(id);
  }

  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Cria categoria (ADMIN)' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.createCategory.execute(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Atualiza categoria (ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.updateCategory.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Remove categoria (ADMIN)' })
  async remove(@Param('id') id: string) {
    await this.deleteCategory.execute(id);
  }
}
