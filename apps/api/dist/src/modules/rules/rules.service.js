"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let RulesService = class RulesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.rule.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const rule = await this.prisma.rule.findUnique({
            where: { id },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Rule not found');
        }
        return rule;
    }
    async create(dto) {
        return this.prisma.rule.create({
            data: {
                pattern: dto.pattern,
                riskLevel: dto.riskLevel,
                enabled: dto.enabled,
                version: dto.version ?? '1.0.0',
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.rule.update({
            where: { id },
            data: {
                ...(dto.pattern !== undefined && { pattern: dto.pattern }),
                ...(dto.riskLevel !== undefined && { riskLevel: dto.riskLevel }),
                ...(dto.enabled !== undefined && { enabled: dto.enabled }),
                ...(dto.version !== undefined && { version: dto.version }),
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.rule.delete({
            where: { id },
        });
    }
    async findActiveRules() {
        const rules = await this.prisma.rule.findMany({
            where: { enabled: true },
            orderBy: { updatedAt: 'desc' },
        });
        return {
            version: this.getRulesetVersion(rules),
            rules: rules.map((rule) => ({
                id: rule.id,
                pattern: rule.pattern,
                riskLevel: rule.riskLevel,
            })),
        };
    }
    getRulesetVersion(rules) {
        if (rules.length === 0) {
            return '1.0.0';
        }
        const latestUpdatedAt = rules[0].updatedAt;
        const latestVersion = rules[0].version;
        return `${latestVersion}-${latestUpdatedAt.getTime()}`;
    }
};
exports.RulesService = RulesService;
exports.RulesService = RulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RulesService);
