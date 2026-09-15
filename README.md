# SHOP SIM HOÀNG GIA — FULLSTACK

Bản này đã chuyển từ demo localStorage sang kiến trúc thật:
- Website công khai cho khách.
- Backend Node/Express.
- PostgreSQL dùng chung.
- Đơn khách gửi vào database.
- Kho SIM dùng chung cho tất cả khách.
- Khách đặt một SIM thì server khóa trạng thái `reserved` bằng transaction để tránh hai khách cùng chốt một số.
- Trang admin có đăng nhập Basic Auth.
- Thêm/sửa SIM, đánh dấu đã bán, quản lý trạng thái đơn, xuất CSV.
- Render Web Service + PostgreSQL.

## Deploy Render
1. Tạo PostgreSQL database trên Render.
2. Tạo Web Service từ GitHub.
3. Runtime: Node.
4. Build: `npm install`
5. Start: `npm start`
6. Environment Variables:
   - DATABASE_URL = Internal Database URL của PostgreSQL Render
   - ADMIN_USER = tài khoản quản trị
   - ADMIN_PASSWORD = mật khẩu quản trị
7. Deploy.

## Lưu ý
Không dùng localStorage cho kho thật. Kho/đơn nằm trong PostgreSQL.
