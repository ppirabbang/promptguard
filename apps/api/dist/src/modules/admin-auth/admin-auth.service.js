"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let AdminAuthService = class AdminAuthService {
    async login(dto) {
        const adminEmail = 'admin@promptguard.com';
        const adminPassword = 'admin1234';
        if (dto.email !== adminEmail || dto.password !== adminPassword) {
            throw new common_1.UnauthorizedException('관리자 계정 정보가 올바르지 않습니다.');
        }
        return {
            accessToken: `mock-admin-token-${(0, crypto_1.randomUUID)()}`,
            user: {
                id: 'admin-1',
                email: adminEmail,
                role: 'admin',
                name: 'PromptGuard Admin',
            },
        };
    }
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = __decorate([
    (0, common_1.Injectable)()
], AdminAuthService);
