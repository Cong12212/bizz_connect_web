# BizConnect - Business Contact Management System

<div align="center">
  <img src="public/bizzconnect.png" alt="BizConnect Logo" width="200"/>
  
  [![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8.svg)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📋 Tổng quan

**BizConnect** là một hệ thống quản lý liên hệ kinh doanh hiện đại, giúp doanh nghiệp và cá nhân tổ chức, theo dõi và duy trì mối quan hệ với khách hàng, đối tác một cách hiệu quả.

### ✨ Tính năng chính

- 👥 **Quản lý Contacts**: Tạo, chỉnh sửa, xóa và tìm kiếm liên hệ
- 🏷️ **Tags System**: Phân loại contacts theo tags tùy chỉnh
- ⏰ **Reminders**: Đặt lịch nhắc nhở follow-up với contacts
- 🔔 **Notifications**: Thông báo real-time cho các sự kiện quan trọng
- 📇 **Digital Business Card**: Tạo và chia sẻ danh thiếp điện tử
- 🏢 **Company Profile**: Quản lý thông tin công ty
- 📊 **Dashboard**: Thống kê tổng quan về hoạt động
- 📤 **Import/Export**: Nhập/xuất danh sách contacts (Excel, CSV)
- 🌍 **Address Management**: Quản lý địa chỉ theo Country/State/City
- 🔐 **Authentication**: Đăng nhập, đăng ký, xác thực email
- 🔒 **Password Reset**: Quên mật khẩu với xác thực OTP

---

## 🚀 Công nghệ sử dụng

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **React Router v6** - Routing
- **Redux Toolkit** - State Management
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Axios** - HTTP Client

### Backend Integration
- RESTful API
- JWT Authentication
- Laravel Backend (separate repository)

---

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm >= 9.x hoặc yarn >= 1.22.x
- Git

### Các bước cài đặt

1. **Clone repository**
```bash
git clone https://github.com/yourusername/bizconnect.git
cd bizconnect
```

2. **Cài đặt dependencies**
```bash
npm install
# hoặc
yarn install
```

3. **Cấu hình environment variables**

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

4. **Chạy development server**
```bash
npm run dev
# hoặc
yarn dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

5. **Build cho production**
```bash
npm run build
# hoặc
yarn build
```

---

## 🗂️ Cấu trúc dự án
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── contacts/       # Contact management components
│   ├── reminders/      # Reminder components
│   ├── settings/       # Settings components
│   ├── tags/           # Tags components
│   └── ui/             # Reusable UI components
├── features/           # Redux slices
│   └── auth/          # Auth state management
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── pages/             # Page components (Routes)
├── services/          # API services
│   ├── api.ts         # Axios instance
│   ├── auth.ts        # Auth API
│   ├── contacts.ts    # Contacts API
│   ├── reminders.ts   # Reminders API
│   ├── tags.ts        # Tags API
│   └── ...
├── store.ts           # Redux store configuration
└── main.tsx           # Application entry point
```

---

## 🔑 Các tính năng chi tiết

### 1. Authentication
- Đăng ký tài khoản mới
- Đăng nhập với email/password
- Xác thực email qua link
- Quên mật khẩu & reset password với OTP
- Đăng xuất

### 2. Contact Management
- Tạo contact với thông tin đầy đủ (name, email, phone, company, job title...)
- Quản lý địa chỉ theo Country → State → City
- Gắn tags cho contacts
- Tìm kiếm contacts theo tên, email, company, tags
- Sắp xếp theo tên hoặc ngày tạo
- Xem chi tiết contact
- Import contacts từ Excel/CSV
- Export contacts ra Excel/CSV
- Filter contacts theo tags (with/without tag)
- Xóa contacts

### 3. Tags System
- Tạo tags tùy chỉnh
- Đổi tên tags
- Xem số lượng contacts trong mỗi tag
- Xóa tags
- Gắn/bỏ tags cho contacts
- Filter contacts theo nhiều tags (AND/OR mode)

### 4. Reminders
- Tạo reminder cho một hoặc nhiều contacts
- Đặt thời gian nhắc nhở
- Quản lý trạng thái (pending, done, skipped, cancelled)
- Xem danh sách reminders theo status
- Filter theo ngày/tháng
- Bulk actions (mark done, delete nhiều reminders)
- Detach contacts khỏi reminders

### 5. Notifications
- Nhận thông báo real-time
- Phân loại theo unread/read
- Filter theo upcoming/past
- Mark as read
- Bulk mark as read
- Navigate đến nguồn gốc thông báo (contact/reminder)

### 6. Business Card
- Tạo digital business card cá nhân
- Upload avatar
- Liên kết với company profile
- Public/Private sharing
- Unique slug URL
- View count tracking
- QR code sharing (tính năng mở rộng)

### 7. Settings
- Cập nhật thông tin cá nhân
- Quản lý company profile
- Quản lý business card
- Upload company logo
- Quản lý địa chỉ công ty

### 8. Dashboard
- Thống kê tổng số contacts
- Thống kê reminders pending
- Thống kê notifications
- Recent activities
- Partnership growth chart
- Quick actions shortcuts

---

## 🎨 UI/UX Features

- **Responsive Design**: Tối ưu cho mobile, tablet, desktop
- **Dark/Light Mode**: Gradient themes (Sky → Indigo → Purple)
- **Smooth Animations**: Framer Motion transitions
- **Toast Notifications**: Real-time feedback
- **Loading States**: Skeleton screens & spinners
- **Empty States**: Friendly messages khi không có dữ liệu
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation, ARIA labels

---

## 🔐 Authentication Flow
```mermaid
graph TD
    A[User Visit] --> B{Has Token?}
    B -->|No| C[/auth - Login/Register]
    B -->|Yes| D{Verified?}
    D -->|No| E[/verify-email]
    D -->|Yes| F[/dashboard]
    C -->|Success| D
    E -->|Verified| F
```

---

## 📡 API Integration

### Base URL
```
http://localhost:8000/api
```

### Authentication Headers
```javascript
Authorization: Bearer {token}
```

### Main Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Đăng ký tài khoản |
| POST | /auth/login | Đăng nhập |
| GET | /auth/me | Lấy thông tin user |
| POST | /auth/logout | Đăng xuất |
| GET | /contacts | Danh sách contacts |
| POST | /contacts | Tạo contact mới |
| GET | /contacts/{id} | Chi tiết contact |
| PUT | /contacts/{id} | Cập nhật contact |
| DELETE | /contacts/{id} | Xóa contact |
| GET | /tags | Danh sách tags |
| POST | /contacts/{id}/tags | Gắn tags |
| DELETE | /contacts/{contactId}/tags/{tagId} | Bỏ tag |
| GET | /reminders | Danh sách reminders |
| POST | /reminders | Tạo reminder |
| PATCH | /reminders/{id} | Cập nhật reminder |
| DELETE | /reminders/{id} | Xóa reminder |
| GET | /notifications | Danh sách notifications |
| POST | /notifications/{id}/read | Đánh dấu đã đọc |

---

## 🧪 Testing
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

Output sẽ nằm trong thư mục `dist/`

### Deploy lên Vercel
```bash
vercel --prod
```

### Deploy lên Netlify
```bash
netlify deploy --prod
```

### Environment Variables (Production)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng làm theo các bước sau:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Coding Standards
- Sử dụng TypeScript cho type safety
- Follow ESLint rules
- Format code với Prettier
- Viết tests cho features mới
- Comment code phức tạp

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Lead Developer**: [Your Name](https://github.com/yourusername)
- **UI/UX Designer**: [Designer Name]
- **Backend Developer**: [Backend Dev Name]

---

## 📧 Contact & Support

- **Email**: support@bizconnect.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/bizconnect/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bizconnect/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/bizconnect/wiki)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Laravel](https://laravel.com/) (Backend)

---

## 🗺️ Roadmap

- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Email integration (Gmail, Outlook)
- [ ] Advanced search filters
- [ ] Contact groups
- [ ] Activity timeline
- [ ] Export to PDF
- [ ] Mobile app (React Native)
- [ ] WhatsApp/Telegram integration

---

<div align="center">
  Made with ❤️ by BizConnect Team
</div>
