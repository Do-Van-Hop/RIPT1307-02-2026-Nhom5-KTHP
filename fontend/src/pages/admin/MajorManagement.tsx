import React, { useState, useEffect } from 'react';
import {
  Select, Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';

interface Major {
  id: number;
  name: string;
  school_id: number;
}

interface SubjectGroup {
  id: number;
  name: string;
  subjects: string[];
}

const MajorManagement: React.FC = () => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [form] = Form.useForm();

  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data,
  });

  const { data: majors, isLoading } = useQuery({
    queryKey: ['majors', selectedSchoolId],
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const res = await catalogService.getMajorsBySchool(selectedSchoolId);
      return res.data as Major[];
    },
    enabled: !!selectedSchoolId,
  });

  const { data: allSubjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data as SubjectGroup[],
  });

  const { data: currentGroups, refetch: refetchCurrentGroups } = useQuery({
    queryKey: ['majorSubjectGroups', editingMajor?.id],
    queryFn: async () => {
      if (!editingMajor) return [];
      const res = await catalogService.getSubjectGroupsByMajor(editingMajor.id);
      return res.data as SubjectGroup[];
    },
    enabled: !!editingMajor,
  });

  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  useEffect(() => {
    if (currentGroups) {
      const ids = currentGroups.map(g => g.id);
      const t = setTimeout(() => setSelectedGroupIds(ids), 0);
      return () => clearTimeout(t);
    }
    return;
  }, [currentGroups]);

  const createMutation = useMutation({
    mutationFn: catalogService.createMajor,
    onSuccess: (newMajor) => {
      const groupIds = form.getFieldValue('subjectGroupIds') || [];
      if (groupIds.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
        message.success('Thêm ngành thành công (chưa gán tổ hợp)');
        setIsModalOpen(false);
        form.resetFields();
        return;
      }
      Promise.all(groupIds.map((groupId: number) =>
        catalogService.assignSubjectGroupToMajor(newMajor.data.id, groupId)
      ))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
          message.success('Thêm ngành và gán tổ hợp thành công');
          setIsModalOpen(false);
          form.resetFields();
        })
        .catch(() => message.error('Lỗi khi gán tổ hợp, vui lòng thử lại'));
    },
    onError: (err: any) => {
      // Lấy message lỗi từ response (nếu có)
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || (typeof err === 'string' ? err : 'Lỗi khi tạo ngành');
      message.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; school_id: number } }) =>
      catalogService.updateMajor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Cập nhật thông tin ngành thành công');
    },
    onError: (err: any) => {
      // Lấy message lỗi từ response (nếu có)
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || (typeof err === 'string' ? err : 'Lỗi khi sửa ngành');
      message.error(errorMessage);
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: ({ majorId, groupId }: { majorId: number; groupId: number }) =>
      catalogService.assignSubjectGroupToMajor(majorId, groupId),
    onSuccess: () => {
      refetchCurrentGroups(); // Cập nhật danh sách tổ hợp hiện tại
      message.success('Đã thêm tổ hợp vào ngành');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.detail || 'Thêm tổ hợp thất bại');
    },
  });

  const removeGroupMutation = useMutation({
    mutationFn: ({ majorId, groupId }: { majorId: number; groupId: number }) =>
      catalogService.removeSubjectGroupFromMajor(majorId, groupId),
    onSuccess: () => {
      refetchCurrentGroups();
      message.success('Đã xoá tổ hợp khỏi ngành');
    },
    onError: (err: any) => {
      if (err.response?.status === 404) {
        message.error('Backend chưa có API xoá tổ hợp khỏi ngành. Vui lòng liên hệ developer để bổ sung.');
      } else {
        message.error(err.response?.data?.detail || 'Xoá tổ hợp thất bại');
      }
    },
  });

  const handleGroupChange = (values: number[]) => {
    if (!editingMajor) return;

    const added = values.filter(v => !selectedGroupIds.includes(v));
    const removed = selectedGroupIds.filter(v => !values.includes(v));

    added.forEach(groupId => {
      assignGroupMutation.mutate({ majorId: editingMajor.id, groupId });
    });
    removed.forEach(groupId => {
      removeGroupMutation.mutate({ majorId: editingMajor.id, groupId });
    });

    setSelectedGroupIds(values);
  };

  const handleAdd = () => {
    setEditingMajor(null);
    form.resetFields();
    form.setFieldsValue({ subjectGroupIds: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Major) => {
    setEditingMajor(record);
    form.setFieldsValue({
      name: record.name,
      schoolId: record.school_id,
    });
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingMajor(null);
    form.resetFields();
    setSelectedGroupIds([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMajor) {
        await updateMutation.mutateAsync({
          id: editingMajor.id,
          data: { name: values.name, school_id: values.schoolId }
        });
        setIsModalOpen(false);
        setEditingMajor(null);
        form.resetFields();
      } else {
        await createMutation.mutateAsync({ name: values.name, school_id: selectedSchoolId! });
      }
    } catch (err) {
      // validation error hoặc mutation error đã được xử lý
    }
  };

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors', selectedSchoolId] });
      message.success('Xoá ngành thành công');
    },
    onError: (err: any) => {
      // Lấy message lỗi từ response (nếu có)
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || (typeof err === 'string' ? err : 'Lỗi khi tạo ngành');
      message.error(errorMessage);
    },
  });

  const columns = [
    { title: 'Tên ngành', dataIndex: 'name', key: 'name' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Major) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xoá ngành này sẽ xoá tất cả mapping tổ hợp và không thể khôi phục. Tiếp tục?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xoá"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Quản lý Ngành</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            style={{ width: 300 }}
            placeholder="Chọn trường"
            options={schools?.map((s: any) => ({ value: s.id, label: s.name }))}
            onChange={(value) => setSelectedSchoolId(value)}
            value={selectedSchoolId}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!selectedSchoolId}>
            Thêm ngành
          </Button>
        </div>
      </div>

      <Table dataSource={majors} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} />

      {/* Modal thêm / sửa ngành */}
      <Modal
        title={editingMajor ? 'Sửa ngành' : 'Thêm ngành mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancelModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
        okText={editingMajor ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên ngành" rules={[{ required: true, message: 'Vui lòng nhập tên ngành' }]}>
            <Input />
          </Form.Item>

          {editingMajor ? (
            <>
              <Form.Item name="schoolId" label="Trường" rules={[{ required: true }]}>
                <Select options={schools?.map((s: any) => ({ value: s.id, label: s.name }))} placeholder="Chọn trường" />
              </Form.Item>

              {/* Phần quản lý tổ hợp môn */}
              <Form.Item label="Tổ hợp xét tuyển">
                <Select
                  mode="multiple"
                  placeholder="Chọn tổ hợp môn"
                  value={selectedGroupIds}
                  onChange={handleGroupChange}
                  loading={assignGroupMutation.isPending || removeGroupMutation.isPending}
                  options={allSubjectGroups?.map(sg => ({ value: sg.id, label: `${sg.name} (${sg.subjects.join(', ')})` }))}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                  * Thêm: chọn tổ hợp mới. Xoá: bỏ chọn tổ hợp đang có.
                  {removeGroupMutation.isError && (
                    <span style={{ color: 'red', display: 'block' }}>
                      Lưu ý: Backend chưa hỗ trợ xoá tổ hợp. Vui lòng liên hệ developer.
                    </span>
                  )}
                </div>
              </Form.Item>
            </>
          ) : (
            <Form.Item name="subjectGroupIds" label="Tổ hợp xét tuyển (chọn nhiều)" rules={[{ required: true, message: 'Chọn ít nhất một tổ hợp' }]}>
              <Select mode="multiple" placeholder="Chọn tổ hợp" options={allSubjectGroups?.map(sg => ({ value: sg.id, label: sg.name }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MajorManagement;