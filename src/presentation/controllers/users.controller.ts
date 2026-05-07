import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/users/get-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { User } from '../../domain/entities/user.entity';
import { Roles } from '../decorators/roles.decorator';
import { UserResponseDto } from '../dtos/responses/user.response.dto';
import { PaginationDto } from '../dtos/shared/pagination.dto';
import { CreateUserDto } from '../dtos/users/create-user.dto';
import { UpdateUserDto } from '../dtos/users/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Roles(['ADMIN'])
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários (ADMIN)' })
  @ApiExtraModels(UserResponseDto)
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(UserResponseDto) } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async list(@Query() query: PaginationDto): Promise<{
    data: User[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.listUsers.execute(query);
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
  @ApiOperation({ summary: 'Busca usuário por ID (ADMIN)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async getOne(@Param('id') id: string): Promise<User> {
    return this.getUser.execute(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Cria novo usuário (ADMIN)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.createUser.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza usuário (ADMIN)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.updateUser.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove usuário (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUser.execute(id);
  }
}
