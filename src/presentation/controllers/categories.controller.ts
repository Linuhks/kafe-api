import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CreateCategoryUseCase } from '../../application/use-cases/menu/create-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/menu/delete-category.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/menu/get-category.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/menu/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/menu/update-category.use-case';
import { Category } from '../../domain/entities/category.entity';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CreateCategoryDto } from '../dtos/menu/create-category.dto';
import { UpdateCategoryDto } from '../dtos/menu/update-category.dto';
import { CategoryResponseDto } from '../dtos/responses/category.response.dto';
import { PaginationDto } from '../dtos/shared/pagination.dto';

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
  @ApiPaginatedResponse(CategoryResponseDto)
  async list(@Query() query: PaginationDto): Promise<{
    data: Category[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
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
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async getOne(@Param('id') id: string): Promise<Category> {
    return this.getCategory.execute(id);
  }

  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Cria categoria (ADMIN)' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.createCategory.execute(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Atualiza categoria (ADMIN)' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<Category> {
    return this.updateCategory.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Remove categoria (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Categoria removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteCategory.execute(id);
  }
}
