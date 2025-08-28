"use strict";
/**
 * 数据验证工具
 * @description 基于Joi的数据验证函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdParam = exports.validatePaginationData = exports.validateCourseData = exports.validateStudentData = exports.validateRegisterData = exports.validateSmsData = exports.validateLoginData = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
/**
 * 手机号验证规则
 */
const phoneSchema = joi_1.default.string()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
    'string.pattern.base': '请输入正确的手机号码',
    'any.required': '手机号码不能为空'
});
/**
 * 密码验证规则
 */
const passwordSchema = joi_1.default.string()
    .min(6)
    .max(20)
    .required()
    .messages({
    'string.min': '密码长度至少6位',
    'string.max': '密码长度不能超过20位',
    'any.required': '密码不能为空'
});
/**
 * 姓名验证规则
 */
const realNameSchema = joi_1.default.string()
    .min(2)
    .max(20)
    .pattern(/^[\u4e00-\u9fa5a-zA-Z\s]+$/)
    .required()
    .messages({
    'string.min': '姓名至少2个字符',
    'string.max': '姓名不能超过20个字符',
    'string.pattern.base': '姓名只能包含中文、英文和空格',
    'any.required': '姓名不能为空'
});
/**
 * 邮箱验证规则
 */
const emailSchema = joi_1.default.string()
    .email()
    .optional()
    .messages({
    'string.email': '请输入正确的邮箱地址'
});
/**
 * 身份证号验证规则
 */
const idCardSchema = joi_1.default.string()
    .pattern(/^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/)
    .required()
    .messages({
    'string.pattern.base': '请输入正确的身份证号码',
    'any.required': '身份证号码不能为空'
});
/**
 * 登录数据验证
 */
const validateLoginData = (data) => {
    const schema = joi_1.default.object({
        phone: phoneSchema,
        password: passwordSchema
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateLoginData = validateLoginData;
/**
 * 短信验证数据验证
 */
const validateSmsData = (data) => {
    const schema = joi_1.default.object({
        phone: phoneSchema,
        type: joi_1.default.string()
            .valid('register', 'login', 'reset_password', 'bind_phone')
            .required()
            .messages({
            'any.only': '短信类型无效',
            'any.required': '短信类型不能为空'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateSmsData = validateSmsData;
/**
 * 注册数据验证
 */
const validateRegisterData = (data) => {
    const schema = joi_1.default.object({
        phone: phoneSchema,
        password: passwordSchema,
        realName: realNameSchema,
        email: emailSchema
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateRegisterData = validateRegisterData;
/**
 * 学生信息验证
 */
const validateStudentData = (data, isUpdate = false) => {
    const requiredField = isUpdate ? joi_1.default.optional() : joi_1.default.required();
    const schema = joi_1.default.object({
        realName: isUpdate ? realNameSchema.optional() : realNameSchema,
        gender: joi_1.default.string()
            .valid('MALE', 'FEMALE')
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'any.only': '性别只能是男或女',
            'any.required': '性别不能为空'
        }),
        age: joi_1.default.number()
            .integer()
            .min(1)
            .max(120)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'number.min': '年龄必须大于0',
            'number.max': '年龄不能超过120',
            'any.required': '年龄不能为空'
        }),
        birthday: joi_1.default.date()
            .max('now')
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'date.max': '出生日期不能超过当前日期',
            'any.required': '出生日期不能为空'
        }),
        idCardNumber: isUpdate ? idCardSchema.optional() : idCardSchema,
        idCardAddress: joi_1.default.string()
            .min(5)
            .max(200)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '身份证地址至少5个字符',
            'string.max': '身份证地址不能超过200个字符',
            'any.required': '身份证地址不能为空'
        }),
        contactPhone: phoneSchema.when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        }),
        currentAddress: joi_1.default.string()
            .min(5)
            .max(200)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '现居住地址至少5个字符',
            'string.max': '现居住地址不能超过200个字符',
            'any.required': '现居住地址不能为空'
        }),
        emergencyContact: joi_1.default.string()
            .min(2)
            .max(20)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '紧急联系人姓名至少2个字符',
            'string.max': '紧急联系人姓名不能超过20个字符',
            'any.required': '紧急联系人姓名不能为空'
        }),
        emergencyPhone: phoneSchema.when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        }),
        emergencyRelation: joi_1.default.string()
            .min(2)
            .max(20)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '紧急联系人关系至少2个字符',
            'string.max': '紧急联系人关系不能超过20个字符',
            'any.required': '紧急联系人关系不能为空'
        }),
        healthStatus: joi_1.default.string()
            .max(500)
            .optional()
            .messages({
            'string.max': '健康状况描述不能超过500个字符'
        }),
        medicalHistory: joi_1.default.string()
            .max(1000)
            .optional()
            .messages({
            'string.max': '病史描述不能超过1000个字符'
        }),
        allergies: joi_1.default.string()
            .max(500)
            .optional()
            .messages({
            'string.max': '过敏史描述不能超过500个字符'
        }),
        idCardFront: joi_1.default.string()
            .uri()
            .optional()
            .messages({
            'string.uri': '身份证正面照片链接格式无效'
        }),
        idCardBack: joi_1.default.string()
            .uri()
            .optional()
            .messages({
            'string.uri': '身份证背面照片链接格式无效'
        }),
        remarks: joi_1.default.string()
            .max(1000)
            .optional()
            .messages({
            'string.max': '备注信息不能超过1000个字符'
        })
    });
    return schema.validate(data, {
        abortEarly: false,
        context: { isUpdate }
    });
};
exports.validateStudentData = validateStudentData;
/**
 * 课程信息验证
 */
