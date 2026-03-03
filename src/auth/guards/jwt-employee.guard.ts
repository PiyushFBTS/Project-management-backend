import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtEmployeeGuard extends AuthGuard('jwt-employee') {}
