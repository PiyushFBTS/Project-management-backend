import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { EmployeeLoginDto } from './dto/employee-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAdminGuard } from './guards/jwt-admin.guard';
import { JwtEmployeeGuard } from './guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login — returns JWT access + refresh tokens' })
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (pass type: admin | employee)' })
  refresh(@Body() dto: RefreshTokenDto) {
    if (dto.type === 'employee')
      return this.authService.refreshEmployeeToken(dto.refreshToken);
    return this.authService.refreshAdminToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — client should discard stored tokens' })
  logout() {
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Get current admin profile' })
  getAdminProfile(@CurrentUser() user: any) {
    const { passwordHash, ...profile } = user;
    return profile;
  }

  @Patch('change-password')
  @UseGuards(JwtAdminGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Change admin password' })
  changeAdminPassword(
    @CurrentUser('id') adminId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changeAdminPassword(adminId, dto);
  }

  // ── Employee ───────────────────────────────────────────────────────────────

  @Post('employee/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employee login (mobile app) — returns JWT tokens' })
  loginEmployee(@Body() dto: EmployeeLoginDto) {
    return this.authService.loginEmployee(dto);
  }

  @Get('employee/profile')
  @UseGuards(JwtEmployeeGuard)
  @ApiBearerAuth('employee-jwt')
  @ApiOperation({ summary: 'Get current employee profile' })
  getEmployeeProfile(@CurrentUser('id') employeeId: number) {
    return this.authService.getEmployeeProfile(employeeId);
  }

  @Patch('employee/change-password')
  @UseGuards(JwtEmployeeGuard)
  @ApiBearerAuth('employee-jwt')
  @ApiOperation({ summary: 'Change employee password' })
  changeEmployeePassword(
    @CurrentUser('id') employeeId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changeEmployeePassword(employeeId, dto);
  }
}