const validateCourseData = (data, isUpdate = false) => {
    const requiredField = isUpdate ? joi_1.default.optional() : joi_1.default.required();
    const schema = joi_1.default.object({
        name: joi_1.default.string()
            .min(2)
            .max(100)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '课程名称至少2个字符',
            'string.max': '课程名称不能超过100个字符',
            'any.required': '课程名称不能为空'
        }),
        description: joi_1.default.string()
            .max(1000)
            .optional()
            .messages({
            'string.max': '课程描述不能超过1000个字符'
        }),
        category: joi_1.default.string()
            .min(2)
            .max(50)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '课程分类至少2个字符',
            'string.max': '课程分类不能超过50个字符',
            'any.required': '课程分类不能为空'
        }),
        level: joi_1.default.string()
            .min(2)
            .max(50)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'string.min': '课程级别至少2个字符',
            'string.max': '课程级别不能超过50个字符',
            'any.required': '课程级别不能为空'
        }),
        duration: joi_1.default.number()
            .integer()
            .min(30)
            .max(480)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'number.min': '课程时长至少30分钟',
            'number.max': '课程时长不能超过480分钟',
            'any.required': '课程时长不能为空'
        }),
        maxStudents: joi_1.default.number()
            .integer()
            .min(1)
            .max(100)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'number.min': '最大学员数至少1人',
            'number.max': '最大学员数不能超过100人',
            'any.required': '最大学员数不能为空'
        }),
        price: joi_1.default.number()
            .min(0)
            .max(99999.99)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'number.min': '课程价格不能为负数',
            'number.max': '课程价格不能超过99999.99',
            'any.required': '课程价格不能为空'
        }),
        hasAgeRestriction: joi_1.default.boolean()
            .optional(),
        minAge: joi_1.default.when('hasAgeRestriction', {
            is: true,
            then: joi_1.default.number().integer().min(1).max(120).required(),
            otherwise: joi_1.default.optional()
        }).messages({
            'number.min': '最小年龄必须大于0',
            'number.max': '最小年龄不能超过120',
            'any.required': '启用年龄限制时最小年龄不能为空'
        }),
        maxAge: joi_1.default.when('hasAgeRestriction', {
            is: true,
            then: joi_1.default.number().integer().min(joi_1.default.ref('minAge')).max(120).required(),
            otherwise: joi_1.default.optional()
        }).messages({
            'number.min': '最大年龄必须大于等于最小年龄',
            'number.max': '最大年龄不能超过120',
            'any.required': '启用年龄限制时最大年龄不能为空'
        }),
        ageDescription: joi_1.default.when('hasAgeRestriction', {
            is: true,
            then: joi_1.default.string().max(200).optional(),
            otherwise: joi_1.default.optional()
        }).messages({
            'string.max': '年龄限制说明不能超过200个字符'
        }),
        timeSlots: joi_1.default.array()
            .items(joi_1.default.object({
            dayOfWeek: joi_1.default.number().integer().min(1).max(7).required(),
            startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
            endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
            period: joi_1.default.string().valid('morning', 'afternoon', 'evening').required()
        }))
            .min(1)
            .when('$isUpdate', {
            is: true,
            then: joi_1.default.optional(),
            otherwise: requiredField
        })
            .messages({
            'array.min': '至少需要添加一个上课时间',
            'any.required': '上课时间不能为空'
        })
    });
    return schema.validate(data, {
        abortEarly: false,
        context: { isUpdate }
    });
};
exports.validateCourseData = validateCourseData;
/**
 * 分页参数验证
 */
const validatePaginationData = (data) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
            'number.min': '页码必须大于等于1'
        }),
        pageSize: joi_1.default.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
            'number.min': '每页条数必须大于等于1',
            'number.max': '每页条数不能超过100'
        }),
        keyword: joi_1.default.string()
            .max(50)
            .optional()
            .messages({
            'string.max': '搜索关键词不能超过50个字符'
        }),
        role: joi_1.default.string()
            .valid('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT')
            .optional()
            .messages({
            'any.only': '角色类型无效，支持的角色：SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT'
        }),
        sortField: joi_1.default.string()
            .max(50)
            .optional()
            .messages({
            'string.max': '排序字段名称不能超过50个字符'
        }),
        sortOrder: joi_1.default.string()
            .valid('asc', 'desc')
            .default('desc')
            .messages({
            'any.only': '排序顺序只能是asc或desc'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validatePaginationData = validatePaginationData;
/**
 * ID参数验证
 */
const validateIdParam = (id) => {
    const schema = joi_1.default.string()
        .required()
        .messages({
        'any.required': 'ID参数不能为空',
        'string.empty': 'ID参数不能为空'
    });
    return schema.validate(id);
};
exports.validateIdParam = validateIdParam;
//# sourceMappingURL=validation.js.map