import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Audit')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() filter: QueryFilterDto) {
    return this.auditService.findAll(filter);
  }

  @Get('entity/:type/:id')
  findByEntity(@Param('type') type: string, @Param('id') id: string) {
    return this.auditService.findByEntity(type, id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Query() filter: QueryFilterDto) {
    return this.auditService.findByUser(userId, filter);
  }
}
