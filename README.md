# SHOP SIM HOÀNG GIA — BẢN DEMO CHUẨN

## Cấu trúc
- index.html: website khách hàng
- admin.html: quản trị demo
- css/style.css: giao diện
- js/app.js: tìm kiếm, giỏ, đơn, AI demo
- js/admin.js: quản trị kho và đơn
- data/sims.json: kho SIM mẫu
- assets/: logo/ảnh

## GitHub
Upload toàn bộ nội dung thư mục này lên repository `shop-sim-hoang-gia`.

## Render
Chọn **New → Static Site**, kết nối repository.
- Build Command: để trống
- Publish Directory: `.`
- Branch: `main`

Website sẽ chạy trực tiếp từ GitHub.

## Chức năng demo
- Tìm SIM theo số/từ khóa
- Lọc nhà mạng, giá, dạng số
- Giỏ SIM
- Đăng ký mua/tư vấn
- AI gợi ý từ kho SIM
- Quản trị kho
- Thêm/sửa SIM
- Đánh dấu đã bán/mở bán
- Quản lý đơn demo
- Nhập/xuất CSV
- Cài đặt hotline/Zalo
- Responsive

## Quan trọng
Đây là demo frontend. Dữ liệu quản trị dùng localStorage nên chỉ dùng trên trình duyệt đang mở. Khi triển khai kinh doanh thật, cần backend + database + đăng nhập admin + API AI + nguồn kho SIM thực tế.
