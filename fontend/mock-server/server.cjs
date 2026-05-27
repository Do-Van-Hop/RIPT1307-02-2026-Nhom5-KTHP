// mock-server/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'mock_secret_key';

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cấu hình multer lưu ảnh vào thư mục uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ========== DỮ LIỆU MOCK ==========
const users = [
  { id: 1, email: 'candidate@test.com', password: '123456', role: 'candidate' },
  { id: 2, email: 'admin@test.com', password: '123456', role: 'admin' }
];

let schools = [
  { id: 1, name: 'Trường Đại học Bách Khoa', code: 'BK' },
  { id: 2, name: 'Trường Đại học Kinh tế', code: 'KT' },
];

let majors = [
  { id: 1, name: 'Công nghệ thông tin', code: 'CNTT', schoolId: 1, subjectGroupIds: [1, 2] },
  { id: 2, name: 'Kỹ thuật điện', code: 'KTD', schoolId: 1, subjectGroupIds: [1] },
  { id: 3, name: 'Quản trị kinh doanh', code: 'QTKD', schoolId: 2, subjectGroupIds: [2] },
];

let subjectGroups = [
  { id: 1, name: 'A00', subjects: ['Toán', 'Lý', 'Hóa'] },
  { id: 2, name: 'A01', subjects: ['Toán', 'Lý', 'Anh'] },
];

let applications = [
  {
    id: 1,
    userId: 1,
    schoolId: 1,
    majorId: 1,
    subjectGroupId: 1,
    scores: { Toán: 9, Lý: 8.5, Hóa: 7 },
    priority: 'KV1',
    status: 'PENDING',
    documents: [],
    submittedAt: new Date().toISOString(),
    rejectReason: null,
    createdAt: new Date().toISOString(),
  },
];

// ========== MIDDLEWARE AUTH ==========
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ========== API ==========

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email đã tồn tại' });
  const newUser = { id: users.length + 1, email, password, role: 'candidate' };
  users.push(newUser);
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ user: { id: newUser.id, email: newUser.email, role: newUser.role }, token });
});

// SCHOOLS
app.get('/api/schools', authenticate, (req, res) => res.json(schools));
app.post('/api/schools', authenticate, authorize('admin'), (req, res) => {
  const { name, code } = req.body;
  const newSchool = { id: schools.length + 1, name, code };
  schools.push(newSchool);
  res.status(201).json(newSchool);
});
app.put('/api/schools/:id', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = schools.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  schools[index] = { ...schools[index], ...req.body };
  res.json(schools[index]);
});
app.delete('/api/schools/:id', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  schools = schools.filter(s => s.id !== id);
  res.json({ success: true });
});

// MAJORS
app.get('/api/majors', authenticate, (req, res) => {
  const { schoolId } = req.query;
  if (schoolId) return res.json(majors.filter(m => m.schoolId === parseInt(schoolId)));
  res.json(majors);
});
app.post('/api/majors', authenticate, authorize('admin'), (req, res) => {
  const { name, code, schoolId, subjectGroupIds } = req.body;
  const newMajor = { id: majors.length + 1, name, code, schoolId, subjectGroupIds: subjectGroupIds || [] };
  majors.push(newMajor);
  res.status(201).json(newMajor);
});
app.put('/api/majors/:id', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = majors.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  majors[index] = { ...majors[index], ...req.body };
  res.json(majors[index]);
});
app.delete('/api/majors/:id', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  majors = majors.filter(m => m.id !== id);
  res.json({ success: true });
});

// SUBJECT GROUPS
app.get('/api/subject-groups', authenticate, (req, res) => res.json(subjectGroups));
app.get('/api/subject-groups/:id', authenticate, (req, res) => {
  const sg = subjectGroups.find(s => s.id === parseInt(req.params.id));
  if (!sg) return res.status(404).json({ message: 'Not found' });
  res.json(sg);
});
app.post('/api/subject-groups', authenticate, authorize('admin'), (req, res) => {
  const { name, subjects } = req.body;
  const newSG = { id: subjectGroups.length + 1, name, subjects };
  subjectGroups.push(newSG);
  res.status(201).json(newSG);
});
app.put('/api/subject-groups/:id', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = subjectGroups.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  subjectGroups[index] = { ...subjectGroups[index], ...req.body };
  res.json(subjectGroups[index]);
});
app.delete('/api/subject-groups/:id', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  subjectGroups = subjectGroups.filter(s => s.id !== id);
  res.json({ success: true });
});

