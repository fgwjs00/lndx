/**
 * 检查数据库中的图片路径与实际文件是否匹配
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function checkMissingImages() {
  try {
    console.log('🔍 检查数据库中图片路径与实际文件的匹配情况...')

    // 1. 查询所有学生的图片路径
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        idCardFront: true,
        idCardBack: true,
        photo: true
      },
      take: 20 // 限制查询数量避免过多输出
    })

    console.log(`\n📊 找到 ${students.length} 个学生记录`)

    const missingFiles = []
    const existingFiles = []

    for (const student of students) {
      console.log(`\n👤 检查学生: ${student.name} (ID: ${student.id})`)

      // 检查身份证正面
      if (student.idCardFront) {
        const filePath = path.join(__dirname, '../uploads', student.idCardFront)
        if (fs.existsSync(filePath)) {
          existingFiles.push({ student: student.name, type: 'idCardFront', path: student.idCardFront })
          console.log(`  ✅ 身份证正面存在: ${student.idCardFront}`)
        } else {
          missingFiles.push({ student: student.name, type: 'idCardFront', path: student.idCardFront })
          console.log(`  ❌ 身份证正面缺失: ${student.idCardFront}`)
        }
      }

      // 检查身份证背面
      if (student.idCardBack) {
        const filePath = path.join(__dirname, '../uploads', student.idCardBack)
        if (fs.existsSync(filePath)) {
          existingFiles.push({ student: student.name, type: 'idCardBack', path: student.idCardBack })
          console.log(`  ✅ 身份证背面存在: ${student.idCardBack}`)
        } else {
          missingFiles.push({ student: student.name, type: 'idCardBack', path: student.idCardBack })
          console.log(`  ❌ 身份证背面缺失: ${student.idCardBack}`)
        }
      }

      // 检查照片
      if (student.photo) {
        const filePath = path.join(__dirname, '../uploads', student.photo)
        if (fs.existsSync(filePath)) {
          existingFiles.push({ student: student.name, type: 'photo', path: student.photo })
          console.log(`  ✅ 照片存在: ${student.photo}`)
        } else {
          missingFiles.push({ student: student.name, type: 'photo', path: student.photo })
          console.log(`  ❌ 照片缺失: ${student.photo}`)
        }
      }
    }

    console.log(`\n📈 统计结果:`)
    console.log(`✅ 存在的文件: ${existingFiles.length}`)
    console.log(`❌ 缺失的文件: ${missingFiles.length}`)

    if (missingFiles.length > 0) {
      console.log(`\n🚨 缺失文件详情:`)
      missingFiles.forEach(file => {
        console.log(`  - ${file.student}: ${file.type} -> ${file.path}`)
      })

      console.log(`\n🔧 建议修复方案:`)
      console.log(`1. 清理数据库中的无效路径引用`)
      console.log(`2. 使用默认头像替换缺失的图片`)
      console.log(`3. 提示用户重新上传缺失的图片`)
    }

    // 2. 检查uploads目录中的孤儿文件
    console.log(`\n🔍 检查uploads目录中的孤儿文件...`)
    const uploadsDir = path.join(__dirname, '../uploads')
    
    const checkDirectory = (dir, subPath = '') => {
      const dirPath = path.join(uploadsDir, subPath)
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
        files.forEach(file => {
          const filePath = path.join(subPath, file)
          const fullPath = path.join(dirPath, file)
          
          if (fs.statSync(fullPath).isDirectory()) {
            checkDirectory(dir, filePath)
          } else {
            // 检查这个文件是否在数据库中被引用
            const isReferenced = existingFiles.some(ef => ef.path.includes(file))
            if (!isReferenced && !file.includes('default-avatar')) {
              console.log(`  🗑️ 孤儿文件: ${filePath}`)
            }
          }
        })
      }
    }
    
    checkDirectory('uploads')

    console.log(`\n✅ 检查完成!`)

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMissingImages()
