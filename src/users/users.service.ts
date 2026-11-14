import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from 'src/common/user-role.enum';

export type SafeUser = Omit<User, 'passwordHash' | 'refreshTokenHash' | 'passwordResetTokenHash' | 'passwordResetTokenExpiresAt' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>
  ) { }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepo
      .findOne({ where: { id } });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo
      .findOne({ where: { email } });
    return user;
  }

  async findByMicrosoftId(microsoftId: string): Promise<User | null> {
    const user = await this.userRepo
      .findOne({ where: { microsoftId } });
    return user;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const user = this.userRepo.create({
      ...data,
      role: data.role ?? UserRole.PROGRAMME_STAFF,
    });
    return this.userRepo.save(user);
  }

  async linkMicrosoftId(userId: string, microsoftId: string): Promise<void> {
    await this.userRepo.update(userId, { microsoftId });
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string): Promise<void> {
    await this.userRepo.update(userId, { refreshTokenHash });
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshTokenHash: null });
  }

  async setPasswordResetToken(userId: string, passwordResetTokenHash: string, passwordResetTokenExpiresAt: Date): Promise<void> {
    await this.userRepo.update(userId, { passwordResetTokenHash, passwordResetTokenExpiresAt });
  }

  async resetPassword(userId: string, passwordHash: string) {
    await this.userRepo.update(userId, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
      refreshTokenHash: null
    })
  }

  async findByPasswordResetTokenHash(resetTokenHash: string) {
    const user = await this.userRepo.findOne({ where: { passwordResetTokenHash: resetTokenHash } })
    return user
  }

  async getAllUsers() {
    const users = await this.userRepo.find();
    return users.map(user => this.toSafeUser(user));
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      return null;
    }
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async deleteUser(id: string) {
    await this.userRepo.delete(id);
    return { success: true }
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      microsoftId: user.microsoftId,
      avatarUrl: user.avatarUrl,
    }
  }

}
