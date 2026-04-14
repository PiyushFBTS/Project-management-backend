import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

const documentStorage = diskStorage({
  destination: './uploads/project-documents',
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const documentFileFilter = (_req: any, file: any, cb: any) => {
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|webp|txt|csv)$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

@ApiTags('Projects')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects (paginated, filterable)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterProjectDto) {
    return this.projectsService.findAll(companyId, filter);
  }

  // ── Project Types ──
  @Get('types/list')
  @ApiOperation({ summary: 'List all project types for this company' })
  getProjectTypes(@TenantId() companyId: number) {
    return this.projectsService.getProjectTypes(companyId);
  }

  @Post('types')
  @ApiOperation({ summary: 'Create a new project type' })
  createProjectType(
    @TenantId() companyId: number,
    @Body() dto: { value: string; label: string; description?: string },
  ) {
    return this.projectsService.createProjectType(companyId, dto);
  }

  @Delete('types/:typeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project type' })
  deleteProjectType(@TenantId() companyId: number, @Param('typeId', ParseIntPipe) typeId: number) {
    return this.projectsService.deleteProjectType(companyId, typeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@TenantId() companyId: number, @Body() dto: CreateProjectDto, @CurrentUser('id') adminId: number) {
    return this.projectsService.create(companyId, dto, adminId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a project' })
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id, companyId);
  }

  @Get(':id/employees')
  @ApiOperation({ summary: 'List employees assigned to a project' })
  getEmployees(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getEmployees(id, companyId);
  }

  @Get('managers/list')
  @ApiOperation({ summary: 'List company admins available as project managers' })
  getManagers(@TenantId() companyId: number) {
    return this.projectsService.getManagers(companyId);
  }

  // ── Documents ──
  @Get(':id/documents')
  @ApiOperation({ summary: 'List project documents' })
  getDocuments(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.projectsService.getDocuments(id, companyId);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a project document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: documentStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: documentFileFilter,
    }),
  )
  uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @CurrentUser('name') adminName: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    return this.projectsService.uploadDocument(id, companyId, file, adminName ?? 'Admin', category);
  }

  @Delete(':id/documents/:docId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project document' })
  deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @TenantId() companyId: number,
  ) {
    return this.projectsService.deleteDocument(id, docId, companyId);
  }

  // ── Client Users ──
  @Get(':id/clients')
  @ApiOperation({ summary: 'List client users for a project' })
  getClients(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.projectsService.getClients(id, companyId);
  }

  @Post(':id/clients')
  @ApiOperation({ summary: 'Add a client user to a project' })
  createClient(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @Body() dto: CreateClientDto,
  ) {
    return this.projectsService.createClient(id, companyId, dto);
  }

  @Delete(':id/clients/:clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a client user from a project' })
  deleteClient(
    @Param('id', ParseIntPipe) id: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @TenantId() companyId: number,
  ) {
    return this.projectsService.deleteClient(id, clientId, companyId);
  }

  @Patch(':id/clients/:clientId/toggle-active')
  @ApiOperation({ summary: 'Enable or disable client login' })
  toggleClientActive(
    @Param('id', ParseIntPipe) id: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @TenantId() companyId: number,
    @Body() dto: { isActive: boolean },
  ) {
    return this.projectsService.toggleClientActive(id, clientId, companyId, dto.isActive);
  }

  @Patch(':id/clients/:clientId/password')
  @ApiOperation({ summary: 'Change client password' })
  changeClientPassword(
    @Param('id', ParseIntPipe) id: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @TenantId() companyId: number,
    @Body() dto: { password: string },
  ) {
    return this.projectsService.changeClientPassword(id, clientId, companyId, dto.password);
  }

  // ── Milestones ──
  @Get(':id/milestones')
  @ApiOperation({ summary: 'List milestones for a project' })
  getMilestones(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.projectsService.getMilestones(id, companyId);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Create a milestone' })
  createMilestone(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @Body() dto: { name: string; expectedPercentage: number; expectedAmount: number; receivedPercentage?: number; receivedAmount?: number },
  ) {
    return this.projectsService.createMilestone(id, companyId, dto);
  }

  @Post(':id/milestones/bulk')
  @ApiOperation({ summary: 'Bulk create milestones' })
  bulkCreateMilestones(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @Body() body: { milestones: Array<{ name: string; expectedPercentage: number; expectedAmount: number; receivedPercentage?: number; receivedAmount?: number }> },
  ) {
    return this.projectsService.bulkCreateMilestones(id, companyId, body.milestones);
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update a milestone' })
  updateMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @TenantId() companyId: number,
    @Body() dto: { name?: string; expectedPercentage?: number; expectedAmount?: number; receivedPercentage?: number; receivedAmount?: number },
  ) {
    return this.projectsService.updateMilestone(id, milestoneId, companyId, dto);
  }

  @Delete(':id/milestones/:milestoneId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a milestone' })
  deleteMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Param('milestoneId', ParseIntPipe) milestoneId: number,
    @TenantId() companyId: number,
  ) {
    return this.projectsService.deleteMilestone(id, milestoneId, companyId);
  }
}

// ── Employee read-only endpoints: /api/employee/projects ──────────────────

@ApiTags('Employee — Projects')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/projects')
export class EmployeeProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (all for HR, own-ticket projects for others)' })
  findAll(
    @TenantId() companyId: number,
    @CurrentUser('id') employeeId: number,
    @CurrentUser('isHr') isHr: boolean,
  ) {
    if (isHr) {
      return this.projectsService.findAll(companyId, { limit: 500 } as any);
    }
    return this.projectsService.findByEmployeeTickets(companyId, employeeId);
  }

  @Get('all-active')
  @ApiOperation({ summary: 'List all active projects (for task sheet dropdowns)' })
  findAllActive(@TenantId() companyId: number) {
    return this.projectsService.findAll(companyId, { status: 'active', limit: 200 } as any);
  }

  @Get(':id/clients')
  @ApiOperation({ summary: 'List client users for a project (employee access)' })
  getProjectClients(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.projectsService.getClients(id, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
  ) {
    return this.projectsService.findOne(id, companyId);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'List project documents' })
  getDocuments(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.projectsService.getDocuments(id, companyId);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a project document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: documentStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: documentFileFilter,
    }),
  )
  uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @CurrentUser('empName') empName: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    return this.projectsService.uploadDocument(id, companyId, file, empName ?? 'Employee', category);
  }

  @Delete(':id/documents/:docId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project document' })
  deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @TenantId() companyId: number,
  ) {
    return this.projectsService.deleteDocument(id, docId, companyId);
  }
}
