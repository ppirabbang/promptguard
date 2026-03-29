"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_config_1 = __importDefault(require("./config/app.config"));
const prisma_module_1 = require("./prisma/prisma.module");
const rules_module_1 = require("./modules/rules/rules.module");
const audit_log_module_1 = require("./modules/audit-log/audit-log.module");
const health_controller_1 = require("./modules/health/health.controller");
const admin_guard_1 = require("./common/guards/admin.guard");
const admin_auth_controller_1 = require("./modules/admin-auth/admin-auth.controller");
const admin_auth_service_1 = require("./modules/admin-auth/admin-auth.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default],
            }),
            prisma_module_1.PrismaModule,
            audit_log_module_1.AuditLogModule,
            rules_module_1.RulesModule,
        ],
        controllers: [
            health_controller_1.HealthController,
            admin_auth_controller_1.AdminAuthController,
        ],
        providers: [
            admin_guard_1.AdminGuard,
            admin_auth_service_1.AdminAuthService,
        ],
    })
], AppModule);
