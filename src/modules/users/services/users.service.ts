import bcrypt from 'bcryptjs';
import { NotFoundError, UnauthorizedError } from '../../../shared/errors/app-error';
import { UsersRepository } from '../repositories/users.repository';

const SALT_ROUNDS = 12;

export class UsersService {
  private usersRepo: UsersRepository;

  constructor() {
    this.usersRepo = new UsersRepository();
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundError('User');
    return this.usersRepo.update(userId, data);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const record = await this.usersRepo.findPasswordHash(userId);
    if (!record) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(currentPassword, record.passwordHash);
    if (!isValid) throw new UnauthorizedError('La contraseña actual es incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepo.updatePassword(userId, passwordHash);
  }
}
