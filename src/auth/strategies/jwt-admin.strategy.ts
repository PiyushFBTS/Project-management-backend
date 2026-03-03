import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../database/entities/admin-user.entity';

export interface AdminJwtPayload {
  sub: number;
  email: string;
  role: string;
  companyId: number | null;
  type: string;
}

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    configService: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminUser> {
    if (payload.type !== 'admin') throw new UnauthorizedException();
    const admin = await this.adminRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });
    if (!admin) throw new UnauthorizedException('Admin account not found or inactive');
    return admin;
  }
}
