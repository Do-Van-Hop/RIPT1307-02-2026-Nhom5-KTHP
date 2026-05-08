import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Space, Card, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
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
  
  const [fileListHocBa, setFileListHocBa] = useState<any[]>([]);
  const [fileListCccd, setFileListCccd] = useState<any[]>([]);

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
        fullName: existingApp.fullName,
        phone: existingApp.phone,
        dob: existingApp.dob ? dayjs(existingApp.dob) : null,
        cccdNumber: existingApp.cccdNumber,
        priority: existingApp.priority,
        scores: existingApp.scores,
      });
      setSelectedSchool(existingApp.schoolId);
      setSelectedMajor(existingApp.majorId);
      setSelectedSubjectGroup(existingApp.subjectGroupId);

      const hocBaDocs = existingApp.documents?.filter((doc: any) => doc.name?.includes('Học bạ')) || [];
      const cccdDocs = existingApp.documents?.filter((doc: any) => doc.name?.includes('CCCD')) || [];
      
      setFileListHocBa(hocBaDocs.map((doc: any, idx: number) => ({
        uid: `hocba-${idx}`,
        name: doc.name,
        status: 'done',
        url: doc.url,
      })));
      setFileListCccd(cccdDocs.map((doc: any, idx: number) => ({
        uid: `cccd-${idx}`,
        name: doc.name,
        status: 'done',
        url: doc.url,
      })));
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

  const handleUpload = async (file: File, type: 'hocba' | 'cccd') => {
    try {
      const res = await applicationService.uploadFile(file);
      const url = res.data.url;
      const newFile = {
        uid: `${type}-${file.name}-${Date.now()}`,
        name: `${type === 'hocba' ? 'Học bạ' : 'CCCD'} - ${file.name}`,
        status: 'done',
        url,
      };
      if (type === 'hocba') {
        setFileListHocBa(prev => [...prev, newFile]);
      } else {
        setFileListCccd(prev => [...prev, newFile]);
      }
      message.success('Tải lên thành công');
    } catch {
      message.error('Tải lên thất bại');
    }
  };

  const handleSubmit = (values: any, status: 'DRAFT' | 'SUBMITTED') => {
    const allDocuments = [
      ...fileListHocBa.map(f => ({ url: f.url, name: f.name })),
      ...fileListCccd.map(f => ({ url: f.url, name: f.name }))
    ];

    const payload = {
      schoolId: selectedSchool,
      majorId: selectedMajor,
      subjectGroupId: selectedSubjectGroup,
      fullName: values.fullName,
      phone: values.phone,
      dob: values.dob ? values.dob.toISOString() : null,
      cccdNumber: values.cccdNumber,
      scores: values.scores,
      priority: values.priority,
      documents: allDocuments,
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
    <Card title={isEdit ? 'Sửa hồ sơ' : 'Tạo hồ sơ mới'} style={{ maxWidth: 900, margin: '0 auto' }}>
      <Form form={form} layout="vertical" onFinish={(values) => handleSubmit(values, 'SUBMITTED')}>
        {/* Thông tin cá nhân */}
        <Card title="Thông tin cá nhân" size="small" style={{ marginBottom: 24 }}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="0123456789" />
          </Form.Item>
          <Form.Item
            name="dob"
            label="Ngày sinh"
            rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày sinh" />
          </Form.Item>
          <Form.Item
            name="cccdNumber"
            label="Số CCCD / CMND"
            rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}
          >
            <Input placeholder="079123456789" />
          </Form.Item>
        </Card>

        {/* Chọn trường - ngành - tổ hợp */}
        <Form.Item label="Trường - Ngành - Tổ hợp" required>
          <CandidateCascader onSelect={onCascaderSelect} />
        </Form.Item>

        {/* Điểm các môn theo tổ hợp */}
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

        {/* Đối tượng ưu tiên */}
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

        {/* Upload học bạ */}
        <Form.Item label="Học bạ (Ảnh chụp hoặc PDF)" required>
          <Upload
            listType="picture-card"
            fileList={fileListHocBa}
            onRemove={(file) => setFileListHocBa(prev => prev.filter(f => f.uid !== file.uid))}
            beforeUpload={(file) => {
              handleUpload(file, 'hocba');
              return false;
            }}
            accept="image/*,application/pdf"
          >
            {fileListHocBa.length < 5 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
          <div style={{ fontSize: 12, color: '#888' }}>Tối đa 5 file (học bạ, bảng điểm,...)</div>
        </Form.Item>

        {/* Upload CCCD */}
        <Form.Item label="Căn cước công dân (CCCD) - Mặt trước và sau" required>
          <Upload
            listType="picture-card"
            fileList={fileListCccd}
            onRemove={(file) => setFileListCccd(prev => prev.filter(f => f.uid !== file.uid))}
            beforeUpload={(file) => {
              handleUpload(file, 'cccd');
              return false;
            }}
            accept="image/*,application/pdf"
          >
            {fileListCccd.length < 2 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
          <div style={{ fontSize: 12, color: '#888' }}>Tối đa 2 file (mặt trước, mặt sau)</div>
        </Form.Item>

        {/* Nút lưu */}
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