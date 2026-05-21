import React from 'react';
import { Table, Tag, Button, Card, Empty, Spin } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as applicationService from '../../services/applicationService';

const Results: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await applicationService.getMyApplications();
      // Backend trả về mảng các hồ sơ
      return res.data as any[];
    },
  });

  // Lọc chỉ lấy hồ sơ có trạng thái APPROVED hoặc REJECTED
  const results = data?.filter(
    (app: any) => app.status === 'APPROVED' || app.status === 'REJECTED'
  ) || [];

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Trường',
      dataIndex: 'school_id',
      key: 'school_id',
      render: (schoolId: number, record: any) => {
        // Nếu API trả về school object thì dùng, không thì hiển thị ID
        return record.school?.name || `ID: ${schoolId}`;
      },
    },
    {
      title: 'Ngành',
      dataIndex: 'major_id',
      key: 'major_id',
      render: (majorId: number, record: any) => {
        return record.major?.name || `ID: ${majorId}`;
      },
    },
    {
      title: 'Tổ hợp',
      dataIndex: 'subject_group_id',
      key: 'subject_group_id',
      render: (groupId: number, record: any) => {
        return record.subject_group?.name || `ID: ${groupId}`;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'APPROVED' ? 'green' : 'red'}>
          {status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
        </Tag>
      ),
    },
    {
      title: 'Lý do từ chối',
      dataIndex: 'reject_reason',
      key: 'reject_reason',
      render: (text: string) => text || '—',
    },
    {
      title: 'Chi tiết',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/candidate/applications/${record.id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="Đang tải kết quả..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Empty description="Không thể tải dữ liệu. Vui lòng thử lại sau." />
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <Empty description="Bạn chưa có hồ sơ nào được duyệt hoặc từ chối." />
      </Card>
    );
  }

  return (
    <div>
<h2 style={{ marginBottom: 16 }}>Kết quả xét tuyển</h2>
      <Table
        dataSource={results}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: 'Chưa có kết quả nào' }}
      />
    </div>
  );
};

export default Results;