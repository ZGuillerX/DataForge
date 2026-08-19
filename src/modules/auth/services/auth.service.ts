import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { logger } from '../../../shared/utils/logger.util';
import { ConflictError, UnauthorizedError } from '../../../shared/errors/app-error';
import { AuthRepository } from '../repositories/auth.repository';
import type { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth.dto';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  async register(dto: RegisterDto) {
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already registered');
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
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ devToken?: string }> {
    const user = await this.authRepo.findByEmail(dto.email);
    // Misma respuesta exista o no el usuario, para no filtrar qué emails están registrados
    if (!user) return {};

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.authRepo.setResetToken(user.id, tokenHash, expiry);

    logger.info(
      `Password reset solicitado para ${dto.email}. Token (usar en /reset-password?token=...): ${rawToken}`,
    );

    // No hay servicio de email configurado: en entornos no productivos devolvemos
    // el token en la respuesta para poder probar el flujo end-to-end.
    return env.NODE_ENV === 'production' ? {} : { devToken: rawToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.authRepo.findByValidResetTokenHash(tokenHash);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.authRepo.resetPassword(user.id, passwordHash);
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}
