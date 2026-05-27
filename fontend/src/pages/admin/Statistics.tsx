import React from 'react';
import { Col, Row, Spin, Empty } from 'antd';
import { Column, Pie } from '@ant-design/charts';
import { useQuery } from '@tanstack/react-query';
import {
  BarChartOutlined, PieChartOutlined, BankOutlined, BookOutlined,
} from '@ant-design/icons';
import * as applicationService from '../../services/applicationService';

const statusMap: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_COLORS: Record<string, string> = {
  'Nháp': '#9ca3af',
  'Đã nộp': '#3b82f6',
  'Chờ duyệt': '#f97316',
  'Đã duyệt': '#22c55e',
  'Từ chối': '#ef4444',
};

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, icon, children, accent = '#B30000' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
        style={{ backgroundColor: accent }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-700 m-0">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Statistics: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const res = await applicationService.getStatistics();
      return res.data;
    },
  });

  const totalApplications = (data?.byStatus || []).reduce((s: number, i: any) => s + i.total, 0);

  const schoolColumnConfig = {
    data: data?.bySchool || [],
    xField: 'school',
    yField: 'total',
    color: '#B30000',
    columnStyle: { radius: [6, 6, 0, 0] },
    label: { position: 'top' as const, style: { fill: '#6b7280', fontSize: 11 } },
    xAxis: { label: { autoRotate: true, autoHide: true, style: { fill: '#9ca3af', fontSize: 11 } } },
    yAxis: { label: { style: { fill: '#9ca3af', fontSize: 11 } }, grid: { line: { style: { stroke: '#f3f4f6' } } } },
    meta: { total: { alias: 'Số lượng hồ sơ' } },
    tooltip: { formatter: (d: any) => ({ name: 'Hồ sơ', value: d.total }) },
  };

  const majorColumnConfig = {
    data: data?.byMajor || [],
    xField: 'major',
    yField: 'total',
    color: '#0038F7',
    columnStyle: { radius: [6, 6, 0, 0] },
    label: { position: 'top' as const, style: { fill: '#6b7280', fontSize: 11 } },
    xAxis: { label: { autoRotate: true, autoHide: true, style: { fill: '#9ca3af', fontSize: 11 } } },
    yAxis: { label: { style: { fill: '#9ca3af', fontSize: 11 } }, grid: { line: { style: { stroke: '#f3f4f6' } } } },
    meta: { total: { alias: 'Số lượng hồ sơ' } },
    tooltip: { formatter: (d: any) => ({ name: 'Hồ sơ', value: d.total }) },
  };

  const statusPieData = (data?.byStatus || []).map((item: any) => ({
    ...item,
    status: statusMap[item.status] || item.status,
  }));

  const statusPieConfig = {
    data: statusPieData,
    angleField: 'total',
    colorField: 'status',
    color: ({ status }: any) => STATUS_COLORS[status] || '#9ca3af',
    radius: 0.8,
    label: {
      type: 'inner',
      content: '{percentage}',
      style: { fontSize: 12, fill: '#fff', textAlign: 'center' },
    },
    legend: {
      position: 'bottom' as const,
      itemName: { style: { fontSize: 12, fill: '#374151' } },
    },
    statistic: {
      title: { content: 'Tổng', style: { fontSize: 14, color: '#6b7280' } },
      content: { content: `${totalApplications}`, style: { fontSize: 24, color: '#111827', fontWeight: 700 } },
    },
    interactions: [{ type: 'element-active' }],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spin size="large" />
          <p className="text-gray-400 text-sm">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
        <Empty description="Không có dữ liệu thống kê" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 p-4 md:p-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 bg-[#B30000] rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-gray-800 m-0 leading-tight">Thống kê</h1>
          <p className="text-xs text-gray-400 mt-0.5">Phân tích dữ liệu hồ sơ</p>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ChartCard title="Hồ sơ theo Trường" icon={<BankOutlined />} accent="#B30000">
            {data.bySchool?.length > 0
              ? <Column {...schoolColumnConfig} height={260} />
              : <Empty description="Chưa có dữ liệu" className="py-8" />}
          </ChartCard>
        </Col>

        <Col xs={24} lg={12}>
          <ChartCard title="Hồ sơ theo Ngành" icon={<BookOutlined />} accent="#0038F7">
            {data.byMajor?.length > 0
              ? <Column {...majorColumnConfig} height={260} />
              : <Empty description="Chưa có dữ liệu" className="py-8" />}
          </ChartCard>
        </Col>

        <Col xs={24} lg={12}>
          <ChartCard title="Tỉ lệ trạng thái hồ sơ" icon={<PieChartOutlined />} accent="#8B716D">
            {data.byStatus?.length > 0
              ? <Pie {...statusPieConfig} height={300} />
              : <Empty description="Chưa có dữ liệu" className="py-8" />}
          </ChartCard>
        </Col>

        {/* Chi tiết trạng thái dạng danh sách */}
        <Col xs={24} lg={12}>
          <ChartCard title="Chi tiết trạng thái" icon={<BarChartOutlined />} accent="#B30000">
            <div className="space-y-3 py-1">
              {statusPieData.length > 0 ? statusPieData.map((item: any) => {
                const pct = totalApplications > 0 ? Math.round((item.total / totalApplications) * 100) : 0;
                const color = STATUS_COLORS[item.status] || '#9ca3af';
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm text-gray-700">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{item.total}</span>
                        <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              }) : <Empty description="Chưa có dữ liệu" className="py-8" />}
            </div>
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;