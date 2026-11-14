import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'src/common/user-role.enum';

export class CreateUserDto {
    @ApiProperty({ description: 'Full name of the user.', example: 'Jane Doe' })
    @IsString()
    name!: string;

    @ApiProperty({ description: 'Email address of the user.', example: 'jane.doe@example.com' })
    @IsEmail()
    email!: string;

    @ApiPropertyOptional({
      description: 'Assigned application role.',
      example: UserRole.PROGRAMME_STAFF,
      enum: UserRole,
      default: UserRole.PROGRAMME_STAFF,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ description: 'Hashed password value.', example: '$2b$10$...' })
    @IsString()
    passwordHash?: string;

    @ApiPropertyOptional({ description: 'Avatar URL.', example: 'https://example.com/avatar.png' })
    @IsString()
    avatarUrl?: string;

    @ApiPropertyOptional({ description: 'Microsoft account identifier.', example: 'microsoft-user-id' })
    @IsString()
    microsoftId?: string;
}
