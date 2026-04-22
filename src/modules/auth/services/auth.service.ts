import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import {
  ConflictError,
  UnauthorizedError,
} from "../../../shared/errors/app-error";
import { AuthRepository } from "../repositories/auth.repository";
import type { RegisterDto, LoginDto } from "../dto/auth.dto";

const SALT_ROUNDS = 12;

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  async register(dto: RegisterDto) {
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.authRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const token = this.generateToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(dto: LoginDto) {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.generateToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }
}
