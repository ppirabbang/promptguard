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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rules_service_1 = require("./rules.service");
const create_rule_dto_1 = require("./dto/create-rule.dto");
const update_rule_dto_1 = require("./dto/update-rule.dto");
let RulesController = class RulesController {
    constructor(rulesService) {
        this.rulesService = rulesService;
    }
    findActiveRules() {
        return this.rulesService.findActiveRules();
    }
    findAll() {
        return this.rulesService.findAll();
    }
    findOne(id) {
        return this.rulesService.findOne(id);
    }
    create(dto) {
        return this.rulesService.create(dto);
    }
    update(id, dto) {
        return this.rulesService.update(id, dto);
    }
    remove(id) {
        return this.rulesService.remove(id);
    }
};
exports.RulesController = RulesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '활성 룰셋 조회' }),
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RulesController.prototype, "findActiveRules", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '룰 전체 조회' }),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RulesController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '룰 단건 조회' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RulesController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '룰 생성' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_rule_dto_1.CreateRuleDto]),
    __metadata("design:returntype", void 0)
], RulesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '룰 수정' }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_rule_dto_1.UpdateRuleDto]),
    __metadata("design:returntype", void 0)
], RulesController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '룰 삭제' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RulesController.prototype, "remove", null);
exports.RulesController = RulesController = __decorate([
    (0, swagger_1.ApiTags)('Admin Rules'),
    (0, common_1.Controller)('admin/rules'),
    __metadata("design:paramtypes", [rules_service_1.RulesService])
], RulesController);
