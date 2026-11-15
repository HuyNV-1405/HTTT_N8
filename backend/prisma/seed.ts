import { PrismaClient, Role, UserStatus, TrangThaiViTri, TrangThaiPhieu, LoaiCanhBao, TrangThaiCanhBao, LoaiChuyenKho } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu quá trình Seeding dữ liệu cho Hệ thống Quản lý Kho (WMS)...');

  // ========================================================
  // 1. DỌN DẸP DỮ LIỆU CŨ (Clean up tables theo đúng thứ tự FK)
  // ========================================================
  console.log('🧹 Đang làm sạch dữ liệu cũ...');
  await prisma.lichSuThaoTac.deleteMany();
  await prisma.canhBaoTonKho.deleteMany();
  await prisma.chiTietKiemKe.deleteMany();
  await prisma.phieuKiemKe.deleteMany();
  await prisma.chiTietChuyenKho.deleteMany();
  await prisma.phieuChuyenKho.deleteMany();
  await prisma.chiTietXuatKho.deleteMany();
  await prisma.phieuXuatKho.deleteMany();
  await prisma.chiTietNhapKho.deleteMany();
  await prisma.phieuNhapKho.deleteMany();
  await prisma.tonKho.deleteMany();
  await prisma.viTriLuuTru.deleteMany();
  await prisma.khuVuc.deleteMany();
  await prisma.hangHoa.deleteMany();
  await prisma.loaiHang.deleteMany();
  await prisma.khachHang.deleteMany();
  await prisma.nhaCungCap.deleteMany();
  await prisma.kho.deleteMany();
  await prisma.user.deleteMany();

  // ========================================================
  // 2. KHỞI TẠO TÀI KHOẢN NGƯỜI DÙNG & VAI TRÒ (Users)
  // ========================================================
  console.log('👤 Đang tạo danh sách tài khoản người dùng...');
  const salt = bcrypt.genSaltSync(10);

  const admin = await prisma.user.create({
    data: {
      maNV: 'ADMIN01',
      username: 'admin',
      password: bcrypt.hashSync('Admin@123', salt),
      hoTen: 'Nguyễn Văn Quản Trị',
      email: 'admin@wms.com',
      sdt: '0901234567',
      role: Role.ADMIN,
      trangThai: UserStatus.ACTIVE,
    },
  });

  const manager = await prisma.user.create({
    data: {
      maNV: 'QL01',
      username: 'quanlykho',
      password: bcrypt.hashSync('Quanly@123', salt),
      hoTen: 'Trần Đình Trưởng Kho',
      email: 'quanly@wms.com',
      sdt: '0912345678',
      role: Role.QUAN_LY_KHO,
      trangThai: UserStatus.ACTIVE,
    },
  });

  const staff = await prisma.user.create({
    data: {
      maNV: 'NV01',
      username: 'nhanvienkho',
      password: bcrypt.hashSync('Nhanvien@123', salt),
      hoTen: 'Lê Hoàng Nhân Viên',
      email: 'nhanvien@wms.com',
      sdt: '0923456789',
      role: Role.NHAN_VIEN_KHO,
      trangThai: UserStatus.ACTIVE,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      maNV: 'MH01',
      username: 'muahang',
      password: bcrypt.hashSync('Muahang@123', salt),
      hoTen: 'Phạm Thu Mua Hàng',
      email: 'muahang@wms.com',
      sdt: '0934567890',
      role: Role.NHAN_VIEN_MUA_HANG,
      trangThai: UserStatus.ACTIVE,
    },
  });

  const seller = await prisma.user.create({
    data: {
      maNV: 'BH01',
      username: 'banhang',
      password: bcrypt.hashSync('Banhang@123', salt),
      hoTen: 'Vũ Thị Kinh Doanh',
      email: 'kinhdoanh@wms.com',
      sdt: '0945678901',
      role: Role.NHAN_VIEN_BAN_HANG,
      trangThai: UserStatus.ACTIVE,
    },
  });

  // ========================================================
  // 3. MASTER DATA: DANH MỤC HÀNG HÓA (LoaiHang)
  // ========================================================
  console.log('🏷️ Đang tạo danh mục hàng hóa...');
  const catDienTu = await prisma.loaiHang.create({
    data: {
      maLoai: 'LH-DIENTU',
      tenLoai: 'Thiết Bị Điện Tử & Công Nghệ',
      moTa: 'Điện thoại, máy tính bảng, linh kiện và phụ kiện điện tử',
    },
  });

  const catGiaDung = await prisma.loaiHang.create({
    data: {
      maLoai: 'LH-GIADUNG',
      tenLoai: 'Điện Gia Dụng & Nhà Cửa',
      moTa: 'Nồi cơm điện, quạt máy, ấm siêu tốc, máy xay sinh tố',
    },
  });

  const catThucPham = await prisma.loaiHang.create({
    data: {
      maLoai: 'LH-THUCPHAM',
      tenLoai: 'Thực Phẩm & Đồ Uống',
      moTa: 'Thực phẩm khô, sữa tiệt trùng, nước uống đóng chai',
    },
  });

  const catHoaMyPham = await prisma.loaiHang.create({
    data: {
      maLoai: 'LH-HOAMYPHAM',
      tenLoai: 'Hóa Mỹ Phẩm & Chăm Sóc Nhà Cửa',
      moTa: 'Nước giặt, xà phòng, dầu gội, nước rửa chén',
    },
  });

  // ========================================================
  // 4. MASTER DATA: NHÀ CUNG CẤP & KHÁCH HÀNG
  // ========================================================
  console.log('🏢 Đang tạo Nhà cung cấp & Khách hàng...');
  const nccSamsung = await prisma.nhaCungCap.create({
    data: {
      maNCC: 'NCC-SS',
      tenNCC: 'Công ty TNHH Samsung Electronics Việt Nam',
      sdt: '0243888999',
      email: 'contact@samsung.com.vn',
      diaChi: 'KCN Yên Phong 1, Yên Phong, Bắc Ninh',
      nguoiLienHe: 'Mr. Park / Trưởng đại diện',
    },
  });

  const nccSunhouse = await prisma.nhaCungCap.create({
    data: {
      maNCC: 'NCC-SUN',
      tenNCC: 'Công ty Cổ phần Tập đoàn Sunhouse',
      sdt: '0243736666',
      email: 'sales@sunhouse.com.vn',
      diaChi: 'Tầng 12, Tòa nhà Richy, Cầu Giấy, Hà Nội',
      nguoiLienHe: 'Bà Nguyễn Thị Mai',
    },
  });

  const nccVinamilk = await prisma.nhaCungCap.create({
    data: {
      maNCC: 'NCC-VNM',
      tenNCC: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      sdt: '0285415555',
      email: 'vinamilk@vinamilk.com.vn',
      diaChi: '10 Tân Trào, Tân Phú, Quận 7, TP. Hồ Chí Minh',
      nguoiLienHe: 'Ông Trần Văn Nam',
    },
  });

  const nccUnilever = await prisma.nhaCungCap.create({
    data: {
      maNCC: 'NCC-ULV',
      tenNCC: 'Công ty TNHH Quốc tế Unilever Việt Nam',
      sdt: '0285413568',
      email: 'careline@unilever.com',
      diaChi: '156 Nguyễn Lương Bằng, Tân Phú, Quận 7, TP. Hồ Chí Minh',
      nguoiLienHe: 'Ms. Hoàng Thanh',
    },
  });

  // Khách hàng
  const khWinmart = await prisma.khachHang.create({
    data: {
      maKH: 'KH-WINMART',
      tenKH: 'Chuỗi Hệ thống Siêu thị WinMart',
      sdt: '02471066866',
      email: 'procurement@winmart.vn',
      diaChi: 'Số 7 Bằng Lăng 1, KĐT Vinhomes Riverside, Long Biên, Hà Nội',
    },
  });

  const khTgdd = await prisma.khachHang.create({
    data: {
      maKH: 'KH-TGDD',
      tenKH: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
      sdt: '02838125960',
      email: 'muahang@thegioididong.com',
      diaChi: 'Tòa nhà MWG, Lô T2-1.2, Đường D1, KCNC, TP. Thủ Đức, TP.HCM',
    },
  });

  const khBachHoaXanh = await prisma.khachHang.create({
    data: {
      maKH: 'KH-BHX',
      tenKH: 'Chuỗi Cửa Hàng Bách Hóa Xanh',
      sdt: '19001908',
      email: 'cskh@bachhoaxanh.com',
      diaChi: '128 Trần Quang Khải, Tân Định, Quận 1, TP.HCM',
    },
  });

  // ========================================================
  // 5. MASTER DATA: SẢN PHẨM HÀNG HÓA (HangHoa)
  // ========================================================
  console.log('📦 Đang tạo danh sách mặt hàng...');
  const spGalaxyS24 = await prisma.hangHoa.create({
    data: {
      maHH: 'SP-SS-S24',
      tenHH: 'Điện thoại thông minh Samsung Galaxy S24 256GB',
      donViTinh: 'Chiếc',
      giaNhap: 16500000,
      giaXuat: 19990000,
      dinhMucToiThieu: 10,
      dinhMucToiDa: 100,
      loaiHangId: catDienTu.id,
      nhaCungCapId: nccSamsung.id,
      moTa: 'Flagship Samsung AI camera 50MP, RAM 8GB, Pin 4000mAh',
    },
  });

  const spMonitor = await prisma.hangHoa.create({
    data: {
      maHH: 'SP-SS-M27',
      tenHH: 'Màn hình máy tính Samsung 27 inch IPS FHD 100Hz',
      donViTinh: 'Chiếc',
      giaNhap: 2800000,
      giaXuat: 3690000,
      dinhMucToiThieu: 15,
      dinhMucToiDa: 120,
      loaiHangId: catDienTu.id,
      nhaCungCapId: nccSamsung.id,
      moTa: 'Màn hình văn phòng viền mỏng chân chữ Y tấm nền IPS',
    },
  });

  const spNoiCom = await prisma.hangHoa.create({
    data: {
      maHH: 'SP-SUN-NC18',
      tenHH: 'Nồi cơm điện tử Sunhouse 1.8L lòng nồi chống dính',
      donViTinh: 'Chiếc',
      giaNhap: 680000,
      giaXuat: 920000,
      dinhMucToiThieu: 20,
      dinhMucToiDa: 200,
      loaiHangId: catGiaDung.id,
      nhaCungCapId: nccSunhouse.id,
      moTa: 'Nồi cơm nhiều chế độ nấu, hẹn giờ 24h, công suất 860W',
    },
  });

  const spQuat = await prisma.hangHoa.create({
    data: {
      maHH: 'SP-SUN-QT01',
      tenHH: 'Quạt điều hòa làm mát không khí Sunhouse SHD7727',
      donViTinh: 'Chiếc',
      giaNhap: 1850000,
      giaXuat: 2490000,
      dinhMucToiThieu: 10, // Sẽ tạo tồn thực tế = 4 để kích hoạt CẢNH BÁO TỒN THẤP
      dinhMucToiDa: 80,
      loaiHangId: catGiaDung.id,
      nhaCungCapId: nccSunhouse.id,
      moTa: 'Dung tích bình chứa 40L, diện tích làm mát 35m2',
    },
  });

  const spSuaVnm = await prisma.hangHoa.create({
    data: {
      maHH: 'SP-VNM-SUA1L',
      tenHH: 'Sữa tươi tiệt trùng Vinamilk 100% 1L (Thùng 12 hộp)',
      donViTinh: 'Thùng',
      giaNhap: 310000,
      giaXuat: 380000,
      dinhMucToiThieu: 30,
      dinhMucToiDa: 300,
      loaiHangId: catThucPham.id,
      nhaCungCapId: nccVinamilk.id,
      moTa: 'Sữa tươi nguyên chất có đường tiệt trùng công nghệ UHT',
    },
  });

  const spOmo = await prisma.hangHoa.create({
    data: {
      maHH: 'SP-ULV-OMO36',
      tenHH: 'Nước giặt OMO Matic Chuyên Gia Cửa Trước Túi 3.6kg',
      donViTinh: 'Túi',
      giaNhap: 145000,
      giaXuat: 185000,
      dinhMucToiThieu: 25,
      dinhMucToiDa: 250,
      loaiHangId: catHoaMyPham.id,
      nhaCungCapId: nccUnilever.id,
      moTa: 'Xoáy bay vết bẩn cứng đầu, bảo vệ màu vải',
    },
  });

  // ========================================================
  // 6. SƠ ĐỒ KHO & VỊ TRÍ LƯU TRỮ (HỆ THỐNG 1 KHO DUY NHẤT THEO ERD)
  // Sơ đồ: Kho -> Khu vực -> Kệ -> Tầng -> Ô
  // ========================================================
  console.log('🗺️ Đang thiết lập 1 kho duy nhất và hệ thống vị trí (Khu vực, Kệ, Tầng, Ô)...');

  // Kho Tổng Trung Tâm (Kho duy nhất của hệ thống)
  const khoTong = await prisma.kho.create({
    data: {
      maKho: 'KHO-TONG',
      tenKho: 'Kho Tổng Trung Tâm',
      diaChi: 'Lô CN5, Cụm Công nghiệp Ngọc Hồi, Thanh Trì, Hà Nội',
      nguoiQuanLyId: manager.id,
    },
  });

  // Các khu vực trong kho duy nhất:
  const kvElectronics = await prisma.khuVuc.create({
    data: {
      maKhuVuc: 'KV-A',
      tenKhuVuc: 'Khu A - Thiết Bị Điện Tử & Giá Trị Cao',
      khoId: khoTong.id,
      moTa: 'Phòng kín, có camera giám sát và kiểm soát độ ẩm',
    },
  });

  const kvGiadung = await prisma.khuVuc.create({
    data: {
      maKhuVuc: 'KV-B',
      tenKhuVuc: 'Khu B - Hàng Điện Gia Dụng & Cồng Kềnh',
      khoId: khoTong.id,
      moTa: 'Khu kệ cao tầng, có lối xe nâng di chuyển chuyên dụng',
    },
  });

  const kvTieuDung = await prisma.khuVuc.create({
    data: {
      maKhuVuc: 'KV-C',
      tenKhuVuc: 'Khu C - Hàng Tiêu Dùng & Thực Phẩm Khô',
      khoId: khoTong.id,
      moTa: 'Khu bảo quản tiêu chuẩn thoáng mát, pallet sàn',
    },
  });

  // Các ô lưu trữ trong kho:
  // Khu A:
  const viTriKVA_K1_T1_O1 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVA-K1-T1-O1',
      khoId: khoTong.id,
      khuVucId: kvElectronics.id,
      ke: 'K1',
      tang: 'T1',
      o: 'O1',
      sucChua: 100,
      trangThai: TrangThaiViTri.PARTIAL,
      moTa: 'Kệ 1, Tầng 1, Ô 1 - Chuyên chứa điện thoại smartphone',
    },
  });

  const viTriKVA_K1_T1_O2 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVA-K1-T1-O2',
      khoId: khoTong.id,
      khuVucId: kvElectronics.id,
      ke: 'K1',
      tang: 'T1',
      o: 'O2',
      sucChua: 100,
      trangThai: TrangThaiViTri.EMPTY,
      moTa: 'Kệ 1, Tầng 1, Ô 2 - Ô trống dự phòng nhận hàng chuyển vị trí',
    },
  });

  const viTriKVA_K1_T2_O1 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVA-K1-T2-O1',
      khoId: khoTong.id,
      khuVucId: kvElectronics.id,
      ke: 'K1',
      tang: 'T2',
      o: 'O1',
      sucChua: 80,
      trangThai: TrangThaiViTri.PARTIAL,
      moTa: 'Kệ 1, Tầng 2, Ô 1 - Chứa màn hình hiển thị',
    },
  });

  // Khu B:
  const viTriKVB_K1_T1_O1 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVB-K1-T1-O1',
      khoId: khoTong.id,
      khuVucId: kvGiadung.id,
      ke: 'K1',
      tang: 'T1',
      o: 'O1',
      sucChua: 150,
      trangThai: TrangThaiViTri.PARTIAL,
      moTa: 'Kệ 1, Tầng 1, Ô 1 - Chứa nồi cơm điện tử',
    },
  });

  const viTriKVB_K1_T1_O2 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVB-K1-T1-O2',
      khoId: khoTong.id,
      khuVucId: kvGiadung.id,
      ke: 'K1',
      tang: 'T1',
      o: 'O2',
      sucChua: 50,
      trangThai: TrangThaiViTri.PARTIAL,
      moTa: 'Kệ 1, Tầng 1, Ô 2 - Chứa quạt điều hòa (Sắp hết)',
    },
  });

  // Khu C:
  const viTriKVC_K1_T1_O1 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVC-K1-T1-O1',
      khoId: khoTong.id,
      khuVucId: kvTieuDung.id,
      ke: 'K1',
      tang: 'T1',
      o: 'O1',
      sucChua: 200,
      trangThai: TrangThaiViTri.PARTIAL,
      moTa: 'Kệ 1, Tầng 1, Ô 1 - Chứa sữa Vinamilk',
    },
  });

  const viTriKVC_K1_T1_O2 = await prisma.viTriLuuTru.create({
    data: {
      maViTri: 'KHO-KVC-K1-T1-O2',
      khoId: khoTong.id,
      khuVucId: kvTieuDung.id,
      ke: 'K1',
      tang: 'T1',
      o: 'O2',
      sucChua: 200,
      trangThai: TrangThaiViTri.PARTIAL,
      moTa: 'Kệ 1, Tầng 1, Ô 2 - Chứa nước giặt Omo',
    },
  });

  // ========================================================
  // 7. SỔ TỒN KHO BAN ĐẦU (TonKho tại từng vị trí ô)
  // ========================================================
  console.log('📊 Đang ghi nhận tồn kho thực tế ban đầu tại các vị trí ô...');

  // 1. Điện thoại Samsung Galaxy S24: Vị trí KHO-KVA-K1-T1-O1, Tồn: 45 chiếc
  await prisma.tonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spGalaxyS24.id,
      viTriId: viTriKVA_K1_T1_O1.id,
      soLuongTon: 45,
      soLuongKhaDung: 45,
      soLuongTamGiu: 0,
    },
  });

  // 2. Màn hình Samsung 27 inch: Vị trí KHO-KVA-K1-T2-O1, Tồn: 60 chiếc
  await prisma.tonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spMonitor.id,
      viTriId: viTriKVA_K1_T2_O1.id,
      soLuongTon: 60,
      soLuongKhaDung: 60,
      soLuongTamGiu: 0,
    },
  });

  // 3. Nồi cơm Sunhouse: Vị trí KHO-KVB-K1-T1-O1, Tồn: 85 chiếc
  await prisma.tonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spNoiCom.id,
      viTriId: viTriKVB_K1_T1_O1.id,
      soLuongTon: 85,
      soLuongKhaDung: 85,
      soLuongTamGiu: 0,
    },
  });

  // 4. Quạt làm mát Sunhouse: Vị trí KHO-KVB-K1-T1-O2, Tồn: 4 chiếc (Định mức tối thiểu là 10 => CẢNH BÁO TỒN THẤP)
  await prisma.tonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spQuat.id,
      viTriId: viTriKVB_K1_T1_O2.id,
      soLuongTon: 4,
      soLuongKhaDung: 4,
      soLuongTamGiu: 0,
    },
  });

  // 5. Sữa Vinamilk: Vị trí KHO-KVC-K1-T1-O1, Tồn: 150 thùng
  await prisma.tonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spSuaVnm.id,
      viTriId: viTriKVC_K1_T1_O1.id,
      soLuongTon: 150,
      soLuongKhaDung: 150,
      soLuongTamGiu: 0,
    },
  });

  // 6. Nước giặt OMO: Vị trí KHO-KVC-K1-T1-O2, Tồn: 110 túi
  await prisma.tonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spOmo.id,
      viTriId: viTriKVC_K1_T1_O2.id,
      soLuongTon: 110,
      soLuongKhaDung: 110,
      soLuongTamGiu: 0,
    },
  });

  // ========================================================
  // 8. TỰ ĐỘNG SINH CẢNH BÁO TỒN KHO (CanhBaoTonKho)
  // ========================================================
  console.log('⚠️ Đang tạo cảnh báo tồn kho mẫu...');
  await prisma.canhBaoTonKho.create({
    data: {
      khoId: khoTong.id,
      hangHoaId: spQuat.id,
      loaiCanhBao: LoaiCanhBao.DUOI_MUC_TOI_THIEU,
      mucTonHienTai: 4,
      mucTonToiThieu: 10,
      mucTonToiDa: 80,
      trangThai: TrangThaiCanhBao.CHUA_XU_LY,
      noiDung: 'Mặt hàng "Quạt điều hòa làm mát không khí Sunhouse" tại Kho Tổng Trung Tâm chỉ còn 4 chiếc, thấp hơn định mức tối thiểu (10 chiếc). Cần đề xuất nhập thêm hàng!',
    },
  });

  // ========================================================
  // 9. DỮ LIỆU GIAO DỊCH MẪU: PHIẾU NHẬP, PHIẾU XUẤT & PHIẾU CHUYỂN VỊ TRÍ
  // ========================================================
  console.log('📝 Đang tạo các giao dịch mẫu (Phiếu nhập, xuất, chuyển vị trí)...');

  // Phiếu Nhập 1: Đã duyệt (APPROVED) - Lô hàng Samsung S24
  await prisma.phieuNhapKho.create({
    data: {
      maPN: 'PN-202611-001',
      ngayNhap: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
      khoId: khoTong.id,
      nhaCungCapId: nccSamsung.id,
      nguoiLapId: buyer.id,
      nguoiDuyetId: manager.id,
      ngayDuyet: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      trangThai: TrangThaiPhieu.APPROVED,
      ketQuaKiemTra: 'Hàng nguyên seal, đủ số lượng theo hóa đơn, tem chống hàng giả đầy đủ',
      tongTien: 45 * 16500000,
      ghiChu: 'Nhập lô hàng chính hãng Samsung đợt 1 tháng 11',
      chiTiet: {
        create: [
          {
            hangHoaId: spGalaxyS24.id,
            viTriId: viTriKVA_K1_T1_O1.id,
            slYeuCau: 45,
            slThucNhap: 45,
            donGiaNhap: 16500000,
            thanhTien: 45 * 16500000,
            ghiChu: 'Đã cất gọn vào Ô O1 Kệ K1 Tầng 1 Khu A',
          },
        ],
      },
    },
  });

  // Phiếu Nhập 2: Đang chờ duyệt (PENDING) - Thử nghiệm duyệt
  await prisma.phieuNhapKho.create({
    data: {
      maPN: 'PN-202611-002',
      ngayNhap: new Date(),
      khoId: khoTong.id,
      nhaCungCapId: nccSunhouse.id,
      nguoiLapId: buyer.id,
      trangThai: TrangThaiPhieu.PENDING,
      ketQuaKiemTra: 'Đã kiểm đếm ngoại quan, hàng mới 100%, đang chờ trưởng kho duyệt nhập sổ',
      tongTien: 30 * 680000,
      ghiChu: 'Yêu cầu nhập bổ sung 30 nồi cơm điện tử Sunhouse',
      chiTiet: {
        create: [
          {
            hangHoaId: spNoiCom.id,
            viTriId: viTriKVB_K1_T1_O1.id,
            slYeuCau: 30,
            slThucNhap: 30,
            donGiaNhap: 680000,
            thanhTien: 30 * 680000,
            ghiChu: 'Dự kiến xếp vào kệ K1 Tầng 1 Khu B',
          },
        ],
      },
    },
  });

  // Phiếu Xuất 1: Đang chờ duyệt (PENDING) - Xuất hàng cho Thế Giới Di Động
  await prisma.phieuXuatKho.create({
    data: {
      maPX: 'PX-202611-001',
      ngayXuat: new Date(),
      khoId: khoTong.id,
      khachHangId: khTgdd.id,
      nguoiLapId: seller.id,
      trangThai: TrangThaiPhieu.PENDING,
      lyDoXuat: 'Xuất giao hàng theo đơn đặt hàng số DH-TGDD-992',
      tongTien: 10 * 19990000,
      ghiChu: 'Giao gấp trong ca chiều cho chuỗi cửa hàng TGDD',
      chiTiet: {
        create: [
          {
            hangHoaId: spGalaxyS24.id,
            viTriId: viTriKVA_K1_T1_O1.id,
            slYeuCau: 10,
            slThucXuat: 10,
            donGiaXuat: 19990000,
            thanhTien: 10 * 19990000,
            ghiChu: 'Lấy từ ô KHO-KVA-K1-T1-O1',
          },
        ],
      },
    },
  });

  // Phiếu Chuyển Vị Trí 1: Đang chờ duyệt (PENDING) - Chuyển hàng giữa 2 ô trong kho
  await prisma.phieuChuyenKho.create({
    data: {
      maPC: 'PC-202611-001',
      ngayLap: new Date(),
      loaiChuyen: LoaiChuyenKho.NOI_BO_KHO,
      khoNguonId: khoTong.id,
      khoDichId: khoTong.id,
      nguoiLapId: staff.id,
      trangThai: TrangThaiPhieu.PENDING,
      ghiChu: 'Chuyển 5 điện thoại Galaxy S24 từ ô K1-T1-O1 sang ô dự phòng K1-T1-O2 để sắp xếp lại kệ',
      chiTiet: {
        create: [
          {
            hangHoaId: spGalaxyS24.id,
            viTriDiId: viTriKVA_K1_T1_O1.id,  // Vị trí đi (Ô nguồn)
            viTriDenId: viTriKVA_K1_T1_O2.id, // Vị trí đến (Ô đích)
            slChuyen: 5,
            ghiChu: 'Chuyển nội bộ trong Khu A',
          },
        ],
      },
    },
  });

  // ========================================================
  // 10. LỊCH SỬ THAO TÁC HỆ THỐNG (Audit Log)
  // ========================================================
  await prisma.lichSuThaoTac.create({
    data: {
      nguoiDungId: admin.id,
      loaiThaoTac: 'SYSTEM_SEED',
      doiTuong: 'DATABASE',
      doiTuongId: 'INIT',
      noiDung: 'Khởi tạo hệ thống 1 kho tập trung và nạp dữ liệu mẫu ban đầu thành công',
      duLieuThayDoi: {
        version: '1.0.0',
        environment: 'Docker PostgreSQL (1 Kho Duy Nhất)',
      },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Hoàn tất Seeding thành công 100%!');
  console.log('========================================================');
  console.log('DANH SÁCH TÀI KHOẢN MẪU (Mật khẩu đã băm bcrypt):');
  console.log('1. Quản trị viên (Admin):    admin / Admin@123');
  console.log('2. Quản lý kho (Manager):    quanlykho / Quanly@123');
  console.log('3. Nhân viên kho (Staff):     nhanvienkho / Nhanvien@123');
  console.log('4. Nhân viên mua hàng:       muahang / Muahang@123');
  console.log('5. Nhân viên kinh doanh:     banhang / Banhang@123');
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
