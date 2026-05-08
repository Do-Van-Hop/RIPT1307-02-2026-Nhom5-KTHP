import React from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Empty, Typography } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Column } from '@ant-design/charts';
import * as applicationService from '../../services/applicationService';

const { Title } = Typography;

const statusMap: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const statusColor: Record<string, string> = {
  DRAFT: '#d9d9d9',
  SUBMITTED: '#1890ff',
  PENDING: '#fa8c16',
  APPROVED: '#52c41a',
  REJECTED: '#f5222d',
};

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const res = await applicationService.getStatistics();
      return res.data;
    },
  });

  const { data: recentApps, isLoading: recentLoading } = useQuery({
    queryKey: ['recentApplications', 10],
    queryFn: async () => {
      // Giả sử API hỗ trợ sort, nếu không thì lấy danh sách mới nhất từ kết quả trả về.
      // Ở đây dùng getAllApplications với page=1, limit=10, và có thể thêm sort (nếu backend hỗ trợ)
      const res = await applicationService.getAllApplications({ page: 1, limit: 10 });
      // Nếu API trả về items, dùng luôn; nếu không thì trả về mảng rỗng
      return res.data?.items || [];
    },
  });

  const totalApplications = stats?.byStatus?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
  const pendingCount = stats?.byStatus?.find((item: any) => item.status === 'PENDING')?.count || 0;
  const approvedCount = stats?.byStatus?.find((item: any) => item.status === 'APPROVED')?.count || 0;
  const rejectedCount = stats?.byStatus?.find((item: any) => item.status === 'REJECTED')?.count || 0;

  const schoolChartData = stats?.bySchool?.slice(0, 5).map((item: any) => ({
    schoolName: item.schoolName,
    count: item.count,
  })) || [];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Thí sinh', dataIndex: ['user', 'email'], key: 'email' },
    { title: 'Trường', dataIndex: ['school', 'name'], key: 'school' },
    { title: 'Ngành', dataIndex: ['major', 'name'], key: 'major' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: statusColor[status], fontWeight: 500 }}>
          {statusMap[status] || status}
        </span>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : '-'),
    },
  ];

  if (statsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Tổng quan
      </Title>

      {/* Hàng thẻ số liệu */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng hồ sơ"
              value={totalApplications}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ duyệt"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã duyệt"
              value={approvedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Từ chối"
              value={rejectedCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Hàng biểu đồ Top 5 trường */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Top 5 trường có nhiều hồ sơ nhất">
            {schoolChartData.length > 0 ? (
              <Column
                data={schoolChartData}
                xField="schoolName"
                yField="count"
                label={{ position: 'top', style: { fill: '#000' } }}
                xAxis={{ label: { autoRotate: true, autoHide: true } }}
                meta={{ count: { alias: 'Số lượng hồ sơ' } }}
              />
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Hàng bảng hồ sơ mới nhất (10 mới nhất) */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="10 hồ sơ mới nhất">
            <Table
              dataSource={recentApps}
              columns={columns}
              rowKey="id"
              loading={recentLoading}
              pagination={false}
              size="middle"
              locale={{ emptyText: 'Chưa có hồ sơ nào' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;