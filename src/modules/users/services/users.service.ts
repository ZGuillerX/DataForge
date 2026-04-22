import { NotFoundError } from "../../../shared/errors/app-error";
import { UsersRepository } from "../repositories/users.repository";

export class UsersService {
  private usersRepo: UsersRepository;

  constructor() {
    this.usersRepo = new UsersRepository();
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundError("User");
    return this.usersRepo.update(userId, data);
  }
}
