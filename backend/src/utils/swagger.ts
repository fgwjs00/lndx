/**
 * Swagger API文档配置
 * @description 自动生成API文档的配置和设置
 */

import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import { config } from '@/config'

/**
 * Swagger配置选项
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '学生报名及档案管理系统 API',
      version: '1.0.0',
      description: `
## 系统介绍

学生报名及档案管理系统后端API服务，提供完整的学生管理、课程管理、报名管理和考勤管理功能。

## 主要功能

- 🔐 四级权限认证系统（超级管理员/学校管理员/教师/学生）
- 👥 用户管理和角色控制
- 📚 学生档案完整管理
- 🎓 课程信息和排课管理
- 📝 在线报名和审核流程
- 📊 智能考勤和统计分析
- 📱 短信验证和通知服务
- 📄 身份证识别和文件上传

## 认证说明

系统采用JWT认证，需要在请求头中包含Token：
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 权限级别

1. **超级管理员 (SUPER_ADMIN)**: 系统最高权限
2. **学校管理员 (SCHOOL_ADMIN)**: 学校级管理权限
3. **教师 (TEACHER)**: 教学相关权限
4. **学生 (STUDENT)**: 基础权限

## 响应格式

所有API都遵循统一的响应格式：

**成功响应:**
\`\`\`json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
\`\`\`

**错误响应:**
\`\`\`json
{
  "code": 400,
  "message": "错误描述",
  "error": "ERROR_CODE",
  "timestamp": "2025-01-14T15:30:45.000Z",
  "path": "/api/users"
}
\`\`\`

## 分页响应

列表类接口返回分页数据：
\`\`\`json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
\`\`\`
      `,
      contact: {
        name: 'LNDX Team',
        email: 'support@lndx.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: '开发环境'
      },
      {
        url: `https://api.lndx.com${config.apiPrefix}`,
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌'
        }
      },
      schemas: {
        // 通用响应模式
        ApiResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '响应状态码',
              example: 200
            },
            message: {
              type: 'string',
              description: '响应消息',
              example: '操作成功'
            },
            data: {
              type: 'object',
              description: '响应数据'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '响应时间戳'
            },
            path: {
              type: 'string',
              description: '请求路径'
            }
          }
        },
        
        // 分页响应模式
        PaginatedResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: '查询成功'
            },
            data: {
              type: 'object',
              properties: {
                list: {
                  type: 'array',
                  description: '数据列表'
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: '当前页码',
                      example: 1
                    },
                    pageSize: {
                      type: 'integer',
                      description: '每页条数',
                      example: 10
                    },
                    total: {
                      type: 'integer',
                      description: '总记录数',
                      example: 100
                    },
                    totalPages: {
                      type: 'integer',
                      description: '总页数',
                      example: 10
                    }
                  }
                }
              }
            }
          }
        },
        
        // 错误响应模式
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '错误状态码',
              example: 400
            },
            message: {
              type: 'string',
              description: '错误信息',
              example: '参数验证失败'
            },
            error: {
              type: 'string',
              description: '错误代码',
              example: 'VALIDATION_ERROR'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '错误发生时间'
            },
            path: {
              type: 'string',
              description: '请求路径',
              example: '/api/users'
            }
          }
        },
        
        // 用户模式
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '用户ID',
              example: 'clr1234567890abcdef'
            },
            phone: {
              type: 'string',
              description: '手机号',
              example: '13800138000'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱',
              example: 'user@example.com'
            },
            realName: {
              type: 'string',
              description: '真实姓名',
              example: '张三'
            },
            avatar: {
              type: 'string',
              description: '头像URL',
              example: 'https://example.com/avatar.jpg'
            },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
              description: '用户角色'
            },
            isActive: {
              type: 'boolean',
              description: '账号状态',
              example: true
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: '最后登录时间'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        
        // 学生模式
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '学生ID'
            },
            studentCode: {
              type: 'string',
              description: '学生编号',
              example: 'S2025001'
            },
            realName: {
              type: 'string',
              description: '学生姓名',
              example: '李四'
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE'],
              description: '性别'
            },
            age: {
              type: 'integer',
              description: '年龄',
              example: 20
            },
            idCardNumber: {
              type: 'string',
              description: '身份证号',
              example: '110101200001010001'
            },
            contactPhone: {
              type: 'string',
              description: '联系电话',
              example: '13900000001'
            }
          }
        },
        
        // 课程模式
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '课程ID'
            },
            courseCode: {
              type: 'string',
              description: '课程编号',
              example: 'C2025001'
            },
            name: {
              type: 'string',
              description: '课程名称',
              example: '民族舞蹈基础班'
            },
            category: {
              type: 'string',
              description: '课程分类',
              example: '舞蹈'
            },
            level: {
              type: 'string',
              description: '课程级别',
              example: '初级'
            },
            duration: {
              type: 'integer',
              description: '课程时长（分钟）',
              example: 90
            },
            maxStudents: {
              type: 'integer',
              description: '最大学员数',
              example: 20
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: '课程价格',
              example: 299.00
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
}

/**
 * 生成Swagger规范文档
 */
const swaggerSpec = swaggerJSDoc(swaggerOptions)

/**
 * 设置Swagger UI
 * @param app Express应用实例
 */
export const setupSwagger = (app: Express): void => {
  // Swagger UI选项
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .scheme-container { display: none }
    `,
    customSiteTitle: '学生管理系统 API 文档'
  }

  // 设置文档路由
  app.use('/docs', swaggerUi.serve)
  app.get('/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions))
  
  // API前缀下的文档（供前端访问）
  const apiPrefix = config.apiPrefix || '/api'
  app.use(`${apiPrefix}/docs`, swaggerUi.serve)
  app.get(`${apiPrefix}/docs`, swaggerUi.setup(swaggerSpec, swaggerUiOptions))
  
  // 提供JSON格式的API文档
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
  
  app.get(`${apiPrefix}/docs.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  console.log(`📚 API文档已启用:`)
  console.log(`   - Swagger UI: http://localhost:${config.port}/docs`)
  console.log(`   - API文档: http://localhost:${config.port}${apiPrefix}/docs`)
  console.log(`   - JSON格式: http://localhost:${config.port}/docs.json`)
}

export default swaggerSpec
