<template>
  <div class="club-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd" v-if="isAdmin">
        <el-icon>
          <Plus />
        </el-icon>新增社团
      </el-button>

      <div class="filter-section">
        <el-input v-model="filter.keyword" placeholder="请输入社团名称" clearable @keyup.enter="handleFilter"
          style="width: 200px">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>

        <el-select v-model="filter.status" placeholder="请选择状态" clearable style="width: 150px">
          <el-option label="活跃" value="active" />
          <el-option label="不活跃" value="inactive" />
        </el-select>

        <el-button type="primary" @click="handleFilter">
          <el-icon>
            <Search />
          </el-icon>查询
        </el-button>
        <el-button @click="resetFilter">
          <el-icon>
            <Refresh />
          </el-icon>重置
        </el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="clubs.slice((currentPage - 1) * pageSize, currentPage * pageSize)" style="width: 100%" v-loading="loading" row-key="clubId"
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="clubName" label="社团名称" />
        <el-table-column prop="description" label="简介" show-overflow-tooltip />
        <el-table-column prop="creationDate" label="成立日期">
          <template #default="scope">
            {{ formatDate(scope.row.creationDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="presidentName" label="社长">
          <template #default="scope">
            {{ scope.row.presidentName || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="指导单位" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '活跃' : '不活跃' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" @click="handleEdit(scope.row)" v-if="canEdit(scope.row)">
                <el-icon>
                  <Edit />
                </el-icon>编辑
              </el-button>
              <el-button type="success" @click="handleMembers(scope.row)" v-if="canManageMembers(scope.row)">
                <el-icon>
                  <User />
                </el-icon>成员管理
              </el-button>
              <el-button type="danger" @click="handleDelete(scope.row)" v-if="canDelete(scope.row)">
                <el-icon>
                  <Delete />
                </el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="clubs.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </el-card>

    <!-- 社团表单对话框 -->
    <el-dialog :title="editingClub ? '编辑社团' : '新增社团'" v-model="dialogVisible" width="500px">
      <el-form ref="clubFormRef" :model="clubForm" :rules="rules" label-width="100px">
        <el-form-item label="社团名称" prop="clubName">
          <el-input v-model="clubForm.clubName" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="clubForm.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="成立日期" prop="creationDate">
          <el-date-picker v-model="clubForm.creationDate" type="date" placeholder="选择日期"
            format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="社长" prop="presidentId">
          <el-select v-model="clubForm.presidentId" placeholder="请选择社长" clearable>
            <el-option v-for="president in presidents" :key="president.userId" :label="president.realName"
              :value="president.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="指导单位" prop="unit">
          <el-input v-model="clubForm.unit" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="clubForm.status" placeholder="请选择状态">
            <el-option label="活跃" value="active" />
            <el-option label="不活跃" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 成员管理对话框 -->
    <el-dialog :title="'成员管理 - ' + (currentClub?.clubName || '')" v-model="memberDialogVisible" width="1000px">
      <div class="member-toolbar">
        <el-button type="primary" @click="handleAddMember">
          <el-icon>
            <Plus />
          </el-icon>新增成员
        </el-button>
        <el-dropdown>
          <el-button type="success">
            <el-icon>
              <Upload />
            </el-icon>导入成员
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-upload class="member-import" :http-request="customUpload" :show-file-list="false" accept=".xlsx,.xls"
                :on-success="handleImportSuccess" :on-error="handleImportError" :before-upload="beforeImport">
                <el-dropdown-item>
                  <el-icon>
                    <Upload />
                  </el-icon>上传文件
                </el-dropdown-item>
              </el-upload>
              <el-dropdown-item @click="handleDownloadTemplate">
                <el-icon>
                  <Download />
                </el-icon>下载模板
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="warning" @click="handleExport">
          <el-icon>
            <Download />
          </el-icon>导出成员
        </el-button>
      </div>

      <div class="search-box">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="姓名">
            <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable style = "width: 120px"/>
          </el-form-item>
          <el-form-item label="学号">
            <el-input v-model="searchForm.studentId" placeholder="请输入学号" clearable style="width: 120px;"/>
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="searchForm.role" placeholder="选择角色" clearable style="width: 120px">
              <el-option label="副社长" value="副社长" />
              <el-option label="普通成员" value="普通成员" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 120px">
              <el-option label="在职" value="active" />
              <el-option label="离职" value="inactive" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="members.slice((memberCurrentPage - 1) * memberPageSize, memberCurrentPage * memberPageSize)" style="width: 100%" v-loading="memberLoading"
        :header-cell-style="{ background: '#f5f7fa' }">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="studentId" label="学号" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="scope.row.role === '社长' ? 'danger' : scope.row.role === '副社长' ? 'warning' : ''">
              {{ scope.row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joinDate" label="加入日期">
          <template #default="scope">
            {{ formatDate(scope.row.joinDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="contactInfo" label="联系方式" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" @click="handleEditMember(scope.row)">
                <el-icon>
                  <Edit />
                </el-icon>编辑
              </el-button>
              <el-button type="danger" @click="handleDeleteMember(scope.row)">
                <el-icon>
                  <Delete />
                </el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="memberCurrentPage"
          v-model:page-size="memberPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="members.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleMemberSizeChange"
          @current-change="handleMemberCurrentChange"
          class="custom-pagination"
        />
      </div>

      <!-- 成员表单对话框 -->
      <el-dialog :title="editingMember ? '编辑成员' : '新增成员'" v-model="memberFormDialogVisible" width="500px"
        append-to-body>
        <el-form ref="memberFormRef" :model="memberForm" :rules="memberRules" label-width="100px">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="memberForm.name" />
          </el-form-item>
          <el-form-item label="学号" prop="studentId">
            <el-input v-model="memberForm.studentId" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="memberForm.role">
              <el-option label="副社长" value="副社长" />
              <el-option label="普通成员" value="普通成员" />
            </el-select>
          </el-form-item>
          <el-form-item label="加入日期" prop="joinDate">
            <el-date-picker v-model="memberForm.joinDate" type="date" placeholder="选择日期" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="联系方式" prop="contactInfo">
            <el-input v-model="memberForm.contactInfo" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="memberForm.status">
              <el-option label="在职" value="active" />
              <el-option label="离职" value="inactive" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="memberFormDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleMemberSubmit">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, User, Upload, Download, Refresh } from '@element-plus/icons-vue'
import axios from '../../utils/axios'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const token = userStore.token

const clubs = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingClub = ref(null)
const clubFormRef = ref(null)
const presidents = ref([])

const filter = ref({
  keyword: '',
  status: ''
})

const clubForm = ref({
  clubName: '',
  description: '',
  creationDate: '',
  presidentId: '',
  unit: '',
  status: 'active'
})

const rules = {
  clubName: [
    { required: true, message: '请输入社团名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入社团简介', trigger: 'blur' }
  ],
  creationDate: [
    { required: true, message: '请选择成立日期', trigger: 'change' }
  ],
  presidentId: [
    // 移除 required 验证
    // { required: true, message: '请选择社长', trigger: 'change' }
  ],
  unit: [
    { required: true, message: '请输入指导单位', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 成员管理相关
const memberDialogVisible = ref(false)
const memberFormDialogVisible = ref(false)
const members = ref([])
const memberLoading = ref(false)
const currentClub = ref(null)
const editingMember = ref(null)
const memberFormRef = ref(null)

const memberForm = ref({
  name: '',
  studentId: '',
  role: '普通成员',
  joinDate: '',
  contactInfo: '',
  status: 'active'
})

const memberRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{8}$/, message: '请输入8位数字学号', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  joinDate: [
    { required: true, message: '请选择加入日期', trigger: 'change' }
  ],
  contactInfo: [
    { required: true, message: '请输入联系方式', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 搜索表单数据
const searchForm = ref({
  name: '',
  studentId: '',
  role: '',
  status: ''  // 添加状态字段
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const memberCurrentPage = ref(1)
const memberPageSize = ref(10)

// 获取社长列表
const fetchPresidents = async () => {
  try {
    const response = await axios.get('/api/users')
    if (response.data.code === 200) {
      // 筛选角色为 club_president 且 clubId 为空的用户
      presidents.value = response.data.data.filter(user =>
        user.role === 'club_president' && (!user.clubId || user.clubId === null || user.clubId === '')
      )
    }
  } catch (error) {
    console.error('获取社长列表失败:', error)
  }
}

// 修改 fetchClubs 方法
const fetchClubs = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/clubs/search', {
      params: {
        keyword: filter.value.keyword || null,
        status: filter.value.status || null
      }
    });

    if (response.data.code === 200) {
      clubs.value = response.data.data;
      console.log('获取到的社团列表:', clubs.value);
    }
  } catch (error) {
    console.error('获取社团列表失败:', error);
    ElMessage.error('获取社团列表失败');
  } finally {
    loading.value = false;
  }
}

// 重置筛选
const resetFilter = () => {
  filter.value = {
    keyword: '',
    status: ''
  }
  fetchClubs()
}

// 处理过滤
const handleFilter = () => {
  fetchClubs()
}

// 处理添加
const handleAdd = () => {
  editingClub.value = null
  clubForm.value = {
    clubName: '',
    description: '',
    creationDate: '',
    presidentId: '',
    unit: '',
    status: 'active'
  }
  dialogVisible.value = true
}

// 修改处理编辑
const handleEdit = (row) => {
  if (!canEdit(row)) {
    ElMessage.warning('你没有权限编辑此社团')
    return
  }
  editingClub.value = row
  clubForm.value = {
    ...row,
    presidentId: row.presidentId,
    creationDate: formatDate(row.creationDate)
  }
  dialogVisible.value = true
}

// 处理删除
const handleDelete = (row) => {
  if (!canDelete(row)) {
    ElMessage.warning('你没有权限删除社团')
    return
  }
  ElMessageBox.confirm(
    `确定要删除社团"${row.clubName}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const response = await axios.delete(`/api/clubs/${row.clubId}`)
        if (response.data.code === 200) {
          ElMessage.success('删除成功')
          fetchClubs()
        } else {
          ElMessage.error(response.data.message || '删除失败')
        }
      } catch (error) {
        console.error('删除社团失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => { })
}

// 处理提交
const handleSubmit = async () => {
  if (!clubFormRef.value) return

  await clubFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const url = editingClub.value
          ? `/api/clubs/${editingClub.value.clubId}`
          : '/api/clubs'
        const method = editingClub.value ? 'put' : 'post'

        const response = await axios[method](url, clubForm.value)

        if (response.data.code === 200) {
          ElMessage.success(`${editingClub.value ? '编辑' : '新增'}成功`)
          dialogVisible.value = false
          fetchClubs()
        } else {
          ElMessage.error(response.data.message || `${editingClub.value ? '编辑' : '新增'}失败`)
        }
      } catch (error) {
        console.error(`${editingClub.value ? '编辑' : '新增'}社团失败:`, error)
        ElMessage.error(`${editingClub.value ? '编辑' : '新增'}失败`)
      }
    }
  })
}

// 处理成员管理
const handleMembers = (club) => {
  if (!canManageMembers(club)) {
    ElMessage.warning('你没有权限管理此社团的成员')
    return
  }
  currentClub.value = club
  memberDialogVisible.value = true
  fetchMembers(club.clubId)
}

// 获取成员列表
const fetchMembers = async (clubId) => {
  memberLoading.value = true
  try {
    const response = await axios.get(`/api/members/club/${clubId}`)
    if (response.data.code === 200) {
      members.value = response.data.data
    }
  } catch (error) {
    console.error('获取成员列表失败:', error)
    ElMessage.error('获取成员列表失败')
  } finally {
    memberLoading.value = false
  }
}

// 处理添加成员
const handleAddMember = () => {
  editingMember.value = null
  memberForm.value = {
    name: '',
    studentId: '',
    role: '普通成员',
    joinDate: new Date().toISOString().split('T')[0],
    contactInfo: '',
    status: 'active'
  }
  memberFormDialogVisible.value = true
}

// 处理编辑成员
const handleEditMember = (member) => {
  // 如果是社长，不允许编辑
  if (member.role === '社长') {
    ElMessage.warning('社长信息需要在社团基本信息中修改')
    return
  }
  editingMember.value = member
  memberForm.value = { ...member }
  memberFormDialogVisible.value = true
}

// 处理删除成员
const handleDeleteMember = (member) => {
  // 如果是社长，不允许删除
  if (member.role === '社长') {
    ElMessage.warning('社长信息需要在社团基本信息中修改')
    return
  }
  ElMessageBox.confirm(
    `确定要删除成员"${member.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/members/${member.memberId}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchMembers(currentClub.value.clubId)
      }
    } catch (error) {
      console.error('删除成员失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 处理成员表单提交
const handleMemberSubmit = async () => {
  if (!memberFormRef.value) return

  await memberFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formData = { ...memberForm.value }
        formData.clubId = currentClub.value.clubId

        const url = editingMember.value
          ? `/api/members/${editingMember.value.memberId}`
          : '/api/members'
        const method = editingMember.value ? 'put' : 'post'

        const response = await axios[method](url, formData)

        if (response.data.code === 200) {
          ElMessage.success(`${editingMember.value ? '编辑' : '新增'}成功`)
          memberFormDialogVisible.value = false
          fetchMembers(currentClub.value.clubId)
        }
      } catch (error) {
        console.error(`${editingMember.value ? '编辑' : '新增'}成员失败:`, error)
        ElMessage.error(error.response?.data?.message || `${editingMember.value ? '编辑' : '新增'}失败`)
      }
    }
  })
}

// 处理导入成功
const handleImportSuccess = async (response) => {
  if (response && response.data && response.data.code === 200) {
    ElMessage.success('导入成功')
    fetchMembers(currentClub.value.clubId)
  } else {
    const message = response?.data?.message || '导入失败'
    ElMessage.error(message)
  }
}

// 处理导入错误
const handleImportError = (error) => {
  console.error('导入失败:', error)
  const message = error?.response?.data?.message || '导入失败'
  ElMessage.error(message)
}

// 导入前的验证
const beforeImport = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件!')
    return false
  }
  return true
}

// 自定义上传方法
const customUpload = async (params) => {
  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', params.file)

    const response = await axios.post(`/api/members/import/${currentClub.value.clubId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    })

    if (response.data && response.data.code === 200) {
      handleImportSuccess(response)
    } else {
      handleImportError({ response })
    }
  } catch (error) {
    handleImportError(error)
  }
}

// 处理导出
const handleExport = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`/api/members/export/${currentClub.value.clubId}`, {
      responseType: 'blob',
      headers: {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    })

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '社团成员名单.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 下载模板
const handleDownloadTemplate = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/members/template', {
      responseType: 'blob',
      headers: {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    })

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '社团成员导入模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  }
}

// 修改搜索方法
const handleSearch = async () => {
  if (!currentClub.value) return

  try {
    const params = {
      name: searchForm.value.name || '',
      studentId: searchForm.value.studentId || '',
      role: searchForm.value.role || '',
      status: searchForm.value.status || ''
    }
    
    console.log('请求参数:', params)  // 添加日志
    console.log('当前社团ID:', currentClub.value.clubId)  // 添加日志

    const response = await axios.get(`/api/members/search/${currentClub.value.clubId}`, {
      params: params
    })

    console.log('搜索响应:', response.data)  // 添加日志
    
    if (response.data.code === 200) {
      members.value = response.data.data
    } else {
      ElMessage.error(response.data.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error.response || error)  // 修改错误日志
    ElMessage.error('搜索失败')
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    studentId: '',
    role: '',
    status: ''  // 添加状态字段的重置
  }
  fetchMembers(currentClub.value.clubId)
}

const formatDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 监听对话框关闭
watch(dialogVisible, (val) => {
  if (!val) {
    clubFormRef.value?.resetFields()
  }
})

watch(memberFormDialogVisible, (val) => {
  if (!val) {
    memberFormRef.value?.resetFields()
  }
})

// 分页相关
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleMemberSizeChange = (val) => {
  memberPageSize.value = val
}

const handleMemberCurrentChange = (val) => {
  memberCurrentPage.value = val
}

// 添加用户权限相关的计算属性
const isAdmin = computed(() => {
  const isAdmin = userStore.userInfo?.role === 'admin'
  console.log('Admin check:', { role: userStore.userInfo?.role, isAdmin })
  return isAdmin
})

const isClubPresident = computed(() => {
  // 直接从 store 获取角色判断
  const role = userStore.userInfo?.role
  const isPresident = role === 'club_president'
  console.log('Club president check:', { role, isPresident })
  return isPresident
})

// 权限控制方法
const canEdit = (club) => {
  console.log('权限检查详情:', {
    currentUserRole: userStore.userInfo?.role,
    isAdmin: isAdmin.value,
    isClubPresident: isClubPresident.value,
    currentUserId: userStore.userInfo?.userId,
    clubPresidentId: club.presidentId,
    match: String(club.presidentId) === String(userStore.userInfo?.userId)
  })
  
  if (isAdmin.value) return true
  // 先判断是否是社长，再比较ID
  if (userStore.userInfo?.role === 'club_president') {
    return String(club.presidentId) === String(userStore.userInfo?.userId)
  }
  return false
}

const canManageMembers = (club) => {
  return canEdit(club)
}

const canDelete = (club) => {
  // 只有管理员可以删除社团
  return isAdmin.value
}

onMounted(() => {
  fetchClubs()
  fetchPresidents()
})
</script>

<style scoped>
.club-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  display: flex;
  gap: 10px;
  align-items: center;
}

.member-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.member-import {
  display: inline-block;
}

:deep(.el-upload) {
  display: block;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 5px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 5px;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
}

:deep(.el-table) {
  margin-top: 10px; 
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper),
:deep(.el-select),
:deep(.el-date-editor) {
  width: 100%;
}

.search-box {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.custom-pagination :deep(.el-select) {
  width: 100px !important;
}

.custom-pagination :deep(.el-input__wrapper) {
  width: 100px !important;
}
</style>
