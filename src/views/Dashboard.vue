<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>社团总数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="statistics.clubCount || 0">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  当前注册社团数量
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>活动总数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="statistics.activityCount || 0">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  已举办活动数量
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>成员总数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="statistics.memberCount || 0">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  注册成员总数
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '../utils/axios'  // 使用配置好的axios实例

const statistics = ref({
  clubCount: 0,
  activityCount: 0,
  memberCount: 0
})

const fetchDashboardData = async () => {
  try {
    const statsRes = await axios.get('/api/statistics')
    
    // 确保数据格式正确
    if (statsRes.data && statsRes.data.data) {
      statistics.value = statsRes.data.data
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  text-align: center;
  padding: 20px;
}
</style>