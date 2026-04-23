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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { UpdateCompanyAdminDto } from './dto/update-company-admin.dto';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@ApiTags('Platform — Companies')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard, SuperAdminGuard)
@Controller('platform')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // ── Company CRUD ──────────────────────────────────────────────────────────

  @Post('companies')
  @ApiOperation({ summary: 'Create a new company' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get('companies')
  @ApiOperation({ summary: 'List all companies (paginated)' })
  findAll(@Query() filter: FilterCompanyDto) {
    return this.companiesService.findAll(filter);
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Update company info' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Delete('companies/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a company' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.deactivate(id);
  }

  // ── Logo upload ─────────────────────────────────────────────────────────

  @Post('companies/:id/logo')
  @ApiOperation({ summary: 'Upload company logo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
      fileFilter: (_req, file, cb) => {
        if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.companiesService.updateLogo(id, logoUrl);
  }

  // ── Company admin management ──────────────────────────────────────────────

  @Post('companies/:id/admins')
  @ApiOperation({ summary: "Create a company's admin" })
  createAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCompanyAdminDto,
  ) {
    return this.companiesService.createAdmin(id, dto);
  }

  @Get('companies/:id/admins')
  @ApiOperation({ summary: 'List admins of a company' })
  getAdmins(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getAdmins(id);
  }

  @Patch('companies/:id/admins/:adminId')
  @ApiOperation({ summary: "Update a company's admin (super admin only)" })
  updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Param('adminId', ParseIntPipe) adminId: number,
    @Body() dto: UpdateCompanyAdminDto,
  ) {
    return this.companiesService.updateAdmin(id, adminId, dto);
  }

  // ── License management ────────────────────────────────────────────────────

  @Patch('companies/:id/license')
  @ApiOperation({ summary: 'Update company license / limits' })
  updateLicense(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLicenseDto,
  ) {
    return this.companiesService.updateLicense(id, dto);
  }

  // ── Toggle active ─────────────────────────────────────────────────────────

  @Post('companies/:id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle company active status' })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.toggleActive(id);
  }

  // ── Platform dashboard ────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Super admin overview (company stats)' })
  getPlatformDashboard() {
    return this.companiesService.getPlatformDashboard();
  }
}
