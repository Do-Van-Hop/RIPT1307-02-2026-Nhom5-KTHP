import React from 'react';
import { Table, Button, Tag, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as applicationService from '../../services/applicationService';

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: 'Nháp' },
  SUBMITTED: { color: 'blue', text: 'Đã nộp' },
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'green', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
};

const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await applicationService.getMyApplications();
      return res.data as applicationService.Application[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: applicationService.deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      message.success('Xóa hồ sơ thành công');
    },
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Trường', dataIndex: ['school', 'name'], key: 'school', render: (name: string, record: any) => name || `ID: ${record.school_id}` },
    { title: 'Ngành', dataIndex: ['major', 'name'], key: 'major', render: (name: string, record: any) => name || `ID: ${record.major_id}` },
    { title: 'Tổ hợp', dataIndex: ['subjectGroup', 'name'], key: 'subjectGroup', render: (name: string, record: any) => name || `ID: ${record.subject_group_id}` },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: applicationService.Application) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/candidate/applications/${record.id}`)}>
            Xem
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/candidate/applications/${record.id}/edit`)}>
                Sửa
              </Button>
              <Popconfirm
                title="Xóa hồ sơ này?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button icon={<DeleteOutlined />} size="small" danger>
                  Xóa
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Hồ sơ của tôi</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/candidate/applications/new')}>
          Tạo hồ sơ mới
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} />
    </div>
  );
};

export default MyApplications;