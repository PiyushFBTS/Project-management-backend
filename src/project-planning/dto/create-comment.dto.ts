import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'This looks good, moving to review.' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
