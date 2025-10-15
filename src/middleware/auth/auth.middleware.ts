import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SupabaseService } from '../../services/supabase/supabase.service';
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly supabaseService: SupabaseService) {}

  async use(req: Request, res: Response, next: () => void) {
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      })

    }
    // Verify JWT (Supabase JWT is JWT compatible). We only decode basic claims here
    try {
      const decoded: any = jwt.decode(token);
      if (!decoded || !decoded.sub) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid token' });
      }
      const userId = decoded.sub as string;

      // Fetch role from DB
      const { data: user } = await this.supabaseService.client
        .from('users')
        .select('id, email, full_name, role, avatar_url, phone')
        .eq('id', userId)
        .maybeSingle();

      // Attach user to request
      (req as any).user = user || { id: userId, role: 'CUSTOMER' };
    } catch (e) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Invalid token' });
    }

    next();//request ok thi cho di qua
  }
  private extractTokenFromHeader(request:Request):String | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
  }
}
