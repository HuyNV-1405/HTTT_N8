import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class ProductController {
  static async getAll(req: Request, res: Response) {
    try {
      const { search, loaiHangId, nhaCungCapId } = req.query;
      const products = await ProductService.getAllProducts({
        search: search as string,
        loaiHangId: loaiHangId as string,
        nhaCungCapId: nhaCungCapId as string,
      });
      return sendSuccess(res, products, 'Lấy danh sách hàng hóa thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      return sendSuccess(res, product, 'Lấy thông tin hàng hóa thành công');
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const product = await ProductService.createProduct(req.body);
      return sendSuccess(res, product, 'Thêm mới hàng hóa thành công', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);
      return sendSuccess(res, product, 'Cập nhật hàng hóa thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);
      return sendSuccess(res, null, 'Ngưng hoạt động hàng hóa thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await ProductService.getAllCategories();
      return sendSuccess(res, categories, 'Lấy danh mục thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await ProductService.getAllSuppliers();
      return sendSuccess(res, suppliers, 'Lấy nhà cung cấp thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  static async getCustomers(req: Request, res: Response) {
    try {
      const customers = await ProductService.getAllCustomers();
      return sendSuccess(res, customers, 'Lấy danh sách khách hàng thành công');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

