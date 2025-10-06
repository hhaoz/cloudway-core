import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized',
      })

    }
    next();//request ok thi cho di qua
  }
  private extractTokenFromHeader(request:Request):String | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
  }
}
