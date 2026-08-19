import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../dto/auth.dto';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const dto = RegisterSchema.parse(req.body);
    const result = await authService.register(dto);
    res.status(201).json({ success: true, data: result });
  }

  async login(req: Request, res: Response): Promise<void> {
    const dto = LoginSchema.parse(req.body);
    const result = await authService.login(dto);
    res.status(200).json({ success: true, data: result });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const dto = ForgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(dto);
    res.status(200).json({
      success: true,
      message:
        'Si el correo está registrado, vas a recibir instrucciones para recuperar tu contraseña',
      ...(result.devToken ? { devToken: result.devToken } : {}),
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const dto = ResetPasswordSchema.parse(req.body);
    await authService.resetPassword(dto);
    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
  }
}
