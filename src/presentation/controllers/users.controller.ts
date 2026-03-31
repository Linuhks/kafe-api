import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case.js';
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case.js';
import { GetUserUseCase } from '../../application/use-cases/users/get-user.use-case.js';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case.js';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case.js';
import { PaginationDto } from '../dtos/shared/pagination.dto.js';
import { CreateUserDto } from '../dtos/users/create-user.dto.js';
import { UpdateUserDto } from '../dtos/users/update-user.dto.js';

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
  async list(@Query() query: PaginationDto) {
    const result = await this.listUsers.execute(query);
    return { data: result.data, pagination: { page: query.page, limit: query.limit, total: result.total, totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca usuário por ID (ADMIN)' })
  async getOne(@Param('id') id: string) {
    return this.getUser.execute(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Cria novo usuário (ADMIN)' })
  async create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza usuário (ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUser.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove usuário (ADMIN)' })
  async remove(@Param('id') id: string) {
    await this.deleteUser.execute(id);
  }
}
