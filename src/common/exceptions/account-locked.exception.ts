import { HttpException, HttpStatus } from '@nestjs/common';

export class AccountLockedException extends HttpException {
  constructor(message: string = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        errorCode: 'ACCOUNT_LOCKED',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
