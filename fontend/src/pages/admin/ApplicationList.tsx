import React, { useState } from 'react';
import { Table, Tag, Button, Select, Space, message, Popconfirm } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as applicationService from '../../services/applicationService';
import * as catalogService from '../../services/catalogService';
import { useAllMajors } from '../../hooks/useAllMajors';

const { Option } = Select;

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: 'Nháp' },
  SUBMITTED: { color: 'blue', text: 'Đã nộp' },
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'green', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
};

const ApplicationList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    schoolId: undefined as number | undefined,
    majorId: undefined as number | undefined,
    status: undefined as string | undefined,
    page: 1,
    limit: 10,
  });

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data,
    staleTime: 60000,
  });

  const { data: allMajorsData } = useAllMajors();
  const majorMap = allMajorsData?.map || new Map();

  const { data: subjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data,
    staleTime: 60000,
  });
  const subjectGroupMap = new Map(subjectGroups?.map((sg: any) => [sg.id, sg.name]));

  const { data: majorsBySchool } = useQuery({
    queryKey: ['majors', filters.schoolId],
    queryFn: async () => {
      if (!filters.schoolId) return [];
      return (await catalogService.getMajorsBySchool(filters.schoolId)).data;
    },
    enabled: !!filters.schoolId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminApplications', filters],
    queryFn: async () => {
      const res = await applicationService.getAllApplications({
        school_id: filters.schoolId,
        major_id: filters.majorId,
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      applicationService.updateApplicationStatus(id, status, reason),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      message.success('Cập nhật trạng thái thành công');

      const subject = variables.status === 'APPROVED'
        ? 'Hồ sơ xét tuyển đã được duyệt'
        : 'Hồ sơ xét tuyển bị từ chối';

      const body = variables.status === 'APPROVED'
        ? `Chúc mừng! Hồ sơ #${variables.id} của bạn đã được duyệt.\nVui lòng theo dõi các bước tiếp theo.`
        : `Rất tiếc, hồ sơ #${variables.id} của bạn đã bị từ chối.\nLý do: ${variables.reason || 'Không có lý do cụ thể'}\nLiên hệ phòng tuyển sinh nếu cần giải đáp.`;

      try {
        await applicationService.sendApplicationEmail(variables.id, subject, body);
        message.success('📧 Đã gửi email thông báo cho thí sinh');
      } catch (emailError) {
        console.error('Gửi email thất bại', emailError);
        message.warning('⚠️ Cập nhật trạng thái thành công nhưng không thể gửi email. Vui lòng kiểm tra cấu hình email.');
      }
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Lỗi khi cập nhật trạng thái');
    },
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: 'Họ tên thí sinh',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (fullName: string) => fullName || 'N/A',
    },
    {
      title: 'Trường',
      dataIndex: 'school_id',
      key: 'school_id',
      render: (schoolId: number) => {
        const school = schools?.find((s: any) => s.id === schoolId);
        return school?.name || `ID: ${schoolId}`;
      },
    },
    {
      title: 'Ngành',
      dataIndex: 'major_id',
      key: 'major_id',
      render: (majorId: number) => {
        return majorMap.get(majorId) || `ID: ${majorId}`;
      },
    },
    {
      title: 'Tổ hợp',
      dataIndex: 'subject_group_id',
      key: 'subject_group_id',
      render: (groupId: number) => {
        return subjectGroupMap.get(groupId) || `ID: ${groupId}`;
      },
    },
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
      title: 'Ngày nộp',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : '-'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/admin/applications/${record.id}`)}
          >
            Xem
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Popconfirm
                title="Duyệt hồ sơ này?"
                onConfirm={() => updateStatusMutation.mutate({ id: record.id, status: 'APPROVED' })}
              >
                <Button icon={<CheckOutlined />} size="small" type="primary">
                  Duyệt
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Từ chối hồ sơ này?"
                onConfirm={() => updateStatusMutation.mutate({ id: record.id, status: 'REJECTED', reason: '' })}
              >
                <Button icon={<CloseOutlined />} size="small" danger>
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination: any) => {
    setFilters((prev) => ({ ...prev, page: pagination.current, limit: pagination.pageSize }));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Quản lý hồ sơ</h2>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Chọn trường"
          allowClear
          style={{ width: 220 }}
          value={filters.schoolId}
          onChange={(value) => setFilters({ ...filters, schoolId: value, majorId: undefined, page: 1 })}
        >
          {schools?.map((s: any) => (
            <Option key={s.id} value={s.id}>{s.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Chọn ngành"
          allowClear
          style={{ width: 220 }}
          value={filters.majorId}
          disabled={!filters.schoolId}
          onChange={(value) => setFilters({ ...filters, majorId: value, page: 1 })}
        >
          {majorsBySchool?.map((m: any) => (
            <Option key={m.id} value={m.id}>{m.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
        >
          <Option value="DRAFT">Nháp</Option>
          <Option value="SUBMITTED">Đã nộp</Option>
          <Option value="PENDING">Chờ duyệt</Option>
          <Option value="APPROVED">Đã duyệt</Option>
          <Option value="REJECTED">Từ chối</Option>
        </Select>
      </Space>
      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: data?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />
    </div>
  );
};

export default ApplicationList;