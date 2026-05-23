import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Space, DatePicker, Modal, Skeleton } from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, SaveOutlined, SendOutlined,
  UserOutlined, PhoneOutlined, IdcardOutlined, CalendarOutlined,
  BankOutlined, StarOutlined, FileTextOutlined, IdcardFilled,
} from '@ant-design/icons';
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

/* ─── Section wrapper ─── */
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  step: number;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, step }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
      <div className="w-7 h-7 rounded-lg bg-[#B30000] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {step}
      </div>
      <span className="text-[#B30000] text-base flex-shrink-0">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide m-0">{title}</h3>
    </div>
    <div className="p-5 space-y-0">{children}</div>
  </div>
);

/* ─── Upload box label ─── */
const UploadHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
    <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
    {children}
  </p>
);

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
      const back  = files.filter((f: any) => f.file_type === 'CCCD_BACK');

      setTranscriptFiles(trans.map((f: any, idx: number) => ({ uid: `trans-${idx}`, name: f.file_url, status: 'done', url: f.file_url, file_type: f.file_type })));
      setCccdFrontFiles(front.map((f: any, idx: number) => ({ uid: `front-${idx}`, name: f.file_url, status: 'done', url: f.file_url, file_type: f.file_type })));
      setCccdBackFiles(back.map((f: any, idx: number)  => ({ uid: `back-${idx}`,  name: f.file_url, status: 'done', url: f.file_url, file_type: f.file_type })));
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
    mutationFn: ({ id, data }: { id: number; data: any }) => applicationService.updateApplication(id, data),
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
      const newFile = { uid: `${type}-${Date.now()}`, name: file.name, status: 'done', url, file_type: type };
      if (type === 'TRANSCRIPT') setTranscriptFiles(prev => [...prev, newFile]);
      if (type === 'CCCD_FRONT') setCccdFrontFiles(prev => [...prev, newFile]);
      if (type === 'CCCD_BACK')  setCccdBackFiles(prev => [...prev, newFile]);
      message.success('Tải lên thành công');
    } catch {
      message.error('Tải lên thất bại');
    }
    return false;
  };

  const buildFilesPayload = () =>
    [...transcriptFiles, ...cccdFrontFiles, ...cccdBackFiles].map(f => ({ file_url: f.url, file_type: f.file_type }));

  const calculateTotalScore = (scores: Record<string, string | number>) =>
    Object.values(scores).reduce((sum: number, val) => sum + (Number(val) || 0), 0);

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        school_id: selectedSchool, major_id: selectedMajor, subject_group_id: selectedSubjectGroup,
        full_name: values.fullName, dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        phone: values.phone, cccd_number: values.cccdNumber,
        score: values.scores ? calculateTotalScore(values.scores) : 0,
        scores: values.scores, priority: priorityMap[values.priority], files: buildFilesPayload(),
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

  const submitApplication = async () => {
    try {
      const values = await form.validateFields();
      let applicationId = Number(id);
      const payload = {
        school_id: selectedSchool, major_id: selectedMajor, subject_group_id: selectedSubjectGroup,
        full_name: values.fullName, dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        phone: values.phone, cccd_number: values.cccdNumber,
        score: values.scores ? calculateTotalScore(values.scores) : 0,
        scores: values.scores, priority: priorityMap[values.priority], files: buildFilesPayload(),
      };
      console.log('Payload nộp hồ sơ:', payload);
      if (!isEdit) {
        const res = await createMutation.mutateAsync(payload);
        applicationId = res.data.id;
      } else {
        await updateMutation.mutateAsync({ id: Number(id), data: payload });
        applicationId = Number(id);
      }
      await submitMutation.mutateAsync(applicationId);
    } catch (err) {
      console.error('Nộp hồ sơ thất bại', err);
    }
  };

  const handleSubmitWithConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận nộp hồ sơ',
      content: 'Bạn chắc chắn muốn nộp hồ sơ? Sau khi nộp bạn không thể sửa hoặc xóa hồ sơ này nữa.',
      okText: 'Đồng ý nộp',
      cancelText: 'Hủy',
      okButtonProps: { className: '!bg-[#B30000] !border-[#B30000] hover:!bg-[#E60000]' },
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

  /* ── Loading ── */
  if (loadingApp) {
    return (
      <div className="min-h-screen bg-gray-50/80 p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton active paragraph={{ rows: 5 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/candidate/applications')}
            className="!rounded-xl !border-gray-200 hover:!border-[#B30000] hover:!text-[#B30000]"
          >
            Quay lại
          </Button>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <h1 className="text-xl font-bold text-gray-800 m-0 leading-tight">
              {isEdit ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ mới'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Đang chỉnh sửa hồ sơ #${id}` : 'Điền đầy đủ thông tin để nộp hồ sơ xét tuyển'}
            </p>
          </div>
        </div>

        {/* ── Form ── */}
        <Form form={form} layout="vertical" requiredMark={false}>

          {/* 1. Thông tin cá nhân */}
          <Section step={1} title="Thông tin cá nhân" icon={<UserOutlined />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Form.Item
                name="fullName"
                label={<span className="text-sm font-medium text-gray-600">Họ và tên</span>}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-300" />}
                  placeholder="Nguyễn Văn A"
                  className="!rounded-xl"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span className="text-sm font-medium text-gray-600">Số điện thoại</span>}
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-gray-300" />}
                  placeholder="0123456789"
                  className="!rounded-xl"
                />
              </Form.Item>

              <Form.Item
                name="dob"
                label={<span className="text-sm font-medium text-gray-600">Ngày sinh</span>}
                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                  className="!rounded-xl !w-full"
                  suffixIcon={<CalendarOutlined className="text-gray-300" />}
                />
              </Form.Item>

              <Form.Item
                name="cccdNumber"
                label={<span className="text-sm font-medium text-gray-600">Số CCCD</span>}
                rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-gray-300" />}
                  placeholder="079123456789"
                  className="!rounded-xl"
                />
              </Form.Item>
            </div>
          </Section>

          {/* 2. Thông tin xét tuyển */}
          <div className="mt-5">
            <Section step={2} title="Trường – Ngành – Tổ hợp" icon={<BankOutlined />}>
              <Form.Item
                label={<span className="text-sm font-medium text-gray-600">Chọn Trường / Ngành / Tổ hợp môn</span>}
                required
              >
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

              <Form.Item
                name="priority"
                label={<span className="text-sm font-medium text-gray-600">Đối tượng ưu tiên</span>}
                rules={[{ required: true, message: 'Vui lòng chọn đối tượng ưu tiên' }]}
              >
                <Select
                  placeholder="Chọn khu vực ưu tiên"
                  className="!rounded-xl"
                  suffixIcon={<StarOutlined className="text-gray-300" />}
                >
                  <Option value="KV1">Khu vực 1</Option>
                  <Option value="KV2">Khu vực 2</Option>
                  <Option value="KV2-NT">Khu vực 2 – Nông thôn</Option>
                  <Option value="KV3">Khu vực 3</Option>
                </Select>
              </Form.Item>
            </Section>
          </div>

          {/* 3. Điểm các môn */}
          {subjects.length > 0 && (
            <div className="mt-5">
              <Section step={3} title="Bảng điểm" icon={<StarOutlined />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {subjects.map(subject => (
                    <Form.Item
                      key={subject}
                      name={['scores', subject]}
                      label={<span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{subject}</span>}
                      rules={[{ required: true, message: `Nhập điểm ${subject}` }]}
                      className="!mb-2"
                    >
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.25}
                        placeholder="0 – 10"
                        className="!rounded-xl !text-center !font-bold !text-[#B30000]"
                      />
                    </Form.Item>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* 4. Minh chứng */}
          <div className="mt-5">
            <Section step={subjects.length > 0 ? 4 : 3} title="Minh chứng đính kèm" icon={<FileTextOutlined />}>

              {/* Học bạ */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-600 mb-2">Học bạ / Bảng điểm</p>
                <Upload
                  listType="picture-card"
                  fileList={transcriptFiles}
                  onRemove={(file) => setTranscriptFiles(prev => prev.filter(f => f.uid !== file.uid))}
                  beforeUpload={(file) => handleUpload(file, 'TRANSCRIPT')}
                  accept="image/*,application/pdf"
                  className="upload-list-inline"
                >
                  {transcriptFiles.length < 5 && (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <PlusOutlined className="text-lg" />
                      <span className="text-xs">Tải lên</span>
                    </div>
                  )}
                </Upload>
                <UploadHint>Tối đa 5 file · Ảnh hoặc PDF</UploadHint>
              </div>

              {/* CCCD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <IdcardFilled className="text-[#B30000] text-xs" /> CCCD mặt trước
                  </p>
                  <Upload
                    listType="picture-card"
                    fileList={cccdFrontFiles}
                    onRemove={(file) => setCccdFrontFiles(prev => prev.filter(f => f.uid !== file.uid))}
                    beforeUpload={(file) => handleUpload(file, 'CCCD_FRONT')}
                    accept="image/*,application/pdf"
                  >
                    {cccdFrontFiles.length < 1 && (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <PlusOutlined className="text-lg" />
                        <span className="text-xs">Tải lên</span>
                      </div>
                    )}
                  </Upload>
                  <UploadHint>1 ảnh rõ nét, đủ 4 góc</UploadHint>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                    <IdcardFilled className="text-[#0038F7] text-xs" /> CCCD mặt sau
                  </p>
                  <Upload
                    listType="picture-card"
                    fileList={cccdBackFiles}
                    onRemove={(file) => setCccdBackFiles(prev => prev.filter(f => f.uid !== file.uid))}
                    beforeUpload={(file) => handleUpload(file, 'CCCD_BACK')}
                    accept="image/*,application/pdf"
                  >
                    {cccdBackFiles.length < 1 && (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <PlusOutlined className="text-lg" />
                        <span className="text-xs">Tải lên</span>
                      </div>
                    )}
                  </Upload>
                  <UploadHint>1 ảnh rõ nét, đủ 4 góc</UploadHint>
                </div>
              </div>
            </Section>
          </div>

          {/* ── Action Bar ── */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-[#B30000] rounded-full" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide m-0">Hoàn tất</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                icon={<SaveOutlined />}
                size="large"
                onClick={handleSaveDraft}
                loading={createMutation.isPending || updateMutation.isPending}
                className="!rounded-xl !border-gray-300 hover:!border-[#B30000] hover:!text-[#B30000] flex-1 sm:flex-none"
              >
                Lưu nháp
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="large"
                onClick={handleSubmitWithConfirm}
                loading={submitMutation.isPending}
                className="!rounded-xl !bg-[#B30000] !border-[#B30000] hover:!bg-[#E60000] hover:!border-[#E60000] flex-1 sm:flex-none"
              >
                Nộp hồ sơ
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Sau khi nộp, hồ sơ sẽ chuyển sang trạng thái <strong>Chờ duyệt</strong> và bạn sẽ nhận email xác nhận.
            </p>
          </div>

        </Form>
      </div>
    </div>
  );
};

export default ApplicationForm;