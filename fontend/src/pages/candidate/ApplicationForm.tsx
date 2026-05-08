import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Space, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import * as applicationService from '../../services/applicationService';
import * as catalogService from '../../services/catalogService';
import CandidateCascader from '../../components/CandidateCascader';

const { Option } = Select;

const ApplicationForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<number | null>(null);
  const [fileList, setFileList] = useState<unknown[]>([]);

  // Lấy chi tiết nếu sửa
  const { data: existingApp, isLoading: loadingApp } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await applicationService.getApplicationById(Number(id));
      return res.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (existingApp) {
      form.setFieldsValue({
        priority: existingApp.priority,
        scores: existingApp.scores,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSchool(existingApp.schoolId);
      setSelectedMajor(existingApp.majorId);
      setSelectedSubjectGroup(existingApp.subjectGroupId);
      setFileList(existingApp.documents?.map((doc: { name: string; url: string }, index: number) => ({
        uid: `${index}`,
        name: doc.name || 'file',
        status: 'done',
        url: doc.url,
      })) || []);
    }
  }, [existingApp, form]);

  const createMutation = useMutation({
    mutationFn: applicationService.createApplication,
    onSuccess: () => {
      message.success('Tạo hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      navigate('/candidate/applications');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => applicationService.updateApplication(id, data),
    onSuccess: () => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      navigate('/candidate/applications');
    },
  });

  const handleUpload = async (file: File) => {
    try {
      const res = await applicationService.uploadFile(file);
      const url = res.data.url;
      setFileList(prev => [...prev, { uid: file.name + Date.now(), name: file.name, status: 'done', url }]);
      message.success('Tải lên thành công');
    } catch {
      message.error('Tải lên thất bại');
    }
  };

  const handleSubmit = (values: unknown, status: 'DRAFT' | 'SUBMITTED') => {
    const payload = {
      schoolId: selectedSchool,
      majorId: selectedMajor,
      subjectGroupId: selectedSubjectGroup,
      scores: values.scores,
      priority: values.priority,
      documents: fileList.map(f => ({ url: f.url, name: f.name })),
      status,
    };
    if (isEdit && id) {
      updateMutation.mutate({ id: Number(id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const onCascaderSelect = (schoolId: number, majorId: number, subjectGroupId: number) => {
    setSelectedSchool(schoolId);
    setSelectedMajor(majorId);
    setSelectedSubjectGroup(subjectGroupId);
  };

  // Lấy danh sách môn của tổ hợp đã chọn
  const { data: subjectGroupDetail } = useQuery({
    queryKey: ['subjectGroupDetail', selectedSubjectGroup],
    queryFn: async () => {
      if (!selectedSubjectGroup) return null;
      const res = await catalogService.getSubjectGroupById(selectedSubjectGroup);
      return res.data;
    },
    enabled: !!selectedSubjectGroup,
  });

  const subjects: string[] = subjectGroupDetail?.subjects || [];

  if (loadingApp) return <div>Loading...</div>;

  return (
    <Card title={isEdit ? 'Sửa hồ sơ' : 'Tạo hồ sơ mới'} style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form form={form} layout="vertical" onFinish={(values) => handleSubmit(values, 'SUBMITTED')}>
        <Form.Item label="Trường - Ngành - Tổ hợp" required>
          <CandidateCascader onSelect={onCascaderSelect} />
        </Form.Item>

        {subjects.length > 0 && (
          <Form.Item label="Điểm các môn" required>
            <Space wrap>
              {subjects.map(subject => (
                <Form.Item
                  key={subject}
                  name={['scores', subject]}
                  label={subject}
                  rules={[{ required: true, message: `Nhập điểm ${subject}` }]}
                >
                  <Input type="number" min={0} max={10} step={0.25} style={{ width: 100 }} />
                </Form.Item>
              ))}
            </Space>
          </Form.Item>
        )}

        <Form.Item
          name="priority"
          label="Đối tượng ưu tiên"
          rules={[{ required: true, message: 'Chọn đối tượng ưu tiên' }]}
        >
          <Select placeholder="Chọn đối tượng">
            <Option value="KV1">Khu vực 1</Option>
            <Option value="KV2">Khu vực 2</Option>
            <Option value="KV2-NT">Khu vực 2 - Nông thôn</Option>
            <Option value="KV3">Khu vực 3</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Minh chứng">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onRemove={(file) => setFileList(prev => prev.filter(f => f.uid !== file.uid))}
            beforeUpload={(file) => {
              handleUpload(file);
              return false; // quan trọng: ngăn antd upload tự động
            }}
          >
            {fileList.length < 5 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Space>
          <Button onClick={() => form.validateFields().then(values => handleSubmit(values, 'DRAFT'))}>
            Lưu nháp
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            Nộp hồ sơ
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ApplicationForm;