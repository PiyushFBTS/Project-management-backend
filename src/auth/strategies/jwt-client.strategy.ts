import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientUser } from '../../database/entities/client-user.entity';

export interface ClientJwtPayload {
  sub: number;
  email: string;
  projectId: number;
  companyId: number;
  type: string;
}

@Injectable()
export class JwtClientStrategy extends PassportStrategy(
  Strategy,
  'jwt-client',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(ClientUser)
    private readonly clientRepo: Repository<ClientUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_CLIENT_SECRET', 'client-secret-change-me'),
    });
  }

  async validate(payload: ClientJwtPayload): Promise<ClientUser> {
    if (payload.type !== 'client') throw new UnauthorizedException();
    const client = await this.clientRepo.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['project'],
    });
    if (!client)
      throw new UnauthorizedException('Client account not found or inactive');
    return client;
  }
}
