import prisma from '../config/prisma';

export async function generateReceiptCode(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // e.g. 202611
  const count = await prisma.phieuNhapKho.count();
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `PN-${dateStr}-${nextNumber}`;
}

export async function generateDispatchCode(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.phieuXuatKho.count();
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `PX-${dateStr}-${nextNumber}`;
}

export async function generateTransferCode(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.phieuChuyenKho.count();
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `PC-${dateStr}-${nextNumber}`;
}

export async function generateAuditCode(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.phieuKiemKe.count();
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `PKK-${dateStr}-${nextNumber}`;
}