// APPLICATIONS
app.get('/api/applications', authenticate, authorize('admin'), (req, res) => {
  // Lọc theo query params
  let result = [...applications];
  if (req.query.schoolId) result = result.filter(a => a.schoolId === parseInt(req.query.schoolId));
  if (req.query.majorId) result = result.filter(a => a.majorId === parseInt(req.query.majorId));
  if (req.query.status) result = result.filter(a => a.status === req.query.status);
  // Gắn thêm school, major, subjectGroup, user
  result = result.map(a => ({
    ...a,
    school: schools.find(s => s.id === a.schoolId),
    major: majors.find(m => m.id === a.majorId),
    subjectGroup: subjectGroups.find(s => s.id === a.subjectGroupId),
    user: users.find(u => u.id === a.userId),
  }));
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const items = result.slice(start, start + limit);
  res.json({ items, total: result.length });
});

app.get('/api/applications/my', authenticate, authorize('candidate'), (req, res) => {
  const myApps = applications.filter(a => a.userId === req.user.id).map(a => ({
    ...a,
    school: schools.find(s => s.id === a.schoolId),
    major: majors.find(m => m.id === a.majorId),
    subjectGroup: subjectGroups.find(s => s.id === a.subjectGroupId),
  }));
  res.json(myApps);
});

app.get('/api/applications/:id', authenticate, (req, res) => {
  const app = applications.find(a => a.id === parseInt(req.params.id));
  if (!app) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'candidate' && app.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  res.json({
    ...app,
    school: schools.find(s => s.id === app.schoolId),
    major: majors.find(m => m.id === app.majorId),
    subjectGroup: subjectGroups.find(s => s.id === app.subjectGroupId),
    user: users.find(u => u.id === app.userId),
  });
});

app.post('/api/applications', authenticate, authorize('candidate'), (req, res) => {
  const { schoolId, majorId, subjectGroupId, scores, priority, documents, status } = req.body;
  const newApp = {
    id: applications.length + 1,
    userId: req.user.id,
    schoolId,
    majorId,
    subjectGroupId,
    scores: scores || {},
    priority,
    documents: documents || [],
    status: status || 'DRAFT',
    submittedAt: status === 'SUBMITTED' ? new Date().toISOString() : null,
    rejectReason: null,
  };
  applications.push(newApp);
  res.status(201).json(newApp);
});

app.put('/api/applications/:id', authenticate, authorize('candidate'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = applications.findIndex(a => a.id === id && a.userId === req.user.id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  applications[index] = { ...applications[index], ...req.body };
  if (req.body.status === 'SUBMITTED') applications[index].submittedAt = new Date().toISOString();
  res.json(applications[index]);
});

app.delete('/api/applications/:id', authenticate, authorize('candidate'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = applications.findIndex(a => a.id === id && a.userId === req.user.id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  applications.splice(index, 1);
  res.json({ success: true });
});

app.patch('/api/applications/:id/status', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const app = applications.find(a => a.id === id);
  if (!app) return res.status(404).json({ message: 'Not found' });
  app.status = req.body.status;
  app.rejectReason = req.body.reason || null;
  // Gửi email giả (in ra console)
  console.log(`[Email] Gửi tới user #${app.userId}: Hồ sơ #${id} đã ${req.body.status}`);
  res.json(app);
});

app.post('/api/applications/:id/send-email', authenticate, authorize('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { subject, body } = req.body;
  console.log(`[Email thủ công] Hồ sơ #${id}, Tiêu đề: ${subject}, Nội dung: ${body}`);
  res.json({ message: 'Đã gửi email' });
});

// UPLOAD
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.originalname });
});

// STATS
app.get('/api/stats', authenticate, authorize('admin'), (req, res) => {
  const bySchool = schools.map(s => ({
    schoolId: s.id,
    schoolName: s.name,
    count: applications.filter(a => a.schoolId === s.id && a.status !== 'DRAFT').length
  }));
  const byMajor = majors.map(m => ({
    majorId: m.id,
    majorName: m.name,
    schoolName: schools.find(s => s.id === m.schoolId)?.name || '',
    count: applications.filter(a => a.majorId === m.id && a.status !== 'DRAFT').length
  }));
  const byStatus = ['DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'].map(status => ({
    status,
    count: applications.filter(a => a.status === status).length
  }));
  res.json({ bySchool, byMajor, byStatus });
});

// 404 fallback
app.use((req, res) => res.status(404).json({ message: 'API not found' }));

app.listen(PORT, () => {
  console.log(`Mock server chạy tại http://localhost:${PORT}`);
});