import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import { ExtractJwt, Strategy } from "passport-jwt";

import { SessionMiddleware } from "src/middleware/session.middleware";
import { BackendLogger } from "src/modules/logger/BackendLogger";
import { SESSION_USER } from "src/shared/base.constants";
import { AuthService } from "../auth.service";
import { DotenvService } from './../../dotenv/dotenv.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    private readonly logger = new BackendLogger(JwtStrategy.name);

    constructor(
        private readonly authService: AuthService,
        private readonly dotenvService: DotenvService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: dotenvService.get('ACCESS_TOKEN_SECRET'),
        });
    }

    async validate(payload) {
        try {
            const user = await this.authService.validateUser(payload);
            if (!user) {
                this.logger.log(`Invalid/expired payload: ${JSON.stringify(payload)}`);
                throw new UnauthorizedException();
            }
            SessionMiddleware.set(SESSION_USER, user);
            return user;
        } catch (err) {
            this.logger.log(`Invalid/expired payload: ${JSON.stringify(payload)}`);
            throw new UnauthorizedException();
        }
    }
}
