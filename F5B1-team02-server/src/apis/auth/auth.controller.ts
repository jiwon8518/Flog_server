import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
// import dotenv from 'dotenv';
// dotenv.config();
require('dotenv').config();

interface IOAuthUser {
  user: Pick<User, 'nickName' | 'email' | 'phoneNumber' | 'password'>;
}

@Controller('/')
export class AuthController {
  constructor(
    private readonly userService: UserService, //
    private readonly authService: AuthService,
  ) {}

  // 구글
  @Get('/login/google')
  @UseGuards(AuthGuard('google'))
  async loginGoogle(
    @Req() req: Request & IOAuthUser, //
    @Res() res: Response,
  ) {
    let user = await this.userService.findOne({ email: req.user.email });
    // console.log('===============google user=============');
    // console.log(user);
    // console.log('😁에러 req.user.id ' + req.user.email);
    // console.log('😁에러 user: ' + user);

    if (!user) {
      const createUser = req.user;
      user = await this.userService.create({ ...createUser });
    }

    this.authService.setRefreshToken({ user, res });

    res.redirect(
      'http://localhost:5500/class/21-02-login-refresh-restore/frontend/social-login.html',
    );
  }
}
