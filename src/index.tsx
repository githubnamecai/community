import { Hono } from 'hono'
import { cors } from 'hono/cors'

import buildings from './routes/buildings'
import units from './routes/units'
import owners from './routes/owners'
import bills from './routes/bills'
import repairs from './routes/repairs'
import notices from './routes/notices'
import dashboard from './routes/dashboard'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

// 全局 CORS
app.use('/api/*', cors())

// API 路由
app.route('/api/buildings', buildings)
app.route('/api/units', units)
app.route('/api/owners', owners)
app.route('/api/bills', bills)
app.route('/api/repairs', repairs)
app.route('/api/notices', notices)
app.route('/api/dashboard', dashboard)

// 健康检查
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// 主页面 - SPA
app.get('*', (c) => {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>智慧物业管理系统</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
          }
        }
      }
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }
    .sidebar { width: 260px; min-height: 100vh; transition: all 0.3s; }
    .sidebar.collapsed { width: 72px; }
    .sidebar.collapsed .menu-text { display: none; }
    .sidebar.collapsed .logo-text { display: none; }
    .sidebar.collapsed .menu-item { justify-content: center; padding: 12px 0; }
    .menu-item { display: flex; align-items: center; padding: 12px 20px; cursor: pointer; border-radius: 8px; margin: 2px 12px; transition: all 0.2s; color: #94a3b8; }
    .menu-item:hover { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .menu-item.active { background: rgba(59,130,246,0.15); color: #3b82f6; font-weight: 600; }
    .menu-item i { width: 24px; text-align: center; font-size: 16px; }
    .content-area { flex: 1; overflow-y: auto; height: 100vh; }
    .stat-card { transition: all 0.3s; cursor: pointer; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .table-container { overflow-x: auto; }
    .table-container table { width: 100%; border-collapse: collapse; }
    .table-container th { padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; color: #64748b; background: #f8fafc; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .table-container td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table-container tr:hover td { background: #f8fafc; }
    .badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-yellow { background: #fef9c3; color: #ca8a04; }
    .badge-blue { background: #dbeafe; color: #2563eb; }
    .badge-gray { background: #f1f5f9; color: #64748b; }
    .badge-purple { background: #f3e8ff; color: #9333ea; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; align-items: center; justify-content: center; }
    .modal-overlay.active { display: flex; }
    .modal-content { background: white; border-radius: 16px; padding: 24px; width: 95%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
    .btn { padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-outline { background: white; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-outline:hover { background: #f8fafc; }
    .btn-sm { padding: 4px 12px; font-size: 12px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .animate-fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .toast { position: fixed; top: 20px; right: 20px; z-index: 100; padding: 12px 20px; border-radius: 10px; color: white; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateX(120%); transition: transform 0.3s; }
    .toast.show { transform: translateX(0); }
    .toast-success { background: #16a34a; }
    .toast-error { background: #dc2626; }
  </style>
</head>
<body class="bg-gray-50">
  <div id="toast" class="toast"></div>

  <div class="flex">
    <!-- 侧边栏 -->
    <div id="sidebar" class="sidebar bg-slate-900 flex flex-col">
      <div class="p-5 flex items-center gap-3 border-b border-slate-700/50">
        <div class="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-building text-white text-lg"></i>
        </div>
        <div class="logo-text">
          <h1 class="text-white font-bold text-lg leading-tight">智慧物业</h1>
          <p class="text-slate-400 text-xs">Property Management</p>
        </div>
      </div>

      <nav class="flex-1 py-4">
        <div class="px-5 mb-2"><span class="text-xs text-slate-500 font-semibold uppercase tracking-wider menu-text">概览</span></div>
        <div class="menu-item active" data-page="dashboard" onclick="navigate('dashboard')">
          <i class="fas fa-chart-pie"></i><span class="menu-text ml-3">数据看板</span>
        </div>
        
        <div class="px-5 mt-4 mb-2"><span class="text-xs text-slate-500 font-semibold uppercase tracking-wider menu-text">管理</span></div>
        <div class="menu-item" data-page="buildings" onclick="navigate('buildings')">
          <i class="fas fa-city"></i><span class="menu-text ml-3">楼栋管理</span>
        </div>
        <div class="menu-item" data-page="units" onclick="navigate('units')">
          <i class="fas fa-home"></i><span class="menu-text ml-3">房屋管理</span>
        </div>
        <div class="menu-item" data-page="owners" onclick="navigate('owners')">
          <i class="fas fa-users"></i><span class="menu-text ml-3">业主管理</span>
        </div>
        
        <div class="px-5 mt-4 mb-2"><span class="text-xs text-slate-500 font-semibold uppercase tracking-wider menu-text">服务</span></div>
        <div class="menu-item" data-page="bills" onclick="navigate('bills')">
          <i class="fas fa-file-invoice-dollar"></i><span class="menu-text ml-3">费用管理</span>
        </div>
        <div class="menu-item" data-page="repairs" onclick="navigate('repairs')">
          <i class="fas fa-tools"></i><span class="menu-text ml-3">报修管理</span>
        </div>
        <div class="menu-item" data-page="notices" onclick="navigate('notices')">
          <i class="fas fa-bullhorn"></i><span class="menu-text ml-3">公告管理</span>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-700/50">
        <div class="menu-item" onclick="toggleSidebar()">
          <i class="fas fa-angles-left" id="collapseIcon"></i><span class="menu-text ml-3">收起菜单</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 顶部栏 -->
      <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 id="pageTitle" class="text-lg font-bold text-gray-800">数据看板</h2>
          <p id="pageSubtitle" class="text-sm text-gray-400">物业管理概览</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400" id="currentTime"></span>
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <i class="fas fa-user text-white text-sm"></i>
          </div>
        </div>
      </div>

      <!-- 页面内容 -->
      <div id="pageContent" class="p-6 animate-fade-in"></div>
    </div>
  </div>

  <!-- 模态框 -->
  <div id="modal" class="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal-content">
      <div class="flex items-center justify-between mb-4">
        <h3 id="modalTitle" class="text-lg font-bold text-gray-800"></h3>
        <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-lg"></i></button>
      </div>
      <div id="modalBody"></div>
    </div>
  </div>

  <script>
    // ===== 全局状态 =====
    let currentPage = 'dashboard';
    let dashboardChart = null;

    // ===== 工具函数 =====
    const API = (path) => '/api' + path;

    async function fetchAPI(path, options = {}) {
      try {
        const res = await fetch(API(path), {
          headers: { 'Content-Type': 'application/json', ...options.headers },
          ...options
        });
        return await res.json();
      } catch (e) {
        showToast('请求失败: ' + e.message, 'error');
        return null;
      }
    }

    function showToast(msg, type = 'success') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast toast-' + type + ' show';
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function openModal(title, bodyHtml) {
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').innerHTML = bodyHtml;
      document.getElementById('modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }

    function updateTime() {
      document.getElementById('currentTime').textContent = new Date().toLocaleString('zh-CN');
    }
    setInterval(updateTime, 1000);
    updateTime();

    function toggleSidebar() {
      const sb = document.getElementById('sidebar');
      const icon = document.getElementById('collapseIcon');
      sb.classList.toggle('collapsed');
      icon.classList.toggle('fa-angles-left');
      icon.classList.toggle('fa-angles-right');
    }

    // ===== 导航 =====
    const pageTitles = {
      dashboard: ['数据看板', '物业管理概览'],
      buildings: ['楼栋管理', '管理小区楼栋信息'],
      units: ['房屋管理', '管理房屋信息'],
      owners: ['业主管理', '管理业主信息'],
      bills: ['费用管理', '管理收费账单'],
      repairs: ['报修管理', '管理维修工单'],
      notices: ['公告管理', '管理社区公告']
    };

    function navigate(page) {
      currentPage = page;
      document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
      document.querySelector('[data-page="' + page + '"]')?.classList.add('active');
      document.getElementById('pageTitle').textContent = pageTitles[page]?.[0] || '';
      document.getElementById('pageSubtitle').textContent = pageTitles[page]?.[1] || '';
      const content = document.getElementById('pageContent');
      content.className = 'p-6 animate-fade-in';
      window['render_' + page]?.();
    }

    // ===== 数据看板 =====
    async function render_dashboard() {
      const res = await fetchAPI('/dashboard/stats');
      if (!res) return;
      const d = res.data;
      const occupancyRate = d.units.total > 0 ? ((d.units.occupied / d.units.total) * 100).toFixed(1) : '0.0';

      document.getElementById('pageContent').innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" onclick="navigate('buildings')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><i class="fas fa-city text-blue-500 text-xl"></i></div>
              <span class="badge badge-blue">楼栋</span>
            </div>
            <div class="text-3xl font-bold text-gray-800">\${d.buildings}</div>
            <div class="text-sm text-gray-400 mt-1">共 \${d.units.total} 套房屋</div>
          </div>
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" onclick="navigate('owners')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><i class="fas fa-users text-green-500 text-xl"></i></div>
              <span class="badge badge-green">入住率 \${occupancyRate}%</span>
            </div>
            <div class="text-3xl font-bold text-gray-800">\${d.owners}</div>
            <div class="text-sm text-gray-400 mt-1">在住业主</div>
          </div>
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" onclick="navigate('bills')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><i class="fas fa-coins text-amber-500 text-xl"></i></div>
              <span class="badge badge-yellow">收缴率 \${d.bills.collection_rate}%</span>
            </div>
            <div class="text-3xl font-bold text-gray-800">&yen;\${Number(d.bills.paid).toLocaleString()}</div>
            <div class="text-sm text-gray-400 mt-1">本月已收 / 应收 &yen;\${Number(d.bills.total).toLocaleString()}</div>
          </div>
          <div class="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100" onclick="navigate('repairs')">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center"><i class="fas fa-tools text-red-500 text-xl"></i></div>
              <span class="badge badge-red">\${d.repairs.pending} 待处理</span>
            </div>
            <div class="text-3xl font-bold text-gray-800">\${d.repairs.pending + d.repairs.processing}</div>
            <div class="text-sm text-gray-400 mt-1">进行中报修工单</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div class="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-chart-bar text-blue-500 mr-2"></i>收费趋势</h3>
            <canvas id="feeChart" height="120"></canvas>
          </div>
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-bullhorn text-purple-500 mr-2"></i>最新公告</h3>
            <div class="space-y-3">
              \${d.recentNotices.map(n => \`
                <div class="p-3 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition" onclick="navigate('notices')">
                  <div class="flex items-center gap-2 mb-1">
                    \${n.is_top ? '<span class="badge badge-red text-xs">置顶</span>' : ''}
                    <span class="badge badge-\${n.category === '紧急' ? 'red' : n.category === '活动' ? 'purple' : 'blue'} text-xs">\${n.category}</span>
                  </div>
                  <div class="text-sm font-medium text-gray-700 truncate">\${n.title}</div>
                  <div class="text-xs text-gray-400 mt-1">\${n.publish_date || ''}</div>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-wrench text-orange-500 mr-2"></i>最近报修</h3>
          <div class="table-container">
            <table>
              <thead><tr>
                <th>工单号</th><th>标题</th><th>位置</th><th>报修人</th><th>优先级</th><th>状态</th><th>时间</th>
              </tr></thead>
              <tbody>
                \${d.recentRepairs.map(r => \`<tr>
                  <td class="text-blue-500 font-medium">#\${r.id}</td>
                  <td>\${r.title}</td>
                  <td>\${r.building_name || ''} \${r.unit_number || ''}</td>
                  <td>\${r.owner_name || '-'}</td>
                  <td><span class="badge badge-\${r.priority === '紧急' ? 'red' : 'gray'}">\${r.priority}</span></td>
                  <td><span class="badge badge-\${r.status === '已完成' ? 'green' : r.status === '处理中' ? 'blue' : 'yellow'}">\${r.status}</span></td>
                  <td class="text-gray-400 text-sm">\${(r.created_at||'').slice(0,10)}</td>
                </tr>\`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \`;

      // 绘制图表
      if (dashboardChart) dashboardChart.destroy();
      const ctx = document.getElementById('feeChart')?.getContext('2d');
      if (ctx) {
        dashboardChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: d.feesTrend.map(t => t.month),
            datasets: [
              { label: '应收金额', data: d.feesTrend.map(t => t.total), backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6', borderWidth: 2, borderRadius: 6 },
              { label: '实收金额', data: d.feesTrend.map(t => t.paid), backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981', borderWidth: 2, borderRadius: 6 }
            ]
          },
          options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '¥' + v } } } }
        });
      }
    }

    // ===== 楼栋管理 =====
    async function render_buildings() {
      const res = await fetchAPI('/buildings');
      if (!res) return;
      document.getElementById('pageContent').innerHTML = \`
        <div class="flex items-center justify-between mb-5">
          <span class="text-gray-500">共 \${res.data.length} 栋楼</span>
          <button class="btn btn-primary" onclick="showBuildingForm()"><i class="fas fa-plus"></i>新增楼栋</button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="table-container">
            <table>
              <thead><tr><th>ID</th><th>楼栋名称</th><th>地址</th><th>楼层数</th><th>每层户数</th><th>操作</th></tr></thead>
              <tbody>
                \${res.data.map(b => \`<tr>
                  <td class="font-medium text-gray-500">\${b.id}</td>
                  <td class="font-semibold text-gray-800">\${b.name}</td>
                  <td>\${b.address || '-'}</td>
                  <td>\${b.floors}</td>
                  <td>\${b.units_per_floor}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick='showBuildingForm(\${JSON.stringify(b)})'><i class="fas fa-edit"></i>编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteItem('/buildings/\${b.id}', render_buildings)"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>\`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \`;
    }

    function showBuildingForm(item = null) {
      const isEdit = !!item;
      openModal(isEdit ? '编辑楼栋' : '新增楼栋', \`
        <form onsubmit="submitBuilding(event, \${item?.id || 'null'})">
          <div class="form-group"><label>楼栋名称 *</label><input id="f_name" value="\${item?.name || ''}" required></div>
          <div class="form-group"><label>地址</label><input id="f_address" value="\${item?.address || ''}"></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>楼层数</label><input type="number" id="f_floors" value="\${item?.floors || 18}" min="1"></div>
            <div class="form-group"><label>每层户数</label><input type="number" id="f_units" value="\${item?.units_per_floor || 4}" min="1"></div>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
            <button type="submit" class="btn btn-primary">\${isEdit ? '保存' : '创建'}</button>
          </div>
        </form>
      \`);
    }

    async function submitBuilding(e, id) {
      e.preventDefault();
      const body = { name: f_name.value, address: f_address.value, floors: +f_floors.value, units_per_floor: +f_units.value };
      const res = id 
        ? await fetchAPI('/buildings/' + id, { method: 'PUT', body: JSON.stringify(body) })
        : await fetchAPI('/buildings', { method: 'POST', body: JSON.stringify(body) });
      if (res) { showToast(id ? '更新成功' : '创建成功'); closeModal(); render_buildings(); }
    }

    // ===== 房屋管理 =====
    async function render_units() {
      const [unitsRes, buildingsRes] = await Promise.all([fetchAPI('/units'), fetchAPI('/buildings')]);
      if (!unitsRes) return;
      window._buildings = buildingsRes?.data || [];

      document.getElementById('pageContent').innerHTML = \`
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <select id="filterBuilding" class="px-3 py-2 border rounded-lg text-sm" onchange="filterUnits()">
              <option value="">全部楼栋</option>
              \${window._buildings.map(b => '<option value="'+b.id+'">'+b.name+'</option>').join('')}
            </select>
            <select id="filterStatus" class="px-3 py-2 border rounded-lg text-sm" onchange="filterUnits()">
              <option value="">全部状态</option><option>已入住</option><option>空置</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="showUnitForm()"><i class="fas fa-plus"></i>新增房屋</button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="table-container"><table>
            <thead><tr><th>ID</th><th>楼栋</th><th>房号</th><th>楼层</th><th>面积(㎡)</th><th>类型</th><th>状态</th><th>操作</th></tr></thead>
            <tbody id="unitsBody">
              \${unitsRes.data.map(u => unitRow(u)).join('')}
            </tbody>
          </table></div>
        </div>
      \`;
    }

    function unitRow(u) {
      return \`<tr>
        <td class="font-medium text-gray-500">\${u.id}</td>
        <td>\${u.building_name || '-'}</td>
        <td class="font-semibold">\${u.unit_number}</td>
        <td>\${u.floor}F</td>
        <td>\${u.area}</td>
        <td><span class="badge badge-\${u.unit_type === '商铺' ? 'purple' : 'blue'}">\${u.unit_type}</span></td>
        <td><span class="badge badge-\${u.status === '已入住' ? 'green' : 'gray'}">\${u.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick='showUnitForm(\${JSON.stringify(u)})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('/units/\${u.id}', render_units)"><i class="fas fa-trash"></i></button>
        </td>
      </tr>\`;
    }

    async function filterUnits() {
      let q = '/units?';
      if (filterBuilding.value) q += 'building_id=' + filterBuilding.value + '&';
      if (filterStatus.value) q += 'status=' + filterStatus.value;
      const res = await fetchAPI(q);
      if (res) document.getElementById('unitsBody').innerHTML = res.data.map(u => unitRow(u)).join('');
    }

    function showUnitForm(item = null) {
      const isEdit = !!item;
      openModal(isEdit ? '编辑房屋' : '新增房屋', \`
        <form onsubmit="submitUnit(event, \${item?.id || 'null'})">
          <div class="form-group"><label>楼栋 *</label>
            <select id="f_building_id" required>
              <option value="">请选择</option>
              \${(window._buildings||[]).map(b => '<option value="'+b.id+'" '+(item?.building_id==b.id?'selected':'')+'>'+b.name+'</option>').join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>房号 *</label><input id="f_unit_number" value="\${item?.unit_number||''}" required></div>
            <div class="form-group"><label>楼层</label><input type="number" id="f_floor" value="\${item?.floor||1}" min="1"></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>面积(㎡)</label><input type="number" step="0.1" id="f_area" value="\${item?.area||0}"></div>
            <div class="form-group"><label>类型</label>
              <select id="f_unit_type"><option \${item?.unit_type==='住宅'?'selected':''}>住宅</option><option \${item?.unit_type==='商铺'?'selected':''}>商铺</option><option \${item?.unit_type==='车位'?'selected':''}>车位</option></select>
            </div>
          </div>
          <div class="form-group"><label>状态</label>
            <select id="f_unit_status"><option \${item?.status==='已入住'?'selected':''}>已入住</option><option \${item?.status==='空置'?'selected':''}>空置</option></select>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
            <button type="submit" class="btn btn-primary">\${isEdit?'保存':'创建'}</button>
          </div>
        </form>
      \`);
    }

    async function submitUnit(e, id) {
      e.preventDefault();
      const body = { building_id: +f_building_id.value, unit_number: f_unit_number.value, floor: +f_floor.value, area: +f_area.value, unit_type: f_unit_type.value, status: f_unit_status.value };
      const res = id
        ? await fetchAPI('/units/' + id, { method: 'PUT', body: JSON.stringify(body) })
        : await fetchAPI('/units', { method: 'POST', body: JSON.stringify(body) });
      if (res) { showToast(id?'更新成功':'创建成功'); closeModal(); render_units(); }
    }

    // ===== 业主管理 =====
    async function render_owners() {
      const [ownersRes, unitsRes] = await Promise.all([fetchAPI('/owners'), fetchAPI('/units')]);
      if (!ownersRes) return;
      window._units = unitsRes?.data || [];

      document.getElementById('pageContent').innerHTML = \`
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <div class="relative">
              <input id="searchOwner" placeholder="搜索姓名/手机号..." class="pl-10 pr-4 py-2 border rounded-lg text-sm w-64" onkeyup="searchOwners()">
              <i class="fas fa-search absolute left-3 top-3 text-gray-400 text-sm"></i>
            </div>
          </div>
          <button class="btn btn-primary" onclick="showOwnerForm()"><i class="fas fa-plus"></i>新增业主</button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="table-container"><table>
            <thead><tr><th>ID</th><th>姓名</th><th>手机号</th><th>楼栋/房号</th><th>入住日期</th><th>状态</th><th>操作</th></tr></thead>
            <tbody id="ownersBody">
              \${ownersRes.data.map(o => ownerRow(o)).join('')}
            </tbody>
          </table></div>
        </div>
      \`;
    }

    function ownerRow(o) {
      return \`<tr>
        <td class="font-medium text-gray-500">\${o.id}</td>
        <td class="font-semibold text-gray-800">\${o.name}</td>
        <td>\${o.phone || '-'}</td>
        <td>\${o.building_name || ''} \${o.unit_number || '-'}</td>
        <td>\${o.move_in_date || '-'}</td>
        <td><span class="badge badge-\${o.status==='在住'?'green':'gray'}">\${o.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick='showOwnerForm(\${JSON.stringify(o)})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('/owners/\${o.id}', render_owners)"><i class="fas fa-trash"></i></button>
        </td>
      </tr>\`;
    }

    async function searchOwners() {
      const kw = searchOwner.value;
      const res = await fetchAPI('/owners?keyword=' + encodeURIComponent(kw));
      if (res) document.getElementById('ownersBody').innerHTML = res.data.map(o => ownerRow(o)).join('');
    }

    function showOwnerForm(item = null) {
      const isEdit = !!item;
      openModal(isEdit ? '编辑业主' : '新增业主', \`
        <form onsubmit="submitOwner(event, \${item?.id || 'null'})">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>姓名 *</label><input id="f_owner_name" value="\${item?.name||''}" required></div>
            <div class="form-group"><label>手机号</label><input id="f_phone" value="\${item?.phone||''}"></div>
          </div>
          <div class="form-group"><label>身份证号</label><input id="f_id_card" value="\${item?.id_card||''}"></div>
          <div class="form-group"><label>关联房屋</label>
            <select id="f_unit_id">
              <option value="">请选择</option>
              \${(window._units||[]).map(u => '<option value="'+u.id+'" '+(item?.unit_id==u.id?'selected':'')+'>'+(u.building_name||'')+' '+u.unit_number+'</option>').join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>入住日期</label><input type="date" id="f_move_in" value="\${item?.move_in_date||''}"></div>
            <div class="form-group"><label>状态</label>
              <select id="f_owner_status"><option \${item?.status==='在住'?'selected':''}>在住</option><option \${item?.status==='已搬出'?'selected':''}>已搬出</option></select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
            <button type="submit" class="btn btn-primary">\${isEdit?'保存':'创建'}</button>
          </div>
        </form>
      \`);
    }

    async function submitOwner(e, id) {
      e.preventDefault();
      const body = { name: f_owner_name.value, phone: f_phone.value, id_card: f_id_card.value, unit_id: f_unit_id.value?+f_unit_id.value:null, move_in_date: f_move_in.value, status: f_owner_status.value };
      const res = id
        ? await fetchAPI('/owners/' + id, { method: 'PUT', body: JSON.stringify(body) })
        : await fetchAPI('/owners', { method: 'POST', body: JSON.stringify(body) });
      if (res) { showToast(id?'更新成功':'创建成功'); closeModal(); render_owners(); }
    }

    // ===== 费用管理 =====
    async function render_bills() {
      const [billsRes, statsRes, unitsRes, ownersRes, feeTypesRes] = await Promise.all([
        fetchAPI('/bills'), fetchAPI('/bills/stats'), fetchAPI('/units'), fetchAPI('/owners'), fetchAPI('/bills/fee-types')
      ]);
      if (!billsRes) return;
      window._units = unitsRes?.data || [];
      window._owners = ownersRes?.data || [];
      window._feeTypes = feeTypesRes?.data || [];
      const s = statsRes?.data || {};

      document.getElementById('pageContent').innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-sm text-gray-400 mb-1">本月应收</div><div class="text-2xl font-bold text-gray-800">&yen;\${Number(s.total?.total||0).toLocaleString()}</div></div>
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-sm text-gray-400 mb-1">已收金额</div><div class="text-2xl font-bold text-green-600">&yen;\${Number(s.paid?.total||0).toLocaleString()}</div></div>
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-sm text-gray-400 mb-1">未缴金额</div><div class="text-2xl font-bold text-amber-600">&yen;\${Number(s.unpaid?.total||0).toLocaleString()}</div></div>
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="text-sm text-gray-400 mb-1">逾期金额</div><div class="text-2xl font-bold text-red-600">&yen;\${Number(s.overdue?.total||0).toLocaleString()}</div></div>
        </div>
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <select id="filterBillStatus" class="px-3 py-2 border rounded-lg text-sm" onchange="filterBills()">
              <option value="">全部状态</option><option>未缴</option><option>已缴</option><option>逾期</option>
            </select>
            <input type="month" id="filterBillMonth" class="px-3 py-2 border rounded-lg text-sm" onchange="filterBills()">
          </div>
          <button class="btn btn-primary" onclick="showBillForm()"><i class="fas fa-plus"></i>新增账单</button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="table-container"><table>
            <thead><tr><th>ID</th><th>房屋</th><th>业主</th><th>费用类型</th><th>金额</th><th>月份</th><th>状态</th><th>操作</th></tr></thead>
            <tbody id="billsBody">
              \${billsRes.data.map(b => billRow(b)).join('')}
            </tbody>
          </table></div>
        </div>
      \`;
    }

    function billRow(b) {
      return \`<tr>
        <td class="font-medium text-gray-500">\${b.id}</td>
        <td>\${b.building_name||''} \${b.unit_number||''}</td>
        <td>\${b.owner_name||'-'}</td>
        <td>\${b.fee_type_name||'-'}</td>
        <td class="font-semibold">&yen;\${Number(b.amount).toFixed(2)}</td>
        <td>\${b.bill_month}</td>
        <td><span class="badge badge-\${b.status==='已缴'?'green':b.status==='逾期'?'red':'yellow'}">\${b.status}</span></td>
        <td>
          \${b.status !== '已缴' ? '<button class="btn btn-primary btn-sm" onclick="payBill('+b.id+')"><i class="fas fa-check"></i>缴费</button>' : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteItem('/bills/\${b.id}', render_bills)"><i class="fas fa-trash"></i></button>
        </td>
      </tr>\`;
    }

    async function filterBills() {
      let q = '/bills?';
      if (filterBillStatus.value) q += 'status=' + filterBillStatus.value + '&';
      if (filterBillMonth.value) q += 'month=' + filterBillMonth.value;
      const res = await fetchAPI(q);
      if (res) document.getElementById('billsBody').innerHTML = res.data.map(b => billRow(b)).join('');
    }

    async function payBill(id) {
      if (!confirm('确认缴费？')) return;
      const res = await fetchAPI('/bills/' + id + '/pay', { method: 'POST' });
      if (res) { showToast('缴费成功'); render_bills(); }
    }

    function showBillForm() {
      openModal('新增账单', \`
        <form onsubmit="submitBill(event)">
          <div class="form-group"><label>房屋 *</label>
            <select id="f_bill_unit" required onchange="autofillOwner()">
              <option value="">请选择</option>
              \${(window._units||[]).map(u => '<option value="'+u.id+'">'+(u.building_name||'')+' '+u.unit_number+'</option>').join('')}
            </select>
          </div>
          <div class="form-group"><label>业主</label>
            <select id="f_bill_owner">
              <option value="">自动匹配</option>
              \${(window._owners||[]).map(o => '<option value="'+o.id+'">'+o.name+'</option>').join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>费用类型 *</label>
              <select id="f_fee_type" required>
                \${(window._feeTypes||[]).map(f => '<option value="'+f.id+'">'+f.name+' ('+f.unit_price+f.unit_label+')</option>').join('')}
              </select>
            </div>
            <div class="form-group"><label>金额 *</label><input type="number" step="0.01" id="f_bill_amount" required></div>
          </div>
          <div class="form-group"><label>账单月份 *</label><input type="month" id="f_bill_month" value="\${new Date().toISOString().slice(0,7)}" required></div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
            <button type="submit" class="btn btn-primary">创建</button>
          </div>
        </form>
      \`);
    }

    function autofillOwner() {
      const uid = +f_bill_unit.value;
      const owner = (window._owners||[]).find(o => o.unit_id === uid);
      if (owner) f_bill_owner.value = owner.id;
    }

    async function submitBill(e) {
      e.preventDefault();
      const body = { unit_id: +f_bill_unit.value, owner_id: f_bill_owner.value?+f_bill_owner.value:null, fee_type_id: +f_fee_type.value, amount: +f_bill_amount.value, bill_month: f_bill_month.value };
      const res = await fetchAPI('/bills', { method: 'POST', body: JSON.stringify(body) });
      if (res) { showToast('创建成功'); closeModal(); render_bills(); }
    }

    // ===== 报修管理 =====
    async function render_repairs() {
      const [repairsRes, statsRes] = await Promise.all([fetchAPI('/repairs'), fetchAPI('/repairs/stats')]);
      if (!repairsRes) return;
      const s = statsRes?.data || {};

      document.getElementById('pageContent').innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-400"></div><span class="text-sm text-gray-500">待处理</span></div><div class="text-2xl font-bold mt-1">\${s.pending?.count||0}</div></div>
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-400"></div><span class="text-sm text-gray-500">处理中</span></div><div class="text-2xl font-bold mt-1">\${s.processing?.count||0}</div></div>
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-400"></div><span class="text-sm text-gray-500">已完成</span></div><div class="text-2xl font-bold mt-1">\${s.completed?.count||0}</div></div>
          <div class="bg-white rounded-xl p-4 shadow-sm border"><div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-400"></div><span class="text-sm text-gray-500">紧急未处理</span></div><div class="text-2xl font-bold mt-1 text-red-600">\${s.urgent?.count||0}</div></div>
        </div>
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <select id="filterRepairStatus" class="px-3 py-2 border rounded-lg text-sm" onchange="filterRepairs()">
              <option value="">全部状态</option><option>待处理</option><option>处理中</option><option>已完成</option>
            </select>
            <select id="filterRepairPriority" class="px-3 py-2 border rounded-lg text-sm" onchange="filterRepairs()">
              <option value="">全部优先级</option><option>普通</option><option>紧急</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="showRepairForm()"><i class="fas fa-plus"></i>新增报修</button>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="table-container"><table>
            <thead><tr><th>工单号</th><th>标题</th><th>位置</th><th>报修人</th><th>分类</th><th>优先级</th><th>负责人</th><th>状态</th><th>操作</th></tr></thead>
            <tbody id="repairsBody">
              \${repairsRes.data.map(r => repairRow(r)).join('')}
            </tbody>
          </table></div>
        </div>
      \`;
    }

    function repairRow(r) {
      return \`<tr>
        <td class="text-blue-500 font-medium">#\${r.id}</td>
        <td class="font-semibold">\${r.title}</td>
        <td>\${r.building_name||''} \${r.unit_number||''}</td>
        <td>\${r.owner_name||'-'}</td>
        <td><span class="badge badge-blue">\${r.category}</span></td>
        <td><span class="badge badge-\${r.priority==='紧急'?'red':'gray'}">\${r.priority}</span></td>
        <td>\${r.assigned_to||'-'}</td>
        <td><span class="badge badge-\${r.status==='已完成'?'green':r.status==='处理中'?'blue':'yellow'}">\${r.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick='showRepairForm(\${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('/repairs/\${r.id}', render_repairs)"><i class="fas fa-trash"></i></button>
        </td>
      </tr>\`;
    }

    async function filterRepairs() {
      let q = '/repairs?';
      if (filterRepairStatus.value) q += 'status=' + filterRepairStatus.value + '&';
      if (filterRepairPriority.value) q += 'priority=' + filterRepairPriority.value;
      const res = await fetchAPI(q);
      if (res) document.getElementById('repairsBody').innerHTML = res.data.map(r => repairRow(r)).join('');
    }

    async function showRepairForm(item = null) {
      const isEdit = !!item;
      if (!window._units) { const r = await fetchAPI('/units'); window._units = r?.data||[]; }
      if (!window._owners) { const r = await fetchAPI('/owners'); window._owners = r?.data||[]; }

      openModal(isEdit ? '编辑报修' : '新增报修', \`
        <form onsubmit="submitRepair(event, \${item?.id || 'null'})">
          <div class="form-group"><label>标题 *</label><input id="f_repair_title" value="\${item?.title||''}" required></div>
          <div class="form-group"><label>描述</label><textarea id="f_repair_desc" rows="3">\${item?.description||''}</textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>房屋</label>
              <select id="f_repair_unit"><option value="">公共区域</option>
                \${(window._units||[]).map(u => '<option value="'+u.id+'" '+(item?.unit_id==u.id?'selected':'')+'>'+(u.building_name||'')+' '+u.unit_number+'</option>').join('')}
              </select>
            </div>
            <div class="form-group"><label>报修人</label>
              <select id="f_repair_owner"><option value="">匿名</option>
                \${(window._owners||[]).map(o => '<option value="'+o.id+'" '+(item?.owner_id==o.id?'selected':'')+'>'+o.name+'</option>').join('')}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>分类</label>
              <select id="f_repair_cat"><option \${item?.category==='公共设施'?'selected':''}>公共设施</option><option \${item?.category==='室内维修'?'selected':''}>室内维修</option><option \${item?.category==='安全隐患'?'selected':''}>安全隐患</option><option \${item?.category==='环境卫生'?'selected':''}>环境卫生</option></select>
            </div>
            <div class="form-group"><label>优先级</label>
              <select id="f_repair_pri"><option \${item?.priority==='普通'?'selected':''}>普通</option><option \${item?.priority==='紧急'?'selected':''}>紧急</option></select>
            </div>
          </div>
          \${isEdit ? \`
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>状态</label>
              <select id="f_repair_status"><option \${item?.status==='待处理'?'selected':''}>待处理</option><option \${item?.status==='处理中'?'selected':''}>处理中</option><option \${item?.status==='已完成'?'selected':''}>已完成</option></select>
            </div>
            <div class="form-group"><label>负责人</label><input id="f_repair_assign" value="\${item?.assigned_to||''}"></div>
          </div>
          \` : ''}
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
            <button type="submit" class="btn btn-primary">\${isEdit?'保存':'创建'}</button>
          </div>
        </form>
      \`);
    }

    async function submitRepair(e, id) {
      e.preventDefault();
      const body = { title: f_repair_title.value, description: f_repair_desc.value, unit_id: f_repair_unit.value?+f_repair_unit.value:null, owner_id: f_repair_owner.value?+f_repair_owner.value:null, category: f_repair_cat.value, priority: f_repair_pri.value };
      if (id) { body.status = f_repair_status.value; body.assigned_to = f_repair_assign.value; }
      const res = id
        ? await fetchAPI('/repairs/' + id, { method: 'PUT', body: JSON.stringify(body) })
        : await fetchAPI('/repairs', { method: 'POST', body: JSON.stringify(body) });
      if (res) { showToast(id?'更新成功':'创建成功'); closeModal(); render_repairs(); }
    }

    // ===== 公告管理 =====
    async function render_notices() {
      const res = await fetchAPI('/notices');
      if (!res) return;

      document.getElementById('pageContent').innerHTML = \`
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <select id="filterNoticeCat" class="px-3 py-2 border rounded-lg text-sm" onchange="filterNotices()">
              <option value="">全部分类</option><option>通知</option><option>活动</option><option>紧急</option>
            </select>
            <select id="filterNoticeStatus" class="px-3 py-2 border rounded-lg text-sm" onchange="filterNotices()">
              <option value="">全部状态</option><option>已发布</option><option>草稿</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="showNoticeForm()"><i class="fas fa-plus"></i>发布公告</button>
        </div>
        <div class="space-y-4" id="noticesList">
          \${res.data.map(n => noticeCard(n)).join('')}
        </div>
      \`;
    }

    function noticeCard(n) {
      return \`
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                \${n.is_top ? '<span class="badge badge-red"><i class="fas fa-thumbtack mr-1"></i>置顶</span>' : ''}
                <span class="badge badge-\${n.category==='紧急'?'red':n.category==='活动'?'purple':'blue'}">\${n.category}</span>
                <span class="badge badge-\${n.status==='已发布'?'green':'gray'}">\${n.status}</span>
              </div>
              <h4 class="text-lg font-bold text-gray-800 mb-2">\${n.title}</h4>
              <p class="text-sm text-gray-500 whitespace-pre-line line-clamp-3">\${n.content}</p>
              <div class="text-xs text-gray-400 mt-3"><i class="far fa-calendar mr-1"></i>\${n.publish_date || ''}</div>
            </div>
            <div class="flex gap-2 ml-4 flex-shrink-0">
              <button class="btn btn-outline btn-sm" onclick='showNoticeForm(\${JSON.stringify(n)})'><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteItem('/notices/\${n.id}', render_notices)"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      \`;
    }

    async function filterNotices() {
      let q = '/notices?';
      if (filterNoticeCat.value) q += 'category=' + filterNoticeCat.value + '&';
      if (filterNoticeStatus.value) q += 'status=' + filterNoticeStatus.value;
      const res = await fetchAPI(q);
      if (res) document.getElementById('noticesList').innerHTML = res.data.map(n => noticeCard(n)).join('');
    }

    function showNoticeForm(item = null) {
      const isEdit = !!item;
      openModal(isEdit ? '编辑公告' : '发布公告', \`
        <form onsubmit="submitNotice(event, \${item?.id || 'null'})">
          <div class="form-group"><label>标题 *</label><input id="f_notice_title" value="\${item?.title||''}" required></div>
          <div class="form-group"><label>内容 *</label><textarea id="f_notice_content" rows="6" required>\${item?.content||''}</textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>分类</label>
              <select id="f_notice_cat"><option \${item?.category==='通知'?'selected':''}>通知</option><option \${item?.category==='活动'?'selected':''}>活动</option><option \${item?.category==='紧急'?'selected':''}>紧急</option></select>
            </div>
            <div class="form-group"><label>状态</label>
              <select id="f_notice_status"><option \${item?.status==='已发布'?'selected':''}>已发布</option><option \${item?.status==='草稿'?'selected':''}>草稿</option></select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label>发布日期</label><input type="date" id="f_notice_date" value="\${item?.publish_date||new Date().toISOString().slice(0,10)}"></div>
            <div class="form-group"><label>置顶</label>
              <select id="f_notice_top"><option value="0" \${!item?.is_top?'selected':''}>否</option><option value="1" \${item?.is_top?'selected':''}>是</option></select>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
            <button type="submit" class="btn btn-primary">\${isEdit?'保存':'发布'}</button>
          </div>
        </form>
      \`);
    }

    async function submitNotice(e, id) {
      e.preventDefault();
      const body = { title: f_notice_title.value, content: f_notice_content.value, category: f_notice_cat.value, status: f_notice_status.value, publish_date: f_notice_date.value, is_top: +f_notice_top.value };
      const res = id
        ? await fetchAPI('/notices/' + id, { method: 'PUT', body: JSON.stringify(body) })
        : await fetchAPI('/notices', { method: 'POST', body: JSON.stringify(body) });
      if (res) { showToast(id?'更新成功':'发布成功'); closeModal(); render_notices(); }
    }

    // ===== 通用删除 =====
    async function deleteItem(path, callback) {
      if (!confirm('确认删除？此操作不可恢复。')) return;
      const res = await fetchAPI(path, { method: 'DELETE' });
      if (res) { showToast('删除成功'); callback(); }
    }

    // ===== 初始化 =====
    navigate('dashboard');
  </script>
</body>
</html>`;
  return c.html(html)
})

export default app
