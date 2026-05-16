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
import { useAllMajors } from '../../hooks/useAllMajors';
import * as catalogService from '../../services/catalogService';

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
      const res = await applicationService.getAllApplications({ page: 1, limit: 10 });
      return res.data?.items || [];
    },
  });
  const { data: allMajorsData } = useAllMajors();
  const majorMap = allMajorsData?.map || new Map();

  const { data: subjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data,
  });
  const subjectGroupMap = new Map(subjectGroups?.map((sg: any) => [sg.id, sg.name]));

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data,
  });

  const totalApplications = stats?.byStatus?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
  const pendingCount = stats?.byStatus?.find((item: any) => item.status === 'PENDING')?.total || 0;
  const approvedCount = stats?.byStatus?.find((item: any) => item.status === 'APPROVED')?.total || 0;
  const rejectedCount = stats?.byStatus?.find((item: any) => item.status === 'REJECTED')?.total || 0;

  const schoolChartData = stats?.bySchool?.slice(0, 5).map((item: any) => ({
    schoolName: item.school,
    count: item.total,
  })) || [];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Thí sinh ID', dataIndex: 'user_id', key: 'user_id' },
    {
      title: 'Trường',
      dataIndex: 'school_id',
      key: 'school_id',
      render: (id: number) => {
        const school = schoolsData?.find((s: any) => s.id === id);
        return school?.name || `ID: ${id}`;
      }
    },
    {
      title: 'Ngành',
      dataIndex: 'major_id',
      key: 'major_id',
      render: (id: number) => majorMap.get(id) || `ID: ${id}`
    },
    {
      title: 'Tổ hợp',
      dataIndex: 'subject_group_id',
      key: 'subject_group_id',
      render: (id: number) => subjectGroupMap.get(id) || `ID: ${id}`
    },
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
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : '-'),
    },
  ];

  if (statsLoading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Tổng quan</Title>
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Top 5 trường có nhiều hồ sơ nhất">
            {schoolChartData.length > 0 ? (
              <Column
                data={schoolChartData}
                xField="schoolName"
                yField="count"
                label={{ position: 'top', style: { fontSize: 12, angle: 0 }, autoRotate: false, autoHide: false, rotate: -20 }}
                xAxis={{ label: { autoRotate: true, autoHide: true } }}
                meta={{ count: { alias: 'Số lượng hồ sơ' } }}
              />
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>

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