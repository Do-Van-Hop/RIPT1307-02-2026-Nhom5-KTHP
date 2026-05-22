import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Space, Card, DatePicker, Modal } from 'antd'; // 👈 thêm Modal vào import
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import * as applicationService from '../../services/applicationService';
import * as catalogService from '../../services/catalogService';
import CandidateCascader from '../../components/CandidateCascader';

const { Option } = Select;

const priorityMap: Record<string, number> = {
  KV1: 1,
  KV2: 2,
  'KV2-NT': 3,
  KV3: 4,
};

const ApplicationForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<number | null>(null);
  const [transcriptFiles, setTranscriptFiles] = useState<any[]>([]);
  const [cccdFrontFiles, setCccdFrontFiles] = useState<any[]>([]);
  const [cccdBackFiles, setCccdBackFiles] = useState<any[]>([]);

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
        fullName: existingApp.full_name,
        phone: existingApp.phone,
        dob: existingApp.dob ? dayjs(existingApp.dob) : null,
        cccdNumber: existingApp.cccd_number,
        priority: Object.keys(priorityMap).find(key => priorityMap[key] === existingApp.priority) || 'KV3',
        scores: existingApp.scores,
      });
      setSelectedSchool(existingApp.school_id);
      setSelectedMajor(existingApp.major_id);
      setSelectedSubjectGroup(existingApp.subject_group_id);

      const files = existingApp.files || [];
      const trans = files.filter((f: any) => f.file_type === 'TRANSCRIPT');
      const front = files.filter((f: any) => f.file_type === 'CCCD_FRONT');
      const back = files.filter((f: any) => f.file_type === 'CCCD_BACK');

      setTranscriptFiles(trans.map((f: any, idx: number) => ({
        uid: `trans-${idx}`,
        name: f.file_url,
        status: 'done',
        url: f.file_url,
        file_type: f.file_type,
      })));
      setCccdFrontFiles(front.map((f: any, idx: number) => ({
        uid: `front-${idx}`,
        name: f.file_url,
        status: 'done',
        url: f.file_url,
        file_type: f.file_type,
      })));
      setCccdBackFiles(back.map((f: any, idx: number) => ({
        uid: `back-${idx}`,
        name: f.file_url,
        status: 'done',
        url: f.file_url,
        file_type: f.file_type,
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
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      applicationService.updateApplication(id, data),
    onSuccess: () => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      navigate('/candidate/applications');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (applicationId: number) => applicationService.submitApplication(applicationId),
    onSuccess: () => {
      message.success('Nộp hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      navigate('/candidate/applications');
    },
  });

  const handleUpload = async (file: File, type: 'TRANSCRIPT' | 'CCCD_FRONT' | 'CCCD_BACK') => {
    try {
      const res = await applicationService.uploadFile(file, type);
      const url = res.data.file_url;
      const newFile = {
        uid: `${type}-${Date.now()}`,
        name: file.name,
        status: 'done',
        url,
        file_type: type,
      };
      if (type === 'TRANSCRIPT') setTranscriptFiles(prev => [...prev, newFile]);
      if (type === 'CCCD_FRONT') setCccdFrontFiles(prev => [...prev, newFile]);
      if (type === 'CCCD_BACK') setCccdBackFiles(prev => [...prev, newFile]);
      message.success('Tải lên thành công');
    } catch {
      message.error('Tải lên thất bại');
    }
    return false;
  };

  const buildFilesPayload = () => {
    const allFiles = [...transcriptFiles, ...cccdFrontFiles, ...cccdBackFiles];
    return allFiles.map(f => ({
      file_url: f.url,
      file_type: f.file_type,
    }));
  };

  const calculateTotalScore = (scores: Record<string, string | number>) => {
    return Object.values(scores).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
  };
  // Hàm lưu nháp (giữ nguyên)
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        school_id: selectedSchool,
        major_id: selectedMajor,
        subject_group_id: selectedSubjectGroup,
        full_name: values.fullName,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        phone: values.phone,
        cccd_number: values.cccdNumber,
        score: values.scores ? calculateTotalScore(values.scores) : 0,
        scores: values.scores,
        priority: priorityMap[values.priority],
        files: buildFilesPayload(),
      };
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id: Number(id), data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      console.error('Lưu nháp thất bại', err);
    }
  };

  // 👇 HÀM NỘP HỒ SƠ GỐC (đã có, giữ nguyên logic)
  const submitApplication = async () => {
    try {
      const values = await form.validateFields();
      let applicationId = Number(id);

      if (!isEdit) {
        const payload = {
          school_id: selectedSchool,
          major_id: selectedMajor,
          subject_group_id: selectedSubjectGroup,
          full_name: values.fullName,
          dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
          phone: values.phone,
          cccd_number: values.cccdNumber,
          score: values.scores ? calculateTotalScore(values.scores) : 0,
          scores: values.scores,
          priority: priorityMap[values.priority],
          files: buildFilesPayload(),
        };
        console.log('Payload nộp hồ sơ:', payload);
        const res = await createMutation.mutateAsync(payload);
        applicationId = res.data.id;
      } else {
        const payload = {
          school_id: selectedSchool,
          major_id: selectedMajor,
          subject_group_id: selectedSubjectGroup,
          full_name: values.fullName,
          dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
          phone: values.phone,
          cccd_number: values.cccdNumber,
          score: values.scores ? calculateTotalScore(values.scores) : 0,
          scores: values.scores,
          priority: priorityMap[values.priority],
          files: buildFilesPayload(),
        };
        console.log('Payload nộp hồ sơ:', payload);
        await updateMutation.mutateAsync({ id: Number(id), data: payload });
        applicationId = Number(id);
      }

      await submitMutation.mutateAsync(applicationId);
      try {
        await applicationService.sendApplicationEmail(
          applicationId,
          'Xác nhận nộp hồ sơ xét tuyển',
          `Chúc mừng bạn đã nộp hồ sơ xét tuyển thành công.\nMã hồ sơ: ${applicationId}\nTrạng thái: Chờ duyệt.\nChúng tôi sẽ thông báo kết quả sớm nhất.`
        );
      } catch (emailError) {
        console.error('Gửi email thất bại', emailError);
        message.warning('Hồ sơ đã nộp nhưng không thể gửi email thông báo. Vui lòng kiểm tra lại email cá nhân.');
      }
    } catch (err) {
      console.error('Nộp hồ sơ thất bại', err);
    }
  };

  // 👇 HÀM MỚI: hiển thị hộp thoại xác nhận trước khi gọi submitApplication
  const handleSubmitWithConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận nộp hồ sơ',
      content: 'Bạn chắc chắn muốn nộp hồ sơ? Sau khi nộp bạn không thể sửa hoặc xóa hồ sơ này nữa.',
      okText: 'Đồng ý nộp',
      cancelText: 'Hủy',
      onOk: submitApplication,
    });
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

  if (loadingApp) return <div>Đang tải...</div>;

  return (
    <Card title={isEdit ? 'Sửa hồ sơ' : 'Tạo hồ sơ mới'} style={{ maxWidth: 900, margin: '0 auto' }}>
      <Form form={form} layout="vertical">
        {/* Thông tin cá nhân */}
        <Card title="Thông tin cá nhân" size="small" style={{ marginBottom: 24 }}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
            <Input placeholder="0123456789" />
          </Form.Item>
          <Form.Item name="dob" label="Ngày sinh" rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày sinh" />
          </Form.Item>
          <Form.Item name="cccdNumber" label="Số CCCD" rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}>
            <Input placeholder="079123456789" />
          </Form.Item>
        </Card>

        {/* Chọn trường - ngành - tổ hợp */}
        <Form.Item label="Trường - Ngành - Tổ hợp" required>
          <CandidateCascader
            onSelect={(schoolId, majorId, subjectGroupId) => {
              setSelectedSchool(schoolId);
              setSelectedMajor(majorId);
              setSelectedSubjectGroup(subjectGroupId);
            }}
            initialSchoolId={selectedSchool || undefined}
            initialMajorId={selectedMajor || undefined}
            initialSubjectGroupId={selectedSubjectGroup || undefined}
          />
        </Form.Item>

        {/* Điểm các môn */}
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
        <Form.Item name="priority" label="Đối tượng ưu tiên" rules={[{ required: true }]}>
          <Select placeholder="Chọn đối tượng">
            <Option value="KV1">Khu vực 1</Option>
            <Option value="KV2">Khu vực 2</Option>
            <Option value="KV2-NT">Khu vực 2 - Nông thôn</Option>
            <Option value="KV3">Khu vực 3</Option>
          </Select>
        </Form.Item>

        {/* Upload học bạ */}
        <Form.Item label="Học bạ (Ảnh hoặc PDF)" required>
          <Upload
            listType="picture-card"
            fileList={transcriptFiles}
            onRemove={(file) => setTranscriptFiles(prev => prev.filter(f => f.uid !== file.uid))}
            beforeUpload={(file) => handleUpload(file, 'TRANSCRIPT')}
            accept="image/*,application/pdf"
          >
            {transcriptFiles.length < 5 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
          <div style={{ fontSize: 12, color: '#888' }}>Tối đa 5 file (học bạ, bảng điểm,...)</div>
        </Form.Item>

        {/* Upload CCCD mặt trước */}
        <Form.Item label="CCCD mặt trước" required>
          <Upload
            listType="picture-card"
            fileList={cccdFrontFiles}
            onRemove={(file) => setCccdFrontFiles(prev => prev.filter(f => f.uid !== file.uid))}
            beforeUpload={(file) => handleUpload(file, 'CCCD_FRONT')}
            accept="image/*,application/pdf"
          >
            {cccdFrontFiles.length < 1 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        {/* Upload CCCD mặt sau */}
        <Form.Item label="CCCD mặt sau" required>
          <Upload
            listType="picture-card"
            fileList={cccdBackFiles}
            onRemove={(file) => setCccdBackFiles(prev => prev.filter(f => f.uid !== file.uid))}
            beforeUpload={(file) => handleUpload(file, 'CCCD_BACK')}
            accept="image/*,application/pdf"
          >
            {cccdBackFiles.length < 1 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải lên</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        {/* Buttons */}
        <Space>
          <Button onClick={handleSaveDraft} loading={createMutation.isPending || updateMutation.isPending}>
            Lưu nháp
          </Button>
          {/* 👇 Thay đổi: gọi handleSubmitWithConfirm thay vì handleSubmit trực tiếp */}
          <Button type="primary" onClick={handleSubmitWithConfirm} loading={submitMutation.isPending}>
            Nộp hồ sơ
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ApplicationForm;