import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../../services/catalogService';

interface SubjectGroup {
  id: number;
  name: string;
  subjects: string[];
}

const SubjectGroupManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => {
      const res = await catalogService.getSubjectGroups();
      return res.data as SubjectGroup[];
    },
  });

  const createMutation = useMutation({
    mutationFn: catalogService.createSubjectGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Thêm tổ hợp môn thành công');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi khi thêm tổ hợp'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; subjects: string[] } }) =>
      catalogService.updateSubjectGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Cập nhật tổ hợp môn thành công');
      setIsModalOpen(false);
      setEditingGroup(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogService.deleteSubjectGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
      message.success('Xóa tổ hợp môn thành công');
    },
    onError: (err: any) => message.error(err.response?.data?.detail || 'Lỗi xóa tổ hợp'),
  });

  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: SubjectGroup) => {
    setEditingGroup(record);
    form.setFieldsValue({
      name: record.name,
      subjects: record.subjects.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        subjects: values.subjects.split(',').map((s: string) => s.trim()).filter(Boolean),
      };
      if (editingGroup) {
        updateMutation.mutate({ id: editingGroup.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (err) {
      // validation error
    }
  };

  const columns = [
    { title: 'Tên tổ hợp', dataIndex: 'name', key: 'name' },
    {
      title: 'Môn thi',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects: string[]) => (
        <>
          {subjects?.map((subject) => (
            <Tag key={subject}>{subject}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: SubjectGroup) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa tổ hợp môn sẽ ảnh hưởng đến các ngành và hồ sơ đã dùng tổ hợp này. Tiếp tục?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Quản lý Tổ hợp môn</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm tổ hợp
        </Button>
      </div>
      <Table dataSource={data} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} />
      <Modal
        title={editingGroup ? 'Sửa tổ hợp môn' : 'Thêm tổ hợp môn mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên tổ hợp"
            rules={[{ required: true, message: 'Vui lòng nhập tên tổ hợp' }]}
          >
            <Input placeholder="Ví dụ: A00" />
          </Form.Item>
          <Form.Item
            name="subjects"
            label="Danh sách môn (cách nhau bởi dấu phẩy)"
            rules={[{ required: true, message: 'Vui lòng nhập ít nhất một môn' }]}
          >
            <Input placeholder="Toán, Lý, Hóa" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectGroupManagement;