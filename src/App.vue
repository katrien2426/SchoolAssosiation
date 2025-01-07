<template>
  <div class="app-container">
    <template v-if="isAuthRoute">
      <router-view />
    </template>
    <template v-else>
      <el-container class="layout-container">
        <el-aside width="200px">
          <el-menu
            :router="true"
            class="el-menu-vertical"
            :default-active="$route.path"
          >
            <el-menu-item index="/dashboard">
              <el-icon><DataLine /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/clubs">
              <el-icon><Platform /></el-icon>
              <span>社团管理</span>
            </el-menu-item>
            <el-menu-item index="/activities">
              <el-icon><Calendar /></el-icon>
              <span>活动管理</span>
            </el-menu-item>
            <el-menu-item index="/honors">
              <el-icon><Trophy /></el-icon>
              <span>荣誉管理</span>
            </el-menu-item>
            <el-menu-item index="/finance" v-if="isAdmin">
              <el-icon><Money /></el-icon>
              <span>财务管理</span>
            </el-menu-item>
            <el-menu-item index="/users" v-if="isAdmin">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-container>
          <el-header>
            <div class="header-content">
              <h2>校园社团管理系统</h2>
              <div class="user-info" v-if="username">
                <el-avatar :size="32" class="user-avatar">{{ username.charAt(0) }}</el-avatar>
                <el-dropdown>
                  <span class="el-dropdown-link">
                    {{ username }}
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleProfile">
                        <el-icon><User /></el-icon>
                        <span>个人信息</span>
                      </el-dropdown-item>
                      <el-dropdown-item @click="handleLogout">
                        <el-icon><SwitchButton /></el-icon>
                        <span>退出登录</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </el-header>
          <el-main>
            <router-view></router-view>
          </el-main>
        </el-container>
      </el-container>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import { Platform, User, SwitchButton, DataLine, Calendar, Trophy, Money, ArrowDown } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = computed(() => userStore.username)
const isAdmin = computed(() => userStore.isAdmin)
const isAuthRoute = computed(() => {
  return ['/login', '/register'].includes(route.path)
})

const handleProfile = () => {
  router.push('/profile')
}

const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      userStore.logout()
      ElMessage({
        type: 'success',
        message: '已成功退出登录'
      })
      router.push('/login')
    })
    .catch(() => {
      // 取消退出时不做任何操作
    })
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
}

.app-container {
  height: 100%;
}

.layout-container {
  height: 100%;
}

.el-aside {
  background-color: #304156;
  height: 100vh;
  transition: width 0.3s;
}

.el-menu {
  border-right: none;
  background-color: #304156;
}

.el-menu-item {
  color: #bfcbd9;
  height: 56px;
  line-height: 56px;
  padding: 0 20px;
}

.el-menu-item:hover {
  background-color: #263445 !important;
}

.el-menu-item.is-active {
  color: #409EFF;
  background-color: #263445 !important;
}

.el-menu-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background-color: #409EFF;
  color: white;
  font-weight: bold;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
  gap: 4px;
  &:hover {
    background-color: transparent;  /* 移除悬停时的背景色 */
  }
  &:focus {
    outline: none;  /* 移除点击时的轮廓 */
  }
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-dropdown-menu__item .el-icon {
  margin-right: 4px;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}
</style>
