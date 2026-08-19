import { Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/types/request.type';
import { UsersService } from '../services/users.service';
import { passwordSchema } from '../../auth/dto/auth.dto';
import { z } from 'zod';

const usersService = new UsersService();

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: passwordSchema,
});

export class UsersController {
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await usersService.getProfile(req.user.sub);
    res.json({ success: true, data: user });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = UpdateProfileSchema.parse(req.body);
    const user = await usersService.updateProfile(req.user.sub, dto);
    res.json({ success: true, data: user });
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const dto = ChangePasswordSchema.parse(req.body);
    await usersService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  }
}
